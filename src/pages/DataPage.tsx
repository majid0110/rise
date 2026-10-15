import { useData } from '../lib/data';
import { download, toCSV, todayStr } from '../lib/util';

export default function DataPage() {
  const d = useData();
  const stamp = todayStr();
  const csv = (name: string, rows: Record<string, unknown>[], cols: string[]) => download(`scholartrack-${name}-${stamp}.csv`, toCSV(rows, cols), 'text/csv;charset=utf-8');
  const backup = () => download(`scholartrack-backup-${stamp}.json`, JSON.stringify({ exported_at: new Date().toISOString(), note: 'Structured records only. Uploaded document files are not included - download them from the Vault.', opportunities: d.opps, checklist_items: d.checklist, documents: d.docs.map(({ file_path, ...r }) => ({ ...r, has_file: Boolean(file_path) })), contacts: d.contacts, contact_opportunities: d.links, templates: d.templates, profile: d.profile }, null, 2), 'application/json');
  return (
    <div className="stack">
      <h1>Export and backup</h1>
      <div className="card stack"><h2>CSV export</h2>
        <div className="row wrap">
          <button className="btn" onClick={() => csv('opportunities', d.opps as unknown as Record<string, unknown>[], ['title', 'organization', 'url', 'country', 'opp_type', 'funding', 'deadline', 'source', 'priority', 'status', 'archived', 'reminder_date', 'follow_up_date', 'notes', 'created_at'])}>Opportunities ({d.opps.length})</button>
          <button className="btn" onClick={() => csv('contacts', d.contacts as unknown as Record<string, unknown>[], ['name', 'email', 'university', 'research_interests', 'status', 'contacted_at', 'follow_up_date', 'notes'])}>Contacts ({d.contacts.length})</button>
          <button className="btn" onClick={() => csv('documents', d.docs as unknown as Record<string, unknown>[], ['name', 'category', 'readiness', 'file_name', 'notes', 'updated_at'])}>Documents ({d.docs.length})</button>
        </div></div>
      <div className="card stack"><h2>JSON backup</h2><p className="muted small" style={{ margin: 0 }}>All structured records in one file. Uploaded files are not included; download them individually from the Vault.</p><div><button className="btn primary" onClick={backup}>Download backup</button></div></div>
      <div className="card stack"><h2>Account</h2><p className="muted small" style={{ margin: 0 }}>Signed in as {d.userEmail}</p></div>
    </div>
  );
}
