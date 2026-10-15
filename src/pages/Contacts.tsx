import { useState } from 'react';
import { useData } from '../lib/data';
import { CONTACT_STATUSES, label } from '../lib/constants';
import { daysUntil, fmtDate, relDays } from '../lib/util';
import { Confirm, Empty, Field, Modal } from '../components/ui';
import type { Contact } from '../lib/types';

const fill = (text: string, vars: Record<string, string>) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] ? vars[k] : m));

function ContactForm({ c, onClose }: { c?: Contact; onClose: () => void }) {
  const { saveContact, opps, links } = useData();
  const [f, setF] = useState({ name: c?.name ?? '', email: c?.email ?? '', university: c?.university ?? '', research_interests: c?.research_interests ?? '', status: c?.status ?? 'not_contacted', contacted_at: c?.contacted_at ?? '', follow_up_date: c?.follow_up_date ?? '', notes: c?.notes ?? '' });
  const [sel, setSel] = useState<string[]>(c ? links.filter((l) => l.contact_id === c.id).map((l) => l.opportunity_id) : []);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={c ? 'Edit contact' : 'Add professor contact'} onClose={onClose}>
      <form className="stack" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await saveContact({ ...(c ? { id: c.id } : {}), ...f }, sel); setBusy(false); onClose(); }}>
        <div className="fgrid">
          <Field label="Name"><input required autoFocus value={f.name} onChange={set('name')} /></Field>
          <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="University"><input value={f.university} onChange={set('university')} /></Field>
          <Field label="Status"><select value={f.status} onChange={set('status')}>{CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
          <Field label="Date contacted"><input type="date" value={f.contacted_at} onChange={set('contacted_at')} /></Field>
          <Field label="Follow-up date"><input type="date" value={f.follow_up_date} onChange={set('follow_up_date')} /></Field>
          <Field label="Research interests" full><input value={f.research_interests} onChange={set('research_interests')} /></Field>
          <Field label="Related opportunities" full><select multiple size={Math.min(5, Math.max(2, opps.length))} value={sel} onChange={(e) => setSel([...e.target.selectedOptions].map((o) => o.value))}>{opps.filter((o) => !o.archived).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select></Field>
          <Field label="Notes" full><textarea value={f.notes} onChange={set('notes')} /></Field>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}
function Draft({ c, onClose }: { c: Contact; onClose: () => void }) {
  const { templates, profile, opps, links, notify } = useData();
  const emailTpls = templates.filter((t) => t.kind.startsWith('email'));
  const [tid, setTid] = useState(emailTpls[0]?.id ?? '');
  const t = emailTpls.find((x) => x.id === tid);
  const opp = opps.find((o) => links.some((l) => l.contact_id === c.id && l.opportunity_id === o.id));
  const vars: Record<string, string> = { professor_name: c.name, university: c.university ?? '', research_interests: c.research_interests ?? '', opportunity_title: opp?.title ?? '', my_name: profile?.full_name ?? '', my_degree: profile?.current_degree ?? '', my_institution: profile?.current_institution ?? '' };
  const [subject, setSubject] = useState(t ? fill(t.subject ?? '', vars) : ''); const [body, setBody] = useState(t ? fill(t.body, vars) : '');
  const pick = (id: string) => { setTid(id); const x = emailTpls.find((y) => y.id === id); if (x) { setSubject(fill(x.subject ?? '', vars)); setBody(fill(x.body, vars)); } };
  const copy = async (txt: string) => { try { await navigator.clipboard.writeText(txt); notify('Copied'); } catch { notify('Copy failed - select the text manually', 'err'); } };
  return (
    <Modal title={`Email draft for ${c.name}`} onClose={onClose} wide>
      <div className="stack">
        {emailTpls.length === 0 ? <div className="banner">You have no email templates yet. Create one under Profile and templates, using placeholders like {'{{professor_name}}'}.</div> : <>
          <Field label="Template"><select value={tid} onChange={(e) => pick(e.target.value)}>{emailTpls.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
          <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
          <Field label="Body"><textarea style={{ minHeight: 260 }} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          {/\{\{\w+\}\}/.test(subject + body) && <div className="banner">Some placeholders are still unfilled. Edit them before sending.</div>}
          <div className="row wrap"><button className="btn primary" onClick={() => copy(`Subject: ${subject}\n\n${body}`)}>Copy all</button><button className="btn" onClick={() => copy(body)}>Copy body</button>
            {c.email && <a className="btn" href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open in my email app</a>}</div>
          <p className="muted small" style={{ margin: 0 }}>ScholarTrack does not send email. This only prepares a draft; mark the contact as contacted after you send it yourself.</p></>}
      </div>
    </Modal>
  );
}
export default function Contacts() {
  const { contacts, links, opps, deleteContact, saveContact } = useData();
  const [edit, setEdit] = useState<Contact | 'new' | null>(null); const [draft, setDraft] = useState<Contact | null>(null); const [del, setDel] = useState<Contact | null>(null); const [q, setQ] = useState('');
  const list = contacts.filter((c) => !q || [c.name, c.university, c.email, c.research_interests].some((v) => v?.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="stack">
      <div className="row between"><h1>Professors</h1><button className="btn primary" onClick={() => setEdit('new')}>Add</button></div>
      <input type="search" placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search contacts" />
      {list.length === 0 ? <Empty title="No contacts yet" hint="Save professors you plan to email or already contacted." /> : list.map((c) => {
        const d = daysUntil(c.follow_up_date); const rel = links.filter((l) => l.contact_id === c.id).map((l) => opps.find((o) => o.id === l.opportunity_id)?.title).filter(Boolean);
        return (
          <div key={c.id} className="card stack" style={{ gap: 8 }}>
            <div className="row between wrap"><div><h3>{c.name}</h3><span className="muted small">{[c.university, c.email].filter(Boolean).join(' · ')}</span></div>
              <select style={{ width: 'auto' }} value={c.status} onChange={(e) => saveContact({ id: c.id, status: e.target.value }, links.filter((l) => l.contact_id === c.id).map((l) => l.opportunity_id))} aria-label="Status">{CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            {c.research_interests && <span className="small">Interests: {c.research_interests}</span>}
            <div className="row wrap">{c.contacted_at && <span className="chip">Contacted {fmtDate(c.contacted_at)}</span>}{c.follow_up_date && <span className={`chip ${d! < 0 ? 'bad' : d! <= 3 ? 'warn' : 'blue'}`}>Follow-up {fmtDate(c.follow_up_date)} · {relDays(d)}</span>}{rel.map((r) => <span key={r} className="chip violet">{r}</span>)}<span className="chip">{label(CONTACT_STATUSES, c.status)}</span></div>
            {c.notes && <span className="small muted">{c.notes}</span>}
            <div className="row wrap"><button className="btn sm primary" onClick={() => setDraft(c)}>Email draft</button><button className="btn sm" onClick={() => setEdit(c)}>Edit</button><button className="btn sm danger" onClick={() => setDel(c)}>Delete</button></div>
          </div>);
      })}
      {edit && <ContactForm c={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      {draft && <Draft c={draft} onClose={() => setDraft(null)} />}
      {del && <Confirm msg={`Delete ${del.name}?`} onNo={() => setDel(null)} onYes={async () => { await deleteContact(del); setDel(null); }} />}
    </div>
  );
}
