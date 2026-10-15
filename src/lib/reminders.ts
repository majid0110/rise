import { useMemo } from 'react';
import { useData } from './data';
import { daysUntil, fmtDate, relDays } from './util';
import { CLOSED } from './constants';

export interface Reminder { key: string; kind: 'deadline' | 'reminder' | 'follow_up' | 'task' | 'contact'; text: string; sub: string; days: number; oppId?: string; contactId?: string }

// In-app reminders only. No push/browser notifications are implemented.
export function useReminders() {
  const { opps, checklist, contacts } = useData();
  return useMemo(() => {
    const out: Reminder[] = [];
    const live = opps.filter((o) => !o.archived);
    const open = live.filter((o) => !CLOSED.includes(o.status));
    for (const o of open) {
      const d = daysUntil(o.deadline);
      if (d !== null && d <= 7) out.push({ key: `d${o.id}`, kind: 'deadline', text: `Deadline: ${o.title}`, sub: `${fmtDate(o.deadline)} · ${relDays(d)}`, days: d, oppId: o.id });
      const r = daysUntil(o.reminder_date);
      if (r !== null && r <= 0) out.push({ key: `r${o.id}`, kind: 'reminder', text: `Reminder: ${o.title}`, sub: `Set for ${fmtDate(o.reminder_date)}`, days: r, oppId: o.id });
    }
    for (const o of live) {
      const f = daysUntil(o.follow_up_date);
      if (f !== null && f <= 0) out.push({ key: `f${o.id}`, kind: 'follow_up', text: `Follow up: ${o.title}`, sub: `Planned ${fmtDate(o.follow_up_date)}`, days: f, oppId: o.id });
    }
    for (const t of checklist) {
      const o = live.find((x) => x.id === t.opportunity_id); if (!o || t.done) continue;
      const d = daysUntil(t.due_date);
      if (d !== null && d < 0) out.push({ key: `t${t.id}`, kind: 'task', text: `Overdue task: ${t.title}`, sub: `${o.title} · due ${fmtDate(t.due_date)}`, days: d, oppId: o.id });
    }
    for (const c of contacts) {
      const d = daysUntil(c.follow_up_date);
      if (d !== null && d <= 0 && !['declined', 'interested'].includes(c.status)) out.push({ key: `c${c.id}`, kind: 'contact', text: `Follow up with ${c.name}`, sub: `Planned ${fmtDate(c.follow_up_date)}`, days: d, contactId: c.id });
    }
    return out.sort((a, b) => a.days - b.days);
  }, [opps, checklist, contacts]);
}
