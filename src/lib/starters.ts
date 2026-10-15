// Generic starter templates. They contain placeholders only - no invented qualifications.
export const STARTERS = [
  { kind: 'email_initial', name: 'Initial contact to a professor', subject: 'Prospective PhD student - {{research_interests}}',
    body: `Dear Professor {{professor_name}},\n\nMy name is {{my_name}}. I am currently {{my_degree}} at {{my_institution}}, and I am writing to ask whether you are accepting PhD students at {{university}}.\n\nI am interested in your work on {{research_interests}}. [Add one or two specific sentences about a paper of theirs and how it relates to your background.]\n\nI have attached my CV. [Add attachments you actually include.] I would be grateful for any advice on whether a funded position may be available.\n\nKind regards,\n{{my_name}}` },
  { kind: 'email_followup', name: 'Follow-up after no reply', subject: 'Following up: PhD enquiry',
    body: `Dear Professor {{professor_name}},\n\nI wrote some time ago about PhD opportunities in your group at {{university}}. I understand you are busy and wanted to follow up briefly.\n\nIf there is no opening at the moment, I would appreciate any suggestion of colleagues who may be recruiting.\n\nKind regards,\n{{my_name}}` },
  { kind: 'email_scholarship', name: 'Scholarship / funding inquiry', subject: 'Funding enquiry: {{opportunity_title}}',
    body: `Dear Professor {{professor_name}},\n\nI am applying for {{opportunity_title}} and would like to ask whether your group has funding available for a PhD student working on {{research_interests}}.\n\n[Add the specific question, e.g. deadline flexibility or required documents.]\n\nThank you for your time.\n\nKind regards,\n{{my_name}}` },
  { kind: 'email_recommendation', name: 'Recommendation letter request', subject: 'Request for a recommendation letter',
    body: `Dear Professor {{professor_name}},\n\nI am applying for {{opportunity_title}} and would be grateful if you could write a recommendation letter for me.\n\nThe deadline is [date]. I can send my CV, transcript, and a short summary of my work together to make this easier.\n\nThank you for considering this.\n\nKind regards,\n{{my_name}}` },
  { kind: 'motivation_letter', name: 'Motivation letter outline', subject: '',
    body: `[Opening: the position and why you are applying]\n\n[Your academic background: only facts you can document]\n\n[Research interests and fit with the group or programme]\n\n[Future goals]\n\n[Closing]` },
];
