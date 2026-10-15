import { useState } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { errMsg } from '../lib/util';

export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw }); if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL } });
        if (error) throw error;
        if (!data.session) setMsg({ t: 'Account created. Check your email to confirm it, then sign in.' });
      }
    } catch (err) { setMsg({ t: errMsg(err), bad: true }); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!email) return setMsg({ t: 'Enter your email first.', bad: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + import.meta.env.BASE_URL });
    setMsg(error ? { t: error.message, bad: true } : { t: 'If that account exists, a reset email has been sent.' });
  };
  return (
    <div className="auth"><div className="card stack">
      <div className="brand" style={{ padding: 0 }}><img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />ScholarTrack</div>
      <p className="muted" style={{ margin: 0 }}>Your private scholarship and PhD application assistant.</p>
      {!isConfigured && <div className="banner bad">Supabase is not configured in this build. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README) and redeploy.</div>}
      <form className="stack" onSubmit={submit}>
        <label className="f"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="f"><span>Password</span><input type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {msg && <div className={`banner ${msg.bad ? 'bad' : ''}`} role="alert">{msg.t}</div>}
        <button className="btn primary" disabled={busy || !isConfigured}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
      </form>
      <div className="row between small">
        <button className="btn ghost sm" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null); }}>{mode === 'in' ? 'Create an account' : 'I have an account'}</button>
        {mode === 'in' && <button className="btn ghost sm" onClick={reset}>Forgot password?</button>}
      </div>
    </div></div>
  );
}
