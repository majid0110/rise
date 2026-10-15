import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../lib/data';
import { FUNDING, IN_PROGRESS, OPP_TYPES, PRIORITIES, STATUSES, label, statusLabel } from '../lib/constants';
import { daysUntil, progress } from '../lib/util';
import { DeadlineChip, Empty } from '../components/ui';
import { OppDetail } from '../components/OppDetail';

const PRI = { high: 0, medium: 1, low: 2 } as Record<string, number>;
export default function Opportunities({ openAdd }: { openAdd: () => void }) {
  const { opps, checklist } = useData();
  const [sp, setSp] = useSearchParams();
  const [detail, setDetail] = useState<string | null>(null);
  const q = sp.get('q') ?? ''; const status = sp.get('status') ?? ''; const type = sp.get('type') ?? ''; const funding = sp.get('funding') ?? '';
  const priority = sp.get('priority') ?? ''; const view = sp.get('view') ?? 'active'; const sort = sp.get('sort') ?? 'deadline'; const country = sp.get('country') ?? '';
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const countries = useMemo(() => [...new Set(opps.map((o) => o.country).filter(Boolean) as string[])].sort(), [opps]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = opps.filter((o) => (view === 'archived' ? o.archived : !o.archived));
    if (status === 'in_progress') r = r.filter((o) => IN_PROGRESS.includes(o.status));
    else if (status === 'responses') r = r.filter((o) => ['interview', 'accepted', 'rejected'].includes(o.status));
    else if (status) r = r.filter((o) => o.status === status);
    if (type) r = r.filter((o) => o.opp_type === type); if (funding) r = r.filter((o) => o.funding === funding);
    if (priority) r = r.filter((o) => o.priority === priority); if (country) r = r.filter((o) => o.country === country);
    if (s) r = r.filter((o) => [o.title, o.organization, o.country, o.source, o.notes, o.url].some((v) => v?.toLowerCase().includes(s)));
    return [...r].sort((a, b) => {
      if (sort === 'deadline') return (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999');
      if (sort === 'priority') return PRI[a.priority] - PRI[b.priority];
      if (sort === 'title') return a.title.localeCompare(b.title);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [opps, q, status, type, funding, priority, country, view, sort]);

  return (
    <div className="stack">
      <div className="row between"><h1>Opportunities</h1><button className="btn primary" onClick={openAdd}>Add</button></div>
      <div className="tabs" role="tablist"><button className={`tab ${view === 'active' ? 'on' : ''}`} onClick={() => set('view', '')}>Active</button><button className={`tab ${view === 'archived' ? 'on' : ''}`} onClick={() => set('view', 'archived')}>Archived</button></div>
      <input type="search" placeholder="Search title, university, notes…" value={q} onChange={(e) => set('q', e.target.value)} aria-label="Search opportunities" />
      <div className="filters">
        <select value={status} onChange={(e) => set('status', e.target.value)} aria-label="Status"><option value="">All statuses</option><option value="in_progress">In progress (all)</option><option value="responses">Interviews and responses</option>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select value={type} onChange={(e) => set('type', e.target.value)} aria-label="Type"><option value="">All types</option>{OPP_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select value={funding} onChange={(e) => set('funding', e.target.value)} aria-label="Funding"><option value="">Any funding</option>{FUNDING.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select value={priority} onChange={(e) => set('priority', e.target.value)} aria-label="Priority"><option value="">Any priority</option>{PRIORITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        {countries.length > 0 && <select value={country} onChange={(e) => set('country', e.target.value)} aria-label="Country"><option value="">Any country</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>}
        <select value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort"><option value="deadline">Sort: deadline</option><option value="created">Sort: newest</option><option value="priority">Sort: priority</option><option value="title">Sort: title</option></select>
      </div>
      {list.length === 0 ? (
        <Empty title={opps.length === 0 ? 'No opportunities yet' : 'Nothing matches'} hint={opps.length === 0 ? 'Save a link or title in a few seconds.' : 'Try clearing a filter.'} action={opps.length === 0 ? <button className="btn primary" onClick={openAdd}>Add your first</button> : undefined} />
      ) : list.map((o) => {
        const d = daysUntil(o.deadline); const closed = !['saved', 'to_prepare', 'preparing', 'ready'].includes(o.status);
        const p = progress(checklist.filter((c) => c.opportunity_id === o.id));
        return (
          <div key={o.id} className={`item ${!closed && d !== null && d < 0 ? 'overdue' : !closed && d !== null && d <= 7 ? 'soon' : ''}`} onClick={() => setDetail(o.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetail(o.id)}>
            <div className="grow">
              <h3>{o.title}</h3>
              <div className="muted small">{[o.organization, o.country, label(OPP_TYPES, o.opp_type)].filter(Boolean).join(' · ')}</div>
              <div className="row wrap" style={{ marginTop: 8 }}><span className="chip blue">{statusLabel(o.status)}</span><DeadlineChip date={o.deadline} />{o.priority === 'high' && <span className="chip violet">High priority</span>}</div>
              {checklist.some((c) => c.opportunity_id === o.id) && <div className="bar" style={{ marginTop: 10 }} aria-label={`${p}% complete`}><i style={{ width: `${p}%` }} /></div>}
            </div>
          </div>
        );
      })}
      {detail && <OppDetail id={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
