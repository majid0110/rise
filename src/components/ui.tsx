import { useEffect, type ReactNode } from 'react';
import { daysUntil, relDays, fmtDate } from '../lib/util';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between" style={{ marginBottom: 14 }}><h2>{title}</h2><button className="iconbtn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}
export const Spinner = () => <div className="spin" role="status" aria-label="Loading" />;
export const Empty = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="empty"><h3 style={{ color: 'var(--text)' }}>{title}</h3>{hint && <p>{hint}</p>}{action}</div>
);
export function DeadlineChip({ date }: { date: string | null }) {
  const n = daysUntil(date);
  if (n === null) return <span className="chip">No deadline</span>;
  const cls = n < 0 ? 'bad' : n <= 7 ? 'warn' : 'blue';
  return <span className={`chip ${cls}`} title={fmtDate(date)}>{fmtDate(date)} · {relDays(n)}</span>;
}
export const Field = ({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) => (
  <label className={`f ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>
);
export const Confirm = ({ msg, onYes, onNo, yes = 'Delete' }: { msg: string; onYes: () => void; onNo: () => void; yes?: string }) => (
  <Modal title="Are you sure?" onClose={onNo}><p>{msg}</p><div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={onNo}>Cancel</button><button className="btn danger" onClick={onYes}>{yes}</button></div></Modal>
);
