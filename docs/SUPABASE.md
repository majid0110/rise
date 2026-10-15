# Supabase setup (about 10 minutes)

1. **Create a project** at https://supabase.com (free tier is enough). Choose a region close to you and save the database password somewhere safe (you will not need it for this app).
2. **Run the schema.** Open *SQL Editor* → *New query*, paste the contents of `supabase/migrations/001_schema.sql`, and click *Run*. This creates the tables, row-level security policies, and the private `vault` storage bucket. It is safe to run again.
3. **Auth settings** (*Authentication* → *URL Configuration*):
   - *Site URL*: `https://YOUR_GITHUB_USERNAME.github.io/rise/`
   - *Redirect URLs*: add the same URL (and `http://localhost:5173/rise/` for local development).
   - *Providers* → *Email* is on by default. To skip email confirmation while testing, turn off *Confirm email*; leave it on if you prefer verified accounts.
   - Optional hardening: after you create your own account, turn off *Allow new users to sign up* so nobody else can register. Even if they did, row-level security isolates every user's data.
4. **Copy your keys** from *Project Settings* → *API*: the **Project URL** and the **anon public** key. Never use or share the `service_role` key.
5. **Give them to GitHub Actions** (repository → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Re-run the deploy workflow (*Actions* → *Deploy to GitHub Pages* → *Run workflow*).

The anon key is designed to be embedded in browser apps. Your data stays private because every table has row-level security (`user_id = auth.uid()`) and the `vault` bucket only allows access to files under your own user-id folder.

## Local development
```
cp .env.example .env   # fill in the two values
npm install
npm run dev            # http://localhost:5173/rise/
```
