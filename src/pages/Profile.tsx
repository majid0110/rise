import { useState } from 'react';
import { useData } from '../lib/data';
import { TEMPLATE_KINDS, label } from '../lib/constants';
import { Confirm, Empty, Field, Modal } from '../components/ui';
import { STARTERS } from '../lib/starters';
import type { Profile as P, Template } from '../lib/types';

const FIELDS: [keyof P, string, boolean?][] = [['full_name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['nationality', 'Nationality'], ['country_of_residence', 'Country of residence'], ['current_degree', 'Current degree / status'], ['current_institution', 'Current institution'], ['field_of_study', 'Field of study'], ['gpa', 'GPA / grades'], ['english_test', 'English test and score'], ['research_interests', 'Research interests', true], ['links', 'Links (GitHub, Scholar, LinkedIn)', true], ['bio', 'Short academic bio', true]];
function TplForm({ t, onClose }: { t?: Template; onClose: () => void }) {
  const { saveTemplate } = useData();
  const [f, setF] = useState({ kind: t?.kind ?? 'email_initial', name: t?.name ?? '', subject: t?.subject ?? '', body: t?.body ?? '' });
  return (
    <Modal title={t ? 'Edit template' : 'New template'} onClose={onClose} wide>
      <form className="stack" onSubmit={async (e) => { e.preventDefault(); await saveTemplate({ ...(t ? { id: t.id } : {}), ...f }); onClose(); }}>
        <div className="fgrid"><Field label="Name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Type"><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{TEMPLATE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></Field>
          <Field label="Subject (emails)" full><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
          <Field label="Body" full><textarea style={{ minHeight: 260 }} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field></div>
        <p className="muted small" style={{ margin: 0 }}>Placeholders: {'{{professor_name}} {{university}} {{research_interests}} {{opportunity_title}} {{my_name}} {{my_degree}} {{my_institution}}'}</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary">Save</button></div>
      </form>
    </Modal>
  );
}
export default function ProfilePage() {
  const { profile, saveProfile, templates, deleteTemplate, saveTemplate, notify } = useData();
  const [f, setF] = useState<P>({ full_name: null, email: null, phone: null, nationality: null, country_of_residence: null, current_degree: null, current_institution: null, field_of_study: null, gpa: null, research_interests: null, english_test: null, links: null, bio: null, ...(profile ?? {}) });
  const [edit, setEdit] = useState<Template | 'new' | null>(null); const [del, setDel] = useState<Template | null>(null);
  const addStarters = async () => { for (const s of STARTERS) await saveTemplate(s); };
  const copy = async (t: Template) => { try { await navigator.clipboard.writeText(`${t.subject ? `Subject: ${t.subject}\n\n` : ''}${t.body}`); notify('Copied'); } catch { notify('Copy failed', 'err'); } };
  return (
    <div className="stack" style={{ gap: 20 }}>
      <h1>Profile and templates</h1>
      <form className="card stack" onSubmit={async (e) => { e.preventDefault(); await saveProfile(f); }}>
        <h2>Academic profile</h2><p className="muted small" style={{ margin: 0 }}>Only what you enter is stored. Templates use these details when you prepare drafts.</p>
        <div className="fgrid">{FIELDS.map(([k, l, full]) => <Field key={k} label={l} full={full}>{full ? <textarea value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /> : <input value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}</Field>)}</div>
        <div><button className="btn primary">Save profile</button></div>
      </form>
      <div className="stack">
        <div className="row between wrap"><h2>Templates</h2><div className="row">{templates.length === 0 && <button className="btn" onClick={addStarters}>Add starter templates</button>}<button className="btn primary" onClick={() => setEdit('new')}>New</button></div></div>
        {templates.length === 0 ? <Empty title="No templates yet" hint="Add editable starter templates (placeholders only) or write your own." /> : templates.map((t) => (
          <div key={t.id} className="card stack" style={{ gap: 8 }}><div className="row between wrap"><div><h3>{t.name}</h3><span className="chip">{label(TEMPLATE_KINDS, t.kind)}</span></div>
            <div className="row"><button className="btn sm" onClick={() => copy(t)}>Copy</button><button className="btn sm" onClick={() => setEdit(t)}>Edit</button><button className="btn sm danger" onClick={() => setDel(t)}>Delete</button></div></div>
            <pre className="draft small">{t.body.length > 280 ? t.body.slice(0, 280) + '…' : t.body}</pre></div>))}
      </div>
      {edit && <TplForm t={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <Confirm msg={`Delete template "${del.name}"?`} onNo={() => setDel(null)} onYes={async () => { await deleteTemplate(del); setDel(null); }} />}
    </div>
  );
}
