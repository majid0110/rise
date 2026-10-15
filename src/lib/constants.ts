import type { Status } from './types';

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'saved', label: 'Saved' }, { value: 'to_prepare', label: 'To Prepare' },
  { value: 'preparing', label: 'Preparing Documents' }, { value: 'ready', label: 'Ready to Apply' },
  { value: 'submitted', label: 'Submitted' }, { value: 'interview', label: 'Interview' },
  { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' }, { value: 'archived', label: 'Archived' },
];
export const IN_PROGRESS: Status[] = ['to_prepare', 'preparing', 'ready'];
export const CLOSED: Status[] = ['submitted', 'interview', 'accepted', 'rejected', 'withdrawn', 'archived'];
export const statusLabel = (s: string) => STATUSES.find((x) => x.value === s)?.label ?? s;

export const OPP_TYPES = [
  { value: 'phd', label: 'PhD position' }, { value: 'scholarship', label: 'Scholarship' }, { value: 'masters', label: "Master's" },
  { value: 'postdoc', label: 'Postdoc' }, { value: 'fellowship', label: 'Fellowship' }, { value: 'internship', label: 'Internship' }, { value: 'other', label: 'Other' },
];
export const FUNDING = [
  { value: 'full', label: 'Fully funded' }, { value: 'partial', label: 'Partially funded' }, { value: 'self', label: 'Self-funded' }, { value: 'unknown', label: 'Unknown' },
];
export const PRIORITIES = [{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }];
export const SOURCES = ['University website', 'Professor email', 'WhatsApp', 'Telegram', 'LinkedIn', 'Friend / colleague', 'Other'];

export const DOC_CATEGORIES = [
  { value: 'cv', label: 'CV' }, { value: 'motivation_letter', label: 'Motivation letter' }, { value: 'research_proposal', label: 'Research proposal' },
  { value: 'transcript', label: 'Transcript' }, { value: 'degree_certificate', label: 'Degree certificate' }, { value: 'recommendation_letter', label: 'Recommendation letter' },
  { value: 'passport', label: 'Passport' }, { value: 'english_certificate', label: 'English-language certificate' }, { value: 'publication', label: 'Publication' }, { value: 'other', label: 'Other' },
];
export const READINESS = [{ value: 'needed', label: 'Needed' }, { value: 'draft', label: 'Draft' }, { value: 'ready', label: 'Ready' }];

export const CONTACT_STATUSES = [
  { value: 'not_contacted', label: 'Not contacted' }, { value: 'contacted', label: 'Contacted' }, { value: 'replied', label: 'Replied' },
  { value: 'follow_up_needed', label: 'Follow-up needed' }, { value: 'interested', label: 'Interested' }, { value: 'declined', label: 'Declined' }, { value: 'no_response', label: 'No response' },
];
export const TEMPLATE_KINDS = [
  { value: 'email_initial', label: 'Email: initial contact' }, { value: 'email_followup', label: 'Email: follow-up' },
  { value: 'email_scholarship', label: 'Email: scholarship inquiry' }, { value: 'email_recommendation', label: 'Email: recommendation request' },
  { value: 'motivation_letter', label: 'Motivation letter' }, { value: 'message', label: 'Application message' }, { value: 'other', label: 'Other' },
];
export const DEFAULT_CHECKLIST = [
  'Prepare CV', 'Write motivation letter', 'Write / adapt research proposal', 'Collect transcripts', 'Collect degree certificates',
  'Request recommendation letters', 'Check English-language requirement', 'Submit the application',
];
export const label = (list: { value: string; label: string }[], v: string | null | undefined) => list.find((x) => x.value === v)?.label ?? v ?? '';
