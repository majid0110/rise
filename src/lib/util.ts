import type { Opportunity, ChecklistItem } from './types';

export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const daysUntil = (date: string | null | undefined): number | null => {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const a = new Date(y, m - 1, d).getTime(); const t = new Date(); const b = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return Math.round((a - b) / 86400000);
};
export const fmtDate = (date: string | null | undefined) => {
  if (!date) return '';
  const [y, m, d] = date.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const relDays = (n: number | null) => n === null ? '' : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? '1 day overdue' : n < 0 ? `${-n} days overdue` : `in ${n} days`;
export const isActiveOpp = (o: Opportunity) => !o.archived && !['submitted', 'interview', 'accepted', 'rejected', 'withdrawn', 'archived'].includes(o.status);
export const progress = (items: ChecklistItem[]) => items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0;
export const fmtSize = (n: number | null) => !n ? '' : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`;
export const emptyToNull = <T extends Record<string, unknown>>(o: T): T => { const r: Record<string, unknown> = {}; for (const k in o) r[k] = o[k] === '' ? null : o[k]; return r as T; };

const csvCell = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCSV = (rows: Record<string, unknown>[], cols: string[]) => [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n');
export const download = (name: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const errMsg = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Something went wrong');
