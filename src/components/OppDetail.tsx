import { useState } from 'react';
import { Confirm, DeadlineChip, Modal } from './ui';
import { OppForm } from './OppForm';
import { useData } from '../lib/data';
import { FUNDING, OPP_TYPES, STATUSES, label, statusLabel } from '../lib/constants';
import { fmtDate, progress } from '../lib/util';
import { Ext } from './Icons';
import type { Opportunity } from '../lib/types';

export function OppDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { opps, checklist, docs, contacts, links, setOppStatus, archiveOpp, deleteOpp, addChecklist, addDefaultChecklist, updateChecklist, deleteChecklist, saveOpp } = useData();
  const opp = opps.find((o) => o.id === id);
  const [edit, setEdit] = useState(false); const [del, setDel] = useState(false); const [newTask, setNewTask] = useState('');
  if (!opp) return null;
  const items = checklist.filter((c) => c.opportunity_id === id);
  const pct = progress(items);
  const linked = links.filter((l) => l.opportunity_id === id).map((l) => contacts.find((c) => c.id === l.contact_id)).filter(Boolean);
  const setDate = (k: keyof Opportunity) => (e: React.ChangeEvent<HTMLInputElement>) => saveOpp({ id, [k]: e.target.value || null } as Partial<Opportunity>);
  return (
    <Modal title={opp.title} onClose={onClose} wide>
      <div className="stack">
        <div className="row wrap">
          <span className="chip blue">{statusLabel(opp.status)}</span><DeadlineChip date={opp.deadline} />
          <span className="chip">{label(OPP_TYPES, opp.opp_type)}</span><span className="chip">{label(FUNDING, opp.funding)}</span><span className="chip violet">{opp.priority} priority</span>
          {opp.archived && <span className="chip warn">Archived</span>}
        </div>
        <div className="muted">{[opp.organization, opp.country, opp.source && `via ${opp.source}`].filter(Boolean).join(' · ') || 'No details yet - tap Edit to add them.'}</div>
        {opp.url && <a href={opp.url} target="_blank" rel="noopener noreferrer" className="row small"><Ext style={{ width: 16 }} />Open application page</a>}
        {opp.notes && <pre className="draft">{opp.notes}</pre>}

        <div className="fgrid">
          <label className="f"><span>Status</span><select value={opp.status} onChange={(e) => setOppStatus(opp, e.target.value as Opportunity['status'])}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <label className="f"><span>Deadline</span><input type="date" value={opp.deadline ?? ''} onChange={setDate('deadline')} /></label>
          <label className="f"><span>Reminder date</span><input type="date" value={opp.reminder_date ?? ''} onChange={setDate('reminder_date')} /></label>
          <label className="f"><span>Follow-up date</span><input type="date" value={opp.follow_up_date ?? ''} onChange={setDate('follow_up_date')} /></label>
        </div>

        <div>
          <div className="row between" style={{ marginBottom: 8 }}><h3>Application checklist</h3><span className="muted small">{items.filter((i) => i.done).length}/{items.length} · {pct}%</span></div>
          <div className="bar" style={{ marginBottom: 10 }}><i style={{ width: `${pct}%` }} /></div>
          <div className="stack" style={{ gap: 8 }}>
            {items.length === 0 && <div className="row wrap"><span className="muted small">No tasks yet.</span><button className="btn sm" onClick={() => addDefaultChecklist(id)}>Add standard checklist</button></div>}
            {items.map((it) => (
              <div key={it.id} className={`check ${it.done ? 'done' : ''}`}>
                <input type="checkbox" checked={it.done} onChange={(e) => updateChecklist(it.id, { done: e.target.checked })} aria-label={`Mark "${it.title}" done`} />
                <div className="grow"><div className="t">{it.title}</div>
                  <div className="row wrap" style={{ marginTop: 4 }}>
                    <select style={{ width: 'auto', minHeight: 32, padding: '4px 8px', fontSize: 12 }} value={it.document_id ?? ''} onChange={(e) => updateChecklist(it.id, { document_id: e.target.value || null })} aria-label="Linked document">
                      <option value="">No document linked</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}{d.readiness !== 'ready' ? ` (${d.readiness})` : ''}</option>)}
                    </select>
                    <input type="date" style={{ width: 'auto', minHeight: 32, padding: '4px 8px', fontSize: 12 }} value={it.due_date ?? ''} onChange={(e) => updateChecklist(it.id, { due_date: e.target.value || null })} aria-label="Task due date" />
                  </div></div>
                <button className="iconbtn" onClick={() => deleteChecklist(it.id)} aria-label="Delete task">✕</button>
              </div>
            ))}
            <form className="row" onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) { addChecklist(id, newTask.trim()); setNewTask(''); } }}>
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" /><button className="btn">Add</button>
            </form>
          </div>
        </div>

        {linked.length > 0 && <div><h3 style={{ marginBottom: 6 }}>Professor contacts</h3>{linked.map((c) => c && <div key={c.id} className="small">{c.name}{c.university ? `, ${c.university}` : ''}{c.email ? ` · ${c.email}` : ''}</div>)}</div>}
        <div className="muted small">Saved {fmtDate(opp.created_at)}{opp.submitted_at ? ` · Submitted ${fmtDate(opp.submitted_at)}` : ''}</div>
        <div className="row wrap">
          <button className="btn" onClick={() => setEdit(true)}>Edit</button>
          {opp.archived ? <button className="btn" onClick={() => archiveOpp(opp, false)}>Restore</button> : <button className="btn" onClick={() => archiveOpp(opp, true)}>Archive</button>}
          <button className="btn danger" onClick={() => setDel(true)}>Delete</button>
        </div>
      </div>
      {edit && <OppForm opp={opp} onClose={() => setEdit(false)} />}
      {del && <Confirm msg={`Permanently delete "${opp.title}" and its checklist? Archiving keeps your history instead.`} onNo={() => setDel(false)} onYes={async () => { await deleteOpp(opp); setDel(false); onClose(); }} />}
    </Modal>
  );
}
