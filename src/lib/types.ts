export type Status = 'saved' | 'to_prepare' | 'preparing' | 'ready' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'withdrawn' | 'archived';
export interface Opportunity {
  id: string; user_id: string; title: string; organization: string | null; url: string | null; country: string | null;
  opp_type: string; funding: string; deadline: string | null; source: string | null; priority: string; status: Status;
  notes: string | null; reminder_date: string | null; follow_up_date: string | null; archived: boolean;
  submitted_at: string | null; created_at: string; updated_at: string;
}
export interface ChecklistItem {
  id: string; opportunity_id: string; title: string; done: boolean; due_date: string | null; document_id: string | null; sort_order: number;
}
export interface DocumentRec {
  id: string; name: string; category: string; readiness: 'needed' | 'draft' | 'ready'; notes: string | null;
  file_path: string | null; file_name: string | null; file_size: number | null; mime_type: string | null; updated_at: string;
}
export interface Contact {
  id: string; name: string; email: string | null; university: string | null; research_interests: string | null;
  status: string; contacted_at: string | null; follow_up_date: string | null; notes: string | null;
}
export interface ContactLink { contact_id: string; opportunity_id: string }
export interface Template { id: string; kind: string; name: string; subject: string | null; body: string }
export interface Activity { id: string; entity: string; entity_id: string | null; message: string; created_at: string }
export interface Profile {
  full_name: string | null; email: string | null; phone: string | null; nationality: string | null; country_of_residence: string | null;
  current_degree: string | null; current_institution: string | null; field_of_study: string | null; gpa: string | null;
  research_interests: string | null; english_test: string | null; links: string | null; bio: string | null;
}
