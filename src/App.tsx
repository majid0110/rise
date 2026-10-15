import { useEffect, useState } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { DataProvider, useData } from './lib/data';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import Deadlines from './pages/Deadlines';
import Vault from './pages/Vault';
import Contacts from './pages/Contacts';
import ProfilePage from './pages/Profile';
import DataPage from './pages/DataPage';
import { OppForm } from './components/OppForm';
import { GlobalSearch } from './components/GlobalSearch';
import { Spinner } from './components/ui';
import * as I from './components/Icons';

const base = import.meta.env.BASE_URL;
const NAV = [
  { to: '/', label: 'Home', icon: I.Home, end: true }, { to: '/opportunities', label: 'Opportunities', icon: I.List },
  { to: '/deadlines', label: 'Deadlines', icon: I.Cal }, { to: '/vault', label: 'Vault', icon: I.Folder },
  { to: '/contacts', label: 'Professors', icon: I.Users }, { to: '/profile', label: 'Profile', icon: I.User }, { to: '/data', label: 'Export', icon: I.Data },
];

function More() {
  const { userEmail } = useData(); const nav = useNavigate();
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? 'dark');
  const toggle = () => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); document.documentElement.dataset.theme = t; try { localStorage.setItem('st-theme', t); } catch { /* ignore */ } };
  return (
    <div className="stack"><h1>More</h1>
      {[['/contacts', 'Professors', I.Users], ['/profile', 'Profile and templates', I.User], ['/data', 'Export and backup', I.Data]].map(([to, l, Ic]) => { const Icon = Ic as typeof I.Users; return <button key={to as string} className="item" onClick={() => nav(to as string)}><Icon className="" /><b>{l as string}</b></button>; })}
      <button className="item" onClick={toggle}><I.Sun /><b>{theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}</b></button>
      <div className="muted small">Signed in as {userEmail}</div>
      <button className="btn danger" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>
  );
}

function Shell() {
  const { loading, error, toast, reload } = useData();
  const [add, setAdd] = useState(false); const [search, setSearch] = useState(false); const nav = useNavigate();
  const mobile = NAV.slice(0, 4);
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><img src={`${base}icons/icon-192.png`} alt="" />ScholarTrack</div>
        {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}><n.icon />{n.label}</NavLink>)}
        <div style={{ flex: 1 }} />
        <button className="navlink" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = t; try { localStorage.setItem('st-theme', t); } catch { /* ignore */ } }}><I.Sun />Toggle theme</button>
        <button className="navlink" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => supabase.auth.signOut()}><I.Out />Sign out</button>
      </aside>
      <main className="main">
        <div className="topbar"><button className="btn grow ghost" style={{ justifyContent: 'flex-start', background: 'var(--card)' }} onClick={() => setSearch(true)}><I.Search />Search everything…</button><button className="btn primary" onClick={() => setAdd(true)}><I.Plus />Add</button></div>
        {error && <div className="banner bad stack" role="alert"><span>{error}</span><div><button className="btn sm" onClick={reload}>Retry</button></div></div>}
        {loading ? <Spinner /> : (
          <Routes>
            <Route path="/" element={<Dashboard openAdd={() => setAdd(true)} />} />
            <Route path="/opportunities" element={<Opportunities openAdd={() => setAdd(true)} />} />
            <Route path="/deadlines" element={<Deadlines />} /><Route path="/vault" element={<Vault />} /><Route path="/contacts" element={<Contacts />} />
            <Route path="/profile" element={<ProfilePage />} /><Route path="/data" element={<DataPage />} /><Route path="/more" element={<More />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>)}
      </main>
      <button className="btn primary fab" onClick={() => setAdd(true)} aria-label="Add opportunity"><I.Plus />Add</button>
      <nav className="bottomnav" aria-label="Main">
        {mobile.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}><n.icon />{n.label === 'Opportunities' ? 'Saved' : n.label}</NavLink>)}
        <NavLink to="/more" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => nav('/more')}><I.More />More</NavLink>
      </nav>
      {add && <OppForm onClose={() => setAdd(false)} />}
      {search && <GlobalSearch onClose={() => setSearch(false)} />}
      {toast && <div className={`toast ${toast.kind === 'err' ? 'err' : ''}`} role="status">{toast.msg}</div>}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <Spinner />;
  if (!session) return <Auth />;
  return <HashRouter><DataProvider key={session.user.id} userId={session.user.id} userEmail={session.user.email ?? ''}><Shell /></DataProvider></HashRouter>;
}
