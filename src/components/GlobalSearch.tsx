import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/data';
import { Modal } from './ui';
import { OppDetail } from './OppDetail';

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { opps, contacts, docs, templates } = useData(); const nav = useNavigate();
  const [q, setQ] = useState(''); const [detail, setDetail] = useState<string | null>(null);
  const s = q.trim().toLowerCase();
  const res = useMemo(() => {
    if (!s) return null; const m = (...v: (string | null | undefined)[]) => v.some((x) => x?.toLowerCase().includes(s));
    return {
      opps: opps.filter((o) => m(o.title, o.organization, o.country, o.source, o.notes, o.url)).slice(0, 8),
      contacts: contacts.filter((c) => m(c.name, c.university, c.email, c.research_interests, c.notes)).slice(0, 6),
      docs: docs.filter((d) => m(d.name, d.file_name, d.notes)).slice(0, 6),
      templates: templates.filter((t) => m(t.name, t.body)).slice(0, 4),
    };
  }, [s, opps, contacts, docs, templates]);
  const total = res ? res.opps.length + res.contacts.length + res.docs.length + res.templates.length : 0;
  if (detail) return <OppDetail id={detail} onClose={() => setDetail(null)} />;
  const go = (p: string) => { nav(p); onClose(); };
  return (
    <Modal title="Search everything" onClose={onClose}>
      <div className="stack">
        <input autoFocus type="search" placeholder="Opportunities, professors, documents, templates…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Global search" />
        {res && total === 0 && <p className="muted">No results for “{q}”.</p>}
        {res && res.opps.length > 0 && <><h3>Opportunities</h3>{res.opps.map((o) => <div key={o.id} className="item" onClick={() => setDetail(o.id)}><div className="grow"><h3>{o.title}</h3><span className="muted small">{o.organization}{o.archived ? ' · archived' : ''}</span></div></div>)}</>}
        {res && res.contacts.length > 0 && <><h3>Professors</h3>{res.contacts.map((c) => <div key={c.id} className="item" onClick={() => go('/contacts')}><div className="grow"><h3>{c.name}</h3><span className="muted small">{c.university}</span></div></div>)}</>}
        {res && res.docs.length > 0 && <><h3>Documents</h3>{res.docs.map((d) => <div key={d.id} className="item" onClick={() => go('/vault')}><div className="grow"><h3>{d.name}</h3><span className="muted small">{d.file_name}</span></div></div>)}</>}
        {res && res.templates.length > 0 && <><h3>Templates</h3>{res.templates.map((t) => <div key={t.id} className="item" onClick={() => go('/profile')}><div className="grow"><h3>{t.name}</h3></div></div>)}</>}
      </div>
    </Modal>
  );
}
