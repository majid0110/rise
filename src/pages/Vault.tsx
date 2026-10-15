import { useState } from 'react';
import { useData } from '../lib/data';
import { DOC_CATEGORIES, READINESS, label } from '../lib/constants';
import { fmtDate, fmtSize } from '../lib/util';
import { Confirm, Empty, Field, Modal } from '../components/ui';
import type { DocumentRec } from '../lib/types';

const MAX = 25 * 1024 * 1024;
function DocForm({ doc, onClose }: { doc?: DocumentRec; onClose: () => void }) {
  const { saveDoc, notify } = useData();
  const [f, setF] = useState({ name: doc?.name ?? '', category: doc?.category ?? 'cv', readiness: doc?.readiness ?? 'needed', notes: doc?.notes ?? '' });
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file && file.size > MAX) return notify('File is larger than 25 MB', 'err');
    setBusy(true);
    await saveDoc({ ...(doc ? { id: doc.id } : {}), ...f, name: f.name.trim() || file?.name || label(DOC_CATEGORIES, f.category) } as Partial<DocumentRec>, file);
    setBusy(false); onClose();
  };
  return (
    <Modal title={doc ? 'Edit document' : 'Add document'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="fgrid">
          <Field label="Name" full><input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. CV - academic 2026" /></Field>
          <Field label="Category"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
          <Field label="Readiness"><select value={f.readiness} onChange={(e) => setF({ ...f, readiness: e.target.value as DocumentRec['readiness'] })}>{READINESS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
          <Field label={doc?.file_path ? 'Replace file (optional)' : 'File (optional)'} full><input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />{doc?.file_name && <span className="small muted">Current: {doc.file_name}</span>}</Field>
          <Field label="Notes" full><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Files are stored in a private Supabase bucket that only your account can read. Max 25 MB.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}
export default function Vault() {
  const { docs, checklist, downloadDoc, deleteDoc, saveDoc } = useData();
  const [cat, setCat] = useState(''); const [edit, setEdit] = useState<DocumentRec | 'new' | null>(null); const [del, setDel] = useState<DocumentRec | null>(null);
  const list = docs.filter((d) => !cat || d.category === cat);
  const ready = docs.filter((d) => d.readiness === 'ready').length;
  return (
    <div className="stack">
      <div className="row between"><div><h1>Document vault</h1><span className="muted small">{docs.length} documents · {ready} ready · private to your account</span></div><button className="btn primary" onClick={() => setEdit('new')}>Add</button></div>
      <div className="tabs"><button className={`tab ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>All</button>{DOC_CATEGORIES.map((c) => <button key={c.value} className={`tab ${cat === c.value ? 'on' : ''}`} onClick={() => setCat(c.value)}>{c.label}</button>)}</div>
      {list.length === 0 ? <Empty title="No documents here" hint="Add a document record, with or without a file, and link it to checklist tasks." /> : list.map((d) => {
        const used = checklist.filter((c) => c.document_id === d.id).length;
        return (
          <div key={d.id} className="card stack" style={{ gap: 10 }}>
            <div className="row between wrap"><div className="grow"><h3>{d.name}</h3><span className="muted small">{label(DOC_CATEGORIES, d.category)}{d.file_name ? ` · ${d.file_name} (${fmtSize(d.file_size)})` : ' · no file uploaded'} · updated {fmtDate(d.updated_at)}</span></div>
              <select style={{ width: 'auto' }} value={d.readiness} onChange={(e) => saveDoc({ id: d.id, readiness: e.target.value as DocumentRec['readiness'] })} aria-label="Readiness">{READINESS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
            {d.notes && <span className="small muted">{d.notes}</span>}
            <div className="row wrap">{d.file_path && <button className="btn sm" onClick={() => downloadDoc(d)}>Download</button>}<button className="btn sm" onClick={() => setEdit(d)}>{d.file_path ? 'Edit / replace' : 'Edit / upload'}</button><button className="btn sm danger" onClick={() => setDel(d)}>Delete</button>{used > 0 && <span className="chip blue">Used in {used} task{used > 1 ? 's' : ''}</span>}</div>
          </div>);
      })}
      {edit && <DocForm doc={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <Confirm msg={`Delete "${del.name}"${del.file_path ? ' and its uploaded file' : ''}? Linked checklist tasks will lose the reference.`} onNo={() => setDel(null)} onYes={async () => { await deleteDoc(del); setDel(null); }} />}
    </div>
  );
}
