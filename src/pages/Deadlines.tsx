import { useMemo, useState } from 'react';
import { useData } from '../lib/data';
import { useReminders } from '../lib/reminders';
import { CLOSED } from '../lib/constants';
import { daysUntil, fmtDate, todayStr } from '../lib/util';
import { OppDetail } from '../components/OppDetail';
import { DeadlineChip, Empty } from '../components/ui';

const pad = (n: number) => String(n).padStart(2, '0');
export default function Deadlines() {
  const { opps, checklist } = useData(); const reminders = useReminders();
  const [tab, setTab] = useState<'upcoming' | 'calendar' | 'reminders'>('upcoming');
  const [detail, setDetail] = useState<string | null>(null);
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<string>(todayStr());
  const live = opps.filter((o) => !o.archived);
  const withDeadline = live.filter((o) => o.deadline).sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const overdue = withDeadline.filter((o) => !CLOSED.includes(o.status) && daysUntil(o.deadline)! < 0);
  const soon = withDeadline.filter((o) => !CLOSED.includes(o.status) && daysUntil(o.deadline)! >= 0 && daysUntil(o.deadline)! <= 7);
  const later = withDeadline.filter((o) => !CLOSED.includes(o.status) && daysUntil(o.deadline)! > 7);

  const events = useMemo(() => {
    const m = new Map<string, { label: string; kind: 'deadline' | 'task' | 'follow'; id: string; late: boolean }[]>();
    const add = (d: string | null, e: { label: string; kind: 'deadline' | 'task' | 'follow'; id: string; late: boolean }) => { if (d) m.set(d, [...(m.get(d) ?? []), e]); };
    for (const o of live) {
      add(o.deadline, { label: o.title, kind: 'deadline', id: o.id, late: !CLOSED.includes(o.status) && daysUntil(o.deadline)! < 0 });
      add(o.follow_up_date, { label: `Follow up: ${o.title}`, kind: 'follow', id: o.id, late: false });
    }
    for (const t of checklist) { const o = live.find((x) => x.id === t.opportunity_id); if (o && !t.done) add(t.due_date, { label: `${t.title} (${o.title})`, kind: 'task', id: o.id, late: daysUntil(t.due_date)! < 0 }); }
    return m;
  }, [live, checklist]);

  const first = (cur.getDay() + 6) % 7; const dim = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const cells: { date: string; out: boolean; n: number }[] = [];
  for (let i = 0; i < 42; i++) { const d = new Date(cur.getFullYear(), cur.getMonth(), 1 - first + i); cells.push({ date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, out: d.getMonth() !== cur.getMonth(), n: d.getDate() }); }
  const rows = dim + first > 35 ? cells : cells.slice(0, 35);
  const Row = ({ o }: { o: typeof opps[number] }) => (<div className={`item ${daysUntil(o.deadline)! < 0 ? 'overdue' : daysUntil(o.deadline)! <= 7 ? 'soon' : ''}`} onClick={() => setDetail(o.id)}><div className="grow"><h3>{o.title}</h3><div className="row wrap"><DeadlineChip date={o.deadline} /><span className="muted small">{o.organization}</span></div></div></div>);

  return (
    <div className="stack">
      <h1>Deadlines</h1>
      <div className="tabs"><button className={`tab ${tab === 'upcoming' ? 'on' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button><button className={`tab ${tab === 'calendar' ? 'on' : ''}`} onClick={() => setTab('calendar')}>Calendar</button><button className={`tab ${tab === 'reminders' ? 'on' : ''}`} onClick={() => setTab('reminders')}>Reminders{reminders.length ? ` (${reminders.length})` : ''}</button></div>
      {tab === 'upcoming' && (withDeadline.length === 0 ? <Empty title="No deadlines yet" hint="Add a deadline to an opportunity and it will appear here." /> : <>
        {overdue.length > 0 && <><h2 style={{ color: 'var(--bad)' }}>Overdue</h2>{overdue.map((o) => <Row key={o.id} o={o} />)}</>}
        {soon.length > 0 && <><h2 style={{ color: 'var(--warn)' }}>Due within 7 days</h2>{soon.map((o) => <Row key={o.id} o={o} />)}</>}
        {later.length > 0 && <><h2>Later</h2>{later.map((o) => <Row key={o.id} o={o} />)}</>}
        {overdue.length + soon.length + later.length === 0 && <Empty title="No open deadlines" hint="Everything with a deadline is submitted or closed." />}
      </>)}
      {tab === 'calendar' && (
        <div className="card stack">
          <div className="row between"><button className="iconbtn" aria-label="Previous month" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))}>‹</button><h2>{cur.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><button className="iconbtn" aria-label="Next month" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))}>›</button></div>
          <div className="cal">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="dow">{d}</div>)}
            {rows.map((c) => { const ev = events.get(c.date) ?? []; return (
              <button key={c.date} className={`day ${c.out ? 'out' : ''} ${c.date === todayStr() ? 'today' : ''} ${c.date === sel ? 'sel' : ''} ${ev.length ? 'has' : ''}`} onClick={() => setSel(c.date)} aria-label={`${fmtDate(c.date)}, ${ev.length} items`}>
                {c.n}{ev.slice(0, 2).map((e, i) => <span key={i} className={`dot ${e.late ? 'bad' : e.kind === 'task' ? 'ok' : ''}`}>{e.label}</span>)}{ev.length > 2 && <span className="dot">+{ev.length - 2}</span>}
              </button>); })}
          </div>
          <h3>{fmtDate(sel)}</h3>
          {(events.get(sel) ?? []).length === 0 ? <p className="muted small">Nothing scheduled.</p> : events.get(sel)!.map((e, i) => <div key={i} className="item" onClick={() => setDetail(e.id)}><div className="grow"><h3>{e.label}</h3><span className="chip">{e.kind === 'deadline' ? 'Deadline' : e.kind === 'task' ? 'Task due' : 'Follow-up'}</span></div></div>)}
        </div>
      )}
      {tab === 'reminders' && (<>
        <p className="muted small" style={{ margin: 0 }}>In-app reminders appear here and on your dashboard when you open ScholarTrack. Browser or phone push notifications are not enabled.</p>
        {reminders.length === 0 ? <Empty title="All clear" hint="No deadlines in the next 7 days and nothing overdue." /> : reminders.map((r) => <div key={r.key} className={`item ${r.days < 0 ? 'overdue' : 'soon'}`} onClick={() => r.oppId && setDetail(r.oppId)}><div className="grow"><h3>{r.text}</h3><span className="muted small">{r.sub}</span></div></div>)}
      </>)}
      {detail && <OppDetail id={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
