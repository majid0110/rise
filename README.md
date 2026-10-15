# ScholarTrack

A personal scholarship and PhD application assistant: save opportunities, track applications with checklists, watch deadlines, keep a private document vault, manage professor contacts and email drafts, and export your data. Installable as a PWA on iPhone and Android, with records synced through Supabase.

Stack: Vite, React, TypeScript, Supabase (auth, Postgres with row-level security, private storage), GitHub Pages + GitHub Actions.

## Features
- Dashboard with live counts (saved, in progress, due within 7 days, overdue, submitted, interviews/responses) and recent activity
- Quick capture (title or link only is enough), edit, delete, archive/restore, search, sort, filter
- Statuses: Saved, To Prepare, Preparing Documents, Ready to Apply, Submitted, Interview, Accepted, Rejected, Withdrawn, Archived
- Per-opportunity checklist with progress; tasks can reference existing vault documents
- Upcoming deadlines, month calendar, overdue highlighting, custom reminder and follow-up dates (in-app reminders only; no push notifications)
- Private document vault (upload, download, replace, category, readiness)
- Professor contacts with linked opportunities and editable, copyable email drafts (the app never sends email)
- Profile and editable templates (starter templates contain placeholders only)
- Global search, CSV export, JSON backup

## Setup
1. Follow [docs/SUPABASE.md](docs/SUPABASE.md) (create project, run `supabase/migrations/001_schema.sql`, add two repository secrets).
2. In the repository: *Settings* → *Pages* → *Source* = **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The site is served at `https://<your-username>.github.io/rise/`.

## Notes
- Routing uses hash URLs (`/rise/#/deadlines`), so refreshing any page works on GitHub Pages without 404s. `404.html` is also generated as a fallback.
- No secrets are committed. `.env` is git-ignored; only the public anon key is used by the browser. Documents live in a private Supabase bucket, never in this repository.
- Vite `base` is `/rise/` (see `vite.config.ts`); if you rename the repository, update it, `public/manifest.webmanifest`, and `public/sw.js`.
