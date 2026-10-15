-- ScholarTrack schema. Run once in Supabase > SQL Editor (safe to re-run).
create extension if not exists pgcrypto;

-- Shared helper: keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ===== Profile (one row per user) =====
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text, nationality text, country_of_residence text,
  current_degree text, current_institution text, field_of_study text, gpa text,
  research_interests text, english_test text, links text, bio text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ===== Opportunities =====
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled opportunity',
  organization text, url text, country text,
  opp_type text not null default 'phd',
  funding text not null default 'unknown',
  deadline date, source text,
  priority text not null default 'medium',
  status text not null default 'saved',
  notes text,
  reminder_date date, follow_up_date date,
  archived boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint opp_status_chk check (status in ('saved','to_prepare','preparing','ready','submitted','interview','accepted','rejected','withdrawn','archived')),
  constraint opp_priority_chk check (priority in ('low','medium','high')),
  constraint opp_type_chk check (opp_type in ('phd','scholarship','masters','postdoc','fellowship','internship','other')),
  constraint opp_funding_chk check (funding in ('full','partial','self','unknown'))
);
create index if not exists opp_user_idx on public.opportunities(user_id, archived, deadline);

-- ===== Documents (metadata; files live in private storage bucket "vault") =====
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  readiness text not null default 'needed',
  notes text,
  file_path text, file_name text, file_size bigint, mime_type text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint doc_cat_chk check (category in ('cv','motivation_letter','research_proposal','transcript','degree_certificate','recommendation_letter','passport','english_certificate','publication','other')),
  constraint doc_ready_chk check (readiness in ('needed','draft','ready'))
);
create index if not exists doc_user_idx on public.documents(user_id);

-- ===== Checklist items (optionally reference an existing document) =====
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  document_id uuid references public.documents(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists chk_opp_idx on public.checklist_items(opportunity_id);

-- ===== Professor contacts =====
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, email text, university text, research_interests text,
  status text not null default 'not_contacted',
  contacted_at date, follow_up_date date, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint contact_status_chk check (status in ('not_contacted','contacted','replied','follow_up_needed','interested','declined','no_response'))
);
create table if not exists public.contact_opportunities (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (contact_id, opportunity_id)
);

-- ===== Templates =====
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'email', name text not null,
  subject text, body text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint tpl_kind_chk check (kind in ('email_initial','email_followup','email_scholarship','email_recommendation','motivation_letter','message','other'))
);

-- ===== Activity log =====
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity text not null, entity_id uuid, message text not null,
  created_at timestamptz not null default now()
);
create index if not exists act_user_idx on public.activity(user_id, created_at desc);

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['profiles','opportunities','documents','checklist_items','contacts','templates'] loop
    execute format('drop trigger if exists trg_touch on public.%I', t);
    execute format('create trigger trg_touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ===== Row Level Security: every row is visible/editable only by its owner =====
do $$ declare t text; begin
  foreach t in array array['profiles','opportunities','documents','checklist_items','contacts','contact_opportunities','templates','activity'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format('create policy owner_all on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Prevent linking another user's rows via foreign keys
create or replace function public.check_checklist_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from opportunities where id = new.opportunity_id and user_id = new.user_id) then
    raise exception 'opportunity does not belong to user'; end if;
  if new.document_id is not null and not exists (select 1 from documents where id = new.document_id and user_id = new.user_id) then
    raise exception 'document does not belong to user'; end if;
  return new;
end $$;
drop trigger if exists trg_chk_owner on public.checklist_items;
create trigger trg_chk_owner before insert or update on public.checklist_items for each row execute function public.check_checklist_owner();

create or replace function public.check_link_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from contacts where id = new.contact_id and user_id = new.user_id)
     or not exists (select 1 from opportunities where id = new.opportunity_id and user_id = new.user_id) then
    raise exception 'link rows must belong to user'; end if;
  return new;
end $$;
drop trigger if exists trg_link_owner on public.contact_opportunities;
create trigger trg_link_owner before insert or update on public.contact_opportunities for each row execute function public.check_link_owner();

-- ===== Private storage bucket for documents =====
insert into storage.buckets (id, name, public, file_size_limit)
values ('vault', 'vault', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

drop policy if exists vault_select on storage.objects;
drop policy if exists vault_insert on storage.objects;
drop policy if exists vault_update on storage.objects;
drop policy if exists vault_delete on storage.objects;
-- Files are stored as <user_id>/<uuid>-<filename>; users can only touch their own folder.
create policy vault_select on storage.objects for select to authenticated using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vault_insert on storage.objects for insert to authenticated with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vault_update on storage.objects for update to authenticated using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vault_delete on storage.objects for delete to authenticated using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
