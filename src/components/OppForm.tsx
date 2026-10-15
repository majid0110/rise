import { useState } from 'react';
import { Field, Modal } from './ui';
import { FUNDING, OPP_TYPES, PRIORITIES, SOURCES, STATUSES } from '../lib/constants';
import { useData } from '../lib/data';
import type { Opportunity } from '../lib/types';

export function OppForm({ opp, onClose, onSaved }: { opp?: Opportunity; onClose: () => void; onSaved?: (o: Opportunity) => void }) {
  const { saveOpp } = useData();
  const [f, setF] = useState({
    title: opp?.title === 'Untitled opportunity' ? '' : opp?.title ?? '', organization: opp?.organization ?? '', url: opp?.url ?? '', country: opp?.country ?? '',
    opp_type: opp?.opp_type ?? 'phd', funding: opp?.funding ?? 'unknown', deadline: opp?.deadline ?? '', source: opp?.source ?? '', priority: opp?.priority ?? 'medium',
    status: opp?.status ?? 'saved', notes: opp?.notes ?? '', reminder_date: opp?.reminder_date ?? '', follow_up_date: opp?.follow_up_date ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(Boolean(opp));
  const set = (k: string) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const title = f.title.trim() || (f.url ? f.url.replace(/^https?:\/\//, '').slice(0, 80) : 'Untitled opportunity');
    const saved = await saveOpp({ ...(opp ? { id: opp.id } : {}), ...f, title } as Partial<Opportunity>);
    setBusy(false);
    if (saved) { onSaved?.(saved); onClose(); }
  };
  return (
    <Modal title={opp ? 'Edit opportunity' : 'Add opportunity'} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <div className="fgrid">
          <Field label="Title" full><input autoFocus value={f.title} onChange={set('title')} placeholder="PhD in Machine Learning - Funded" /></Field>
          <Field label="Application URL" full><input type="url" inputMode="url" value={f.url} onChange={set('url')} placeholder="https://..." /></Field>
          <Field label="University / organization"><input value={f.organization} onChange={set('organization')} /></Field>
          <Field label="Deadline"><input type="date" value={f.deadline} onChange={set('deadline')} /></Field>
        </div>
        {!more && <button type="button" className="btn ghost sm" onClick={() => setMore(true)}>More details…</button>}
        {more && (
          <div className="fgrid">
            <Field label="Country"><input value={f.country} onChange={set('country')} /></Field>
            <Field label="Source"><input list="src-list" value={f.source} onChange={set('source')} /><datalist id="src-list">{SOURCES.map((s) => <option key={s} value={s} />)}</datalist></Field>
            <Field label="Opportunity type"><select value={f.opp_type} onChange={set('opp_type')}>{OPP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            <Field label="Funding"><select value={f.funding} onChange={set('funding')}>{FUNDING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            <Field label="Priority"><select value={f.priority} onChange={set('priority')}>{PRIORITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            <Field label="Status"><select value={f.status} onChange={set('status')}>{STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            <Field label="Reminder date"><input type="date" value={f.reminder_date} onChange={set('reminder_date')} /></Field>
            <Field label="Follow-up date"><input type="date" value={f.follow_up_date} onChange={set('follow_up_date')} /></Field>
            <Field label="Notes" full><textarea value={f.notes} onChange={set('notes')} /></Field>
          </div>
        )}
        <p className="muted small" style={{ margin: 0 }}>Everything is optional. Save a link now and fill in the rest later.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}
