import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/data';
import { useReminders } from '../lib/reminders';
import { CLOSED, IN_PROGRESS } from '../lib/constants';
import { daysUntil, fmtDateTime, progress } from '../lib/util';
import { OppForm } from '../components/OppForm';
import { OppDetail } from '../components/OppDetail';
import { DeadlineChip, Empty } from '../components/ui';
import { Plus } from '../components/Icons';

export default function Dashboard({ openAdd }: { openAdd: () => void }) {
  const { opps, checklist, activity, profile, userEmail } = useData();
  const reminders = useReminders(); const nav = useNavigate();
  const [detail, setDetail] = useState<string | null>(null); const [quick, setQuick] = useState(false);
  const live = opps.filter((o) => !o.archived);
  const open = live.filter((o) => !CLOSED.includes(o.status));
  const stats = {
    saved: live.filter((o) => o.status === 'saved').length,
    progress: live.filter((o) => IN_PROGRESS.includes(o.status)).length,
    soon: open.filter((o) => { const d = daysUntil(o.deadline); return d !== null && d >= 0 && d <= 7; }).length,
    overdue: open.filter((o) => { const d = daysUntil(o.deadline); return d !== null && d < 0; }).length + checklist.filter((t) => !t.done && live.some((o) => o.id === t.opportunity_id) && (daysUntil(t.due_date) ?? 0) < 0).length,
    submitted: live.filter((o) => o.status === 'submitted').length,
    responses: live.filter((o) => ['interview', 'accepted', 'rejected'].includes(o.status)).length,
  };
  const upcoming = open.filter((o) => o.deadline).sort((a, b) => a.deadline!.localeCompare(b.deadline!)).slice(0, 5);
  const name = profile?.full_name?.split(' ')[0] || userEmail.split('@')[0];
  const go = (q: string) => nav(`/opportunities${q}`);
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="hero"><div><h1>Hello, {name}</h1><p className="muted" style={{ margin: '4px 0 0' }}>{live.length === 0 ? 'Save your first opportunity to get started.' : `${open.length} open application${open.length === 1 ? '' : 's'} on your radar.`}</p></div>
        <button className="btn primary" onClick={openAdd}><Plus />Add opportunity</button></div>
      <div className="grid g3">
        <button className="stat" onClick={() => go('?status=saved')}><b>{stats.saved}</b><span>Saved opportunities</span></button>
        <button className="stat" onClick={() => go('?status=in_progress')}><b>{stats.progress}</b><span>In progress</span></button>
        <button className="stat warn" onClick={() => nav('/deadlines')}><b>{stats.soon}</b><span>Due within 7 days</span></button>
        <button className="stat bad" onClick={() => nav('/deadlines')}><b>{stats.overdue}</b><span>Overdue items</span></button>
        <button className="stat ok" onClick={() => go('?status=submitted')}><b>{stats.submitted}</b><span>Submitted</span></button>
        <button className="stat" onClick={() => go('?status=responses')}><b>{stats.responses}</b><span>Interviews and responses</span></button>
      </div>
      <div className="row wrap"><button className="btn" onClick={() => setQuick(true)}>Quick save a link</button><button className="btn" onClick={() => nav('/contacts')}>Professor follow-ups</button><button className="btn" onClick={() => nav('/vault')}>Document vault</button><button className="btn" onClick={() => nav('/deadlines')}>Calendar</button></div>
      <div className="grid g2">
        <div className="card stack"><h2>Needs attention</h2>
          {reminders.length === 0 ? <p className="muted small">Nothing urgent right now.</p> : reminders.slice(0, 6).map((r) => (
            <div key={r.key} className={`item ${r.days < 0 ? 'overdue' : 'soon'}`} onClick={() => (r.oppId ? setDetail(r.oppId) : nav('/contacts'))}><div className="grow"><h3>{r.text}</h3><span className="muted small">{r.sub}</span></div></div>))}
          {reminders.length > 6 && <button className="btn sm" onClick={() => nav('/deadlines')}>See all {reminders.length}</button>}
        </div>
        <div className="card stack"><h2>Next deadlines</h2>
          {upcoming.length === 0 ? <p className="muted small">No deadlines set yet.</p> : upcoming.map((o) => (
            <div key={o.id} className="item" onClick={() => setDetail(o.id)}><div className="grow"><h3>{o.title}</h3><div className="row wrap"><DeadlineChip date={o.deadline} /><span className="muted small">{progress(checklist.filter((c) => c.opportunity_id === o.id))}% ready</span></div></div></div>))}
        </div>
      </div>
      <div className="card stack"><h2>Recent activity</h2>
        {activity.length === 0 ? <Empty title="No activity yet" hint="Your changes will show up here." /> : activity.slice(0, 8).map((a) => (
          <div key={a.id} className="row between small"><span>{a.message}</span><span className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.created_at)}</span></div>))}
      </div>
      {detail && <OppDetail id={detail} onClose={() => setDetail(null)} />}
      {quick && <OppForm onClose={() => setQuick(false)} />}
    </div>
  );
}
