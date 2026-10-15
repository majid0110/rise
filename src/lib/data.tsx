import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Activity, ChecklistItem, Contact, ContactLink, DocumentRec, Opportunity, Profile, Template } from './types';
import { DEFAULT_CHECKLIST, statusLabel } from './constants';
import { emptyToNull, errMsg } from './util';

interface DataState {
  loading: boolean; error: string | null; userId: string; userEmail: string;
  opps: Opportunity[]; checklist: ChecklistItem[]; docs: DocumentRec[]; contacts: Contact[]; links: ContactLink[];
  templates: Template[]; activity: Activity[]; profile: Profile | null;
  reload: () => Promise<void>;
  saveOpp: (o: Partial<Opportunity> & { id?: string }) => Promise<Opportunity | null>;
  setOppStatus: (o: Opportunity, status: Opportunity['status']) => Promise<void>;
  archiveOpp: (o: Opportunity, archived: boolean) => Promise<void>;
  deleteOpp: (o: Opportunity) => Promise<void>;
  addChecklist: (oppId: string, title: string, docId?: string | null) => Promise<void>;
  addDefaultChecklist: (oppId: string) => Promise<void>;
  updateChecklist: (id: string, patch: Partial<ChecklistItem>) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  saveDoc: (d: Partial<DocumentRec> & { id?: string }, file?: File | null) => Promise<void>;
  deleteDoc: (d: DocumentRec) => Promise<void>;
  downloadDoc: (d: DocumentRec) => Promise<void>;
  saveContact: (c: Partial<Contact> & { id?: string }, oppIds: string[]) => Promise<void>;
  deleteContact: (c: Contact) => Promise<void>;
  saveTemplate: (t: Partial<Template> & { id?: string }) => Promise<void>;
  deleteTemplate: (t: Template) => Promise<void>;
  saveProfile: (p: Profile) => Promise<void>;
  notify: (msg: string, kind?: 'ok' | 'err') => void;
  toast: { msg: string; kind: 'ok' | 'err' } | null;
}
const Ctx = createContext<DataState | null>(null);
export const useData = () => { const c = useContext(Ctx); if (!c) throw new Error('useData outside provider'); return c; };

export function DataProvider({ userId, userEmail, children }: { userId: string; userEmail: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [docs, setDocs] = useState<DocumentRec[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);

  const notify = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3500); }, []);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [o, c, d, ct, l, t, a, p] = await Promise.all([
        supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
        supabase.from('checklist_items').select('*').order('sort_order').order('created_at'),
        supabase.from('documents').select('*').order('updated_at', { ascending: false }),
        supabase.from('contacts').select('*').order('name'),
        supabase.from('contact_opportunities').select('contact_id, opportunity_id'),
        supabase.from('templates').select('*').order('name'),
        supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('profiles').select('*').maybeSingle(),
      ]);
      const firstErr = [o, c, d, ct, l, t, a, p].find((r) => r.error);
      if (firstErr?.error) throw firstErr.error;
      setOpps(o.data as Opportunity[]); setChecklist(c.data as ChecklistItem[]); setDocs(d.data as DocumentRec[]);
      setContacts(ct.data as Contact[]); setLinks(l.data as ContactLink[]); setTemplates(t.data as Template[]);
      setActivity(a.data as Activity[]); setProfile((p.data as Profile) ?? null);
    } catch (e) {
      setError(errMsg(e) + ' - have you run supabase/migrations/001_schema.sql in your Supabase project?');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const log = async (entity: string, entity_id: string | null, message: string) => {
    await supabase.from('activity').insert({ entity, entity_id, message, user_id: userId });
  };
  const run = async (fn: () => Promise<void>, okMsg?: string) => {
    try { await fn(); await reload(); if (okMsg) notify(okMsg); } catch (e) { notify(errMsg(e), 'err'); }
  };

  const saveOpp: DataState['saveOpp'] = async (o) => {
    try {
      const { id, ...rest } = o;
      const clean = emptyToNull(rest as Record<string, unknown>);
      if (clean.title === null || clean.title === undefined) delete clean.title;
      let res;
      if (id) { res = await supabase.from('opportunities').update(clean).eq('id', id).select().single(); }
      else { res = await supabase.from('opportunities').insert({ ...clean, user_id: userId }).select().single(); }
      if (res.error) throw res.error;
      await log('opportunity', res.data.id, id ? `Updated "${res.data.title}"` : `Saved opportunity "${res.data.title}"`);
      await reload(); notify(id ? 'Changes saved' : 'Opportunity saved');
      return res.data as Opportunity;
    } catch (e) { notify(errMsg(e), 'err'); return null; }
  };
  const setOppStatus: DataState['setOppStatus'] = (o, status) => run(async () => {
    const patch: Record<string, unknown> = { status };
    if (status === 'submitted' && !o.submitted_at) patch.submitted_at = new Date().toISOString();
    if (status === 'archived') patch.archived = true;
    const { error } = await supabase.from('opportunities').update(patch).eq('id', o.id);
    if (error) throw error;
    await log('opportunity', o.id, `"${o.title}" moved to ${statusLabel(status)}`);
  });
  const archiveOpp: DataState['archiveOpp'] = (o, archived) => run(async () => {
    const patch: Record<string, unknown> = { archived };
    if (!archived && o.status === 'archived') patch.status = 'saved';
    const { error } = await supabase.from('opportunities').update(patch).eq('id', o.id);
    if (error) throw error;
    await log('opportunity', o.id, `${archived ? 'Archived' : 'Restored'} "${o.title}"`);
  }, archived ? 'Archived' : 'Restored');
  const deleteOpp: DataState['deleteOpp'] = (o) => run(async () => {
    const { error } = await supabase.from('opportunities').delete().eq('id', o.id);
    if (error) throw error;
    await log('opportunity', null, `Deleted "${o.title}"`);
  }, 'Deleted');

  const addChecklist: DataState['addChecklist'] = (oppId, title, docId) => run(async () => {
    const n = checklist.filter((c) => c.opportunity_id === oppId).length;
    const { error } = await supabase.from('checklist_items').insert({ opportunity_id: oppId, title, document_id: docId ?? null, sort_order: n, user_id: userId });
    if (error) throw error;
  });
  const addDefaultChecklist: DataState['addDefaultChecklist'] = (oppId) => run(async () => {
    const rows = DEFAULT_CHECKLIST.map((title, i) => ({ opportunity_id: oppId, title, sort_order: i, user_id: userId }));
    const { error } = await supabase.from('checklist_items').insert(rows);
    if (error) throw error;
  }, 'Checklist added');
  const updateChecklist: DataState['updateChecklist'] = async (id, patch) => {
    setChecklist((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      const { error } = await supabase.from('checklist_items').update(emptyToNull(patch as Record<string, unknown>)).eq('id', id);
      if (error) throw error;
      if (patch.done !== undefined) { const it = checklist.find((c) => c.id === id); const op = opps.find((x) => x.id === it?.opportunity_id); if (it && op) await log('checklist', id, `${patch.done ? 'Completed' : 'Reopened'} "${it.title}" for "${op.title}"`); }
      await reload();
    } catch (e) { notify(errMsg(e), 'err'); await reload(); }
  };
  const deleteChecklist: DataState['deleteChecklist'] = (id) => run(async () => { const { error } = await supabase.from('checklist_items').delete().eq('id', id); if (error) throw error; });

  const saveDoc: DataState['saveDoc'] = (d, file) => run(async () => {
    const { id, ...rest } = d;
    const patch: Record<string, unknown> = emptyToNull(rest as Record<string, unknown>);
    let oldPath: string | null = null;
    if (file) {
      const safe = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${userId}/${crypto.randomUUID()}-${safe}`;
      const up = await supabase.storage.from('vault').upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (up.error) throw up.error;
      Object.assign(patch, { file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type || null });
      if (id) oldPath = docs.find((x) => x.id === id)?.file_path ?? null;
      if (!patch.readiness || patch.readiness === 'needed') patch.readiness = 'draft';
    }
    const res = id ? await supabase.from('documents').update(patch).eq('id', id).select().single() : await supabase.from('documents').insert({ ...patch, user_id: userId }).select().single();
    if (res.error) { if (file && patch.file_path) await supabase.storage.from('vault').remove([patch.file_path as string]); throw res.error; }
    if (oldPath) await supabase.storage.from('vault').remove([oldPath]);
    await log('document', res.data.id, `${file ? (id ? 'Replaced file for' : 'Uploaded') : 'Updated'} document "${res.data.name}"`);
  }, 'Document saved');
  const deleteDoc: DataState['deleteDoc'] = (d) => run(async () => {
    if (d.file_path) { const r = await supabase.storage.from('vault').remove([d.file_path]); if (r.error) throw r.error; }
    const { error } = await supabase.from('documents').delete().eq('id', d.id); if (error) throw error;
    await log('document', null, `Deleted document "${d.name}"`);
  }, 'Document deleted');
  const downloadDoc: DataState['downloadDoc'] = async (d) => {
    if (!d.file_path) return;
    try {
      const { data, error } = await supabase.storage.from('vault').createSignedUrl(d.file_path, 60, { download: d.file_name ?? true });
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e) { notify(errMsg(e), 'err'); }
  };

  const saveContact: DataState['saveContact'] = (c, oppIds) => run(async () => {
    const { id, ...rest } = c;
    const clean = emptyToNull(rest as Record<string, unknown>);
    const res = id ? await supabase.from('contacts').update(clean).eq('id', id).select().single() : await supabase.from('contacts').insert({ ...clean, user_id: userId }).select().single();
    if (res.error) throw res.error;
    const cid = res.data.id as string;
    const del = await supabase.from('contact_opportunities').delete().eq('contact_id', cid); if (del.error) throw del.error;
    if (oppIds.length) { const ins = await supabase.from('contact_opportunities').insert(oppIds.map((o) => ({ contact_id: cid, opportunity_id: o, user_id: userId }))); if (ins.error) throw ins.error; }
    await log('contact', cid, `${id ? 'Updated' : 'Added'} contact ${res.data.name}`);
  }, 'Contact saved');
  const deleteContact: DataState['deleteContact'] = (c) => run(async () => { const { error } = await supabase.from('contacts').delete().eq('id', c.id); if (error) throw error; await log('contact', null, `Deleted contact ${c.name}`); }, 'Contact deleted');

  const saveTemplate: DataState['saveTemplate'] = (t) => run(async () => {
    const { id, ...rest } = t;
    const res = id ? await supabase.from('templates').update(rest).eq('id', id) : await supabase.from('templates').insert({ ...rest, user_id: userId });
    if (res.error) throw res.error;
  }, 'Template saved');
  const deleteTemplate: DataState['deleteTemplate'] = (t) => run(async () => { const { error } = await supabase.from('templates').delete().eq('id', t.id); if (error) throw error; }, 'Template deleted');
  const saveProfile: DataState['saveProfile'] = (p) => run(async () => {
    const { error } = await supabase.from('profiles').upsert({ ...emptyToNull(p as unknown as Record<string, unknown>), user_id: userId }); if (error) throw error;
  }, 'Profile saved');

  const value = useMemo(() => ({ loading, error, userId, userEmail, opps, checklist, docs, contacts, links, templates, activity, profile, reload, saveOpp, setOppStatus, archiveOpp, deleteOpp, addChecklist, addDefaultChecklist, updateChecklist, deleteChecklist, saveDoc, deleteDoc, downloadDoc, saveContact, deleteContact, saveTemplate, deleteTemplate, saveProfile, notify, toast }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, error, userId, userEmail, opps, checklist, docs, contacts, links, templates, activity, profile, toast]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
