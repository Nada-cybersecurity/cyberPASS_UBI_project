import type { Action, Answer, AuditEvent, DataFlow, EvidenceRecord, OrgContext, Question, Risk } from '../engine/types';

// AtlasTech is a FICTIONAL company created for this demo. Any resemblance to a real company is unintended.

export const ATLASTECH: OrgContext = {
  name: 'AtlasTech',
  legalForm: 'SARL (fictional)',
  country: 'MA',
  city: 'Rabat',
  sector: 'saas',
  employees: 35,
  admins: 3,
  contractors: 5,
  sellsTo: { morocco: true, eu: true, africa: false },
  euCustomerCountries: ['FR', 'DE'],
  euBusinessCustomers: true,
  euIndividualsTargeted: false,
  euFinancialCustomers: false,
  euDataProcessed: true,
  moroccanPersonalData: true,
  hosting: 'eu',
  remoteAccessFromMorocco: true,
  publicEntity: false,
  vitalInfrastructure: false,
  dataTypes: { customerPersonal: true, employee: true, financial: false, health: false, credentials: true },
  tech: { aws: true, m365: true, googleWs: false, onPrem: false, vpn: true, remoteWork: true, apis: true },
};

const D = '2026-09-28';

// What AtlasTech had already documented before the demo starts.
export const SEED_EVIDENCE: EvidenceRecord[] = [
  { controlId: 'A.5.1', status: 'supported', documents: ['Information_Security_Policy_v2.pdf'], note: 'Approved by the CEO, reviewed in March 2026.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.9', status: 'partial', documents: ['Asset_Inventory.xlsx'], note: 'Covers laptops and AWS accounts. SaaS tools and data stores missing.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.14', status: 'not_demonstrated', documents: [], note: 'No transfer mechanism documented for access from Morocco.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.15', status: 'not_demonstrated', documents: [], note: 'No access control policy uploaded yet.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.18', status: 'not_demonstrated', documents: [], note: 'No access review evidence.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.19', status: 'partial', documents: ['Supplier_List.xlsx'], note: 'Suppliers listed, no security assessment.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.20', status: 'supported', documents: ['AWS_DPA.pdf', 'Microsoft_DPA.pdf'], note: 'Provider DPAs signed for AWS and Microsoft 365.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.24', status: 'partial', documents: ['IR_Plan_draft.docx'], note: 'Draft plan, never exercised.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.26', status: 'not_demonstrated', documents: [], note: 'No response procedure or incident log.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.30', status: 'not_demonstrated', documents: [], note: 'No continuity plan.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.31', status: 'partial', documents: ['Legal_Register_v0.xlsx'], note: 'Started, EU requirements not covered.', updatedAt: D, source: 'seed' },
  { controlId: 'A.5.34', status: 'partial', documents: ['Privacy_Notice.pdf'], note: 'Privacy notice published. No processing register or CNDP receipt.', updatedAt: D, source: 'seed' },
  { controlId: 'A.6.3', status: 'not_demonstrated', documents: [], note: 'No training records.', updatedAt: D, source: 'seed' },
  { controlId: 'A.8.2', status: 'not_demonstrated', documents: [], note: '3 administrators, no privileged access register.', updatedAt: D, source: 'seed' },
  { controlId: 'A.8.5', status: 'not_demonstrated', documents: [], note: 'MFA status for administrators unknown.', updatedAt: D, source: 'seed' },
  { controlId: 'A.8.7', status: 'supported', documents: ['EDR_console_export.pdf'], note: 'Endpoint protection on all 35 laptops.', updatedAt: D, source: 'seed' },
  { controlId: 'A.8.8', status: 'partial', documents: ['Patch_Procedure.pdf'], note: 'Patching rules exist, no scan results.', updatedAt: D, source: 'seed' },
  { controlId: 'A.8.13', status: 'partial', documents: ['AWS_Backup_config.png'], note: 'Daily backups configured. Restore never tested.', updatedAt: D, source: 'seed' },
  { controlId: 'A.8.15', status: 'not_demonstrated', documents: [], note: 'CloudTrail enabled, no review process.', updatedAt: D, source: 'seed' },
];

export const RISKS: Risk[] = [
  { id: 'R01', title: 'Unauthorised access to the customer database', scenario: 'A stolen administrator password gives an attacker access to EU and Moroccan customer data in production.', likelihood: 4, impact: 5, controls: ['A.8.5', 'A.8.2', 'A.5.15', 'A.5.18'], weights: { 'A.8.5': 2, 'A.8.2': 1.5 }, owner: 'CTO', treatment: 'Reduce' },
  { id: 'R02', title: 'Microsoft 365 account takeover through phishing', scenario: 'An employee enters credentials on a phishing page; mailboxes with customer contracts are exposed.', likelihood: 4, impact: 4, controls: ['A.8.5', 'A.6.3'], weights: { 'A.8.5': 2 }, owner: 'CTO', treatment: 'Reduce' },
  { id: 'R03', title: 'Breach handled late or badly', scenario: 'A breach affecting EU customer data is not escalated, and customers are informed too late to meet their own deadlines.', likelihood: 3, impact: 5, controls: ['A.5.24', 'A.5.26'], owner: 'CTO', treatment: 'Reduce' },
  { id: 'R04', title: 'Ransomware with no proven restore', scenario: 'Production data is encrypted and backups have never been restored, extending downtime.', likelihood: 3, impact: 5, controls: ['A.8.13', 'A.8.7'], weights: { 'A.8.13': 2 }, owner: 'CTO', treatment: 'Reduce' },
  { id: 'R05', title: 'Undocumented transfer of EU data to Morocco', scenario: 'Support staff in Rabat access EU customer data without SCCs or a transfer assessment in place.', likelihood: 4, impact: 4, controls: ['A.5.14', 'A.5.34', 'A.5.31'], weights: { 'A.5.14': 2 }, owner: 'DPO / Legal', treatment: 'Reduce' },
  { id: 'R06', title: 'Former contractor keeps access', scenario: 'One of 5 contractors leaves and their accounts stay active for weeks.', likelihood: 3, impact: 4, controls: ['A.5.18', 'A.5.15'], owner: 'Operations lead', treatment: 'Reduce' },
  { id: 'R07', title: 'Exploited unpatched internet-facing service', scenario: 'A known vulnerability in a public API component is exploited before it is patched.', likelihood: 3, impact: 4, controls: ['A.8.8'], owner: 'CTO', treatment: 'Reduce' },
  { id: 'R08', title: 'Attack goes undetected', scenario: 'Suspicious administrator activity in AWS is logged but nobody reviews it.', likelihood: 3, impact: 4, controls: ['A.8.15'], owner: 'CTO', treatment: 'Reduce' },
  { id: 'R09', title: 'Compromise through a supplier', scenario: 'The email or payment provider suffers an incident that exposes AtlasTech data.', likelihood: 2, impact: 4, controls: ['A.5.19', 'A.5.20'], owner: 'Operations lead', treatment: 'Transfer' },
  { id: 'R10', title: 'Personal data in unknown systems', scenario: 'Customer exports sit in untracked SaaS tools and are missed by security controls.', likelihood: 3, impact: 3, controls: ['A.5.9'], owner: 'CTO', treatment: 'Reduce' },
  { id: 'R11', title: 'Long outage with no continuity plan', scenario: 'A regional cloud outage stops the service and there is no plan to recover within customer expectations.', likelihood: 2, impact: 4, controls: ['A.5.30', 'A.8.13'], owner: 'CEO', treatment: 'Reduce' },
  { id: 'R12', title: 'Missing CNDP formalities', scenario: 'Processing activities run without the required CNDP declarations.', likelihood: 3, impact: 3, controls: ['A.5.34', 'A.5.31'], owner: 'DPO / Legal', treatment: 'Reduce' },
];

export const ACTIONS: Action[] = [
  { id: 'ACT-MFA', title: 'Enforce MFA for administrators and all staff', detail: 'Turn on MFA for the 3 AWS and Microsoft 365 administrators first, then all 35 staff and 5 contractors. Export the enforcement report as evidence.', controls: ['A.8.5', 'A.8.2'], effort: 'S', cost: 'Low', owner: 'CTO', days: 14 },
  { id: 'ACT-REVIEW', title: 'Run quarterly access reviews with sign-off', detail: 'Review who has access to production, AWS and Microsoft 365 every quarter. Record the reviewer, date and removals.', controls: ['A.5.18', 'A.5.15'], effort: 'S', cost: 'Low', owner: 'Operations lead', days: 30 },
  { id: 'ACT-IR', title: 'Complete and test the incident response procedure', detail: 'Add customer notification timelines and run a one-hour tabletop exercise on a customer data breach.', controls: ['A.5.24', 'A.5.26'], effort: 'M', cost: 'Low', owner: 'CTO', days: 45 },
  { id: 'ACT-TRANSFER', title: 'Put SCCs and a transfer assessment in place', detail: 'Agree data processing agreements with SCCs with EU customers and document a transfer impact assessment for access from Morocco.', controls: ['A.5.14', 'A.5.34'], effort: 'M', cost: 'Medium', owner: 'DPO / Legal', days: 45 },
  { id: 'ACT-BACKUP', title: 'Test a full restore and record the result', detail: 'Restore production from backup into an isolated account and record time and data completeness.', controls: ['A.8.13'], effort: 'S', cost: 'Low', owner: 'CTO', days: 30 },
  { id: 'ACT-TRAIN', title: 'Run security awareness training with records', detail: 'Phishing-focused training for all staff and contractors, with completion records.', controls: ['A.6.3'], effort: 'M', cost: 'Low', owner: 'HR lead', days: 60 },
  { id: 'ACT-CNDP', title: 'Complete CNDP formalities and a processing register', detail: 'List processing activities and file the required declarations or authorisation requests.', controls: ['A.5.34', 'A.5.31'], effort: 'M', cost: 'Low', owner: 'DPO / Legal', days: 60 },
  { id: 'ACT-ASSETS', title: 'Complete the asset and data inventory', detail: 'Add SaaS tools and data stores holding personal data, each with an owner.', controls: ['A.5.9'], effort: 'S', cost: 'Low', owner: 'CTO', days: 30 },
  { id: 'ACT-VULN', title: 'Monthly vulnerability scanning', detail: 'Scan internet-facing services monthly and track remediation of findings.', controls: ['A.8.8'], effort: 'M', cost: 'Medium', owner: 'CTO', days: 60 },
  { id: 'ACT-LOGS', title: 'Review administrator activity logs weekly', detail: 'Send AWS and Microsoft 365 admin logs to one place and record a weekly review.', controls: ['A.8.15'], effort: 'M', cost: 'Medium', owner: 'CTO', days: 90 },
  { id: 'ACT-SUPPLIERS', title: 'Assess critical suppliers', detail: 'Collect security evidence from the email and payment providers.', controls: ['A.5.19'], effort: 'M', cost: 'Low', owner: 'Operations lead', days: 90 },
  { id: 'ACT-BCP', title: 'Write and test a continuity plan', detail: 'Set recovery objectives with customers in mind and test them once a year.', controls: ['A.5.30'], effort: 'L', cost: 'Medium', owner: 'CEO', days: 90 },
];

export const QUESTIONS: Question[] = [
  { id: 'q-mfa', topic: 'MFA', text: 'Is multi-factor authentication required for all accounts, including administrators?', weight: 10, severity: 'critical', controls: ['A.8.5'] },
  { id: 'q-pwd', topic: 'Password management', text: 'Do staff use a company password manager with strong password rules?', weight: 6, severity: 'medium', controls: ['A.8.5'] },
  { id: 'q-rev', topic: 'Access reviews', text: 'Are access rights reviewed at least quarterly, with records?', weight: 8, severity: 'high', controls: ['A.5.18'] },
  { id: 'q-priv', topic: 'Privileged accounts', text: 'Are administrator accounts limited, named and separate from daily accounts?', weight: 9, severity: 'critical', controls: ['A.8.2'] },
  { id: 'q-bak', topic: 'Backups', text: 'Are backups isolated and is a restore tested at least yearly?', weight: 8, severity: 'high', controls: ['A.8.13'] },
  { id: 'q-ir', topic: 'Incident response', text: 'Is there a tested incident response procedure with customer notification steps?', weight: 8, severity: 'high', controls: ['A.5.24', 'A.5.26'] },
  { id: 'q-aw', topic: 'Awareness', text: 'Do all staff complete security awareness training each year?', weight: 6, severity: 'medium', controls: ['A.6.3'] },
  { id: 'q-edr', topic: 'Endpoint security', text: 'Do all laptops run managed endpoint protection?', weight: 7, severity: 'high', controls: ['A.8.7'] },
  { id: 'q-vuln', topic: 'Vulnerability management', text: 'Are internet-facing systems scanned and patched on a schedule?', weight: 7, severity: 'high', controls: ['A.8.8'] },
  { id: 'q-sup', topic: 'Supplier security', text: 'Are critical suppliers assessed for security before and during the contract?', weight: 5, severity: 'medium', controls: ['A.5.19'] },
  { id: 'q-asset', topic: 'Asset management', text: 'Is there a current inventory of systems and data stores with owners?', weight: 5, severity: 'medium', controls: ['A.5.9'] },
  { id: 'q-log', topic: 'Logging', text: 'Are security logs collected and reviewed?', weight: 6, severity: 'medium', controls: ['A.8.15'] },
  { id: 'q-bcp', topic: 'Business continuity', text: 'Is there a continuity plan with recovery objectives?', weight: 5, severity: 'medium', controls: ['A.5.30'] },
  { id: 'q-dp', topic: 'Data protection', text: 'Are personal data processing activities documented with a legal basis and retention?', weight: 8, severity: 'high', controls: ['A.5.34'] },
];

export const SEED_ANSWERS: Record<string, Answer> = {
  'q-mfa': 'partial', 'q-pwd': 'yes', 'q-rev': 'no', 'q-priv': 'partial', 'q-bak': 'partial', 'q-ir': 'partial', 'q-aw': 'partial',
  'q-edr': 'yes', 'q-vuln': 'yes', 'q-sup': 'yes', 'q-asset': 'yes', 'q-log': 'partial', 'q-bcp': 'no', 'q-dp': 'partial',
};

export const SEED_FLOWS: DataFlow[] = [
  { id: 'F1', fromLabel: 'EU business customers (France, Germany)', fromCountry: 'EU', toLabel: 'AtlasTech platform on AWS', data: 'Customer end-user personal data', purpose: 'Deliver the SaaS service', party: 'AtlasTech (processor)', role: 'processor', storage: 'platform', access: 'EU', dataSubjects: 'EU' },
  { id: 'F2', fromLabel: 'AtlasTech platform on AWS', fromCountry: 'EU', toLabel: 'Support and engineering team, Rabat', data: 'Customer end-user personal data (remote access)', purpose: 'Support and maintenance', party: 'AtlasTech staff and 5 contractors', role: 'internal', storage: 'platform', access: 'MA', dataSubjects: 'EU' },
  { id: 'F3', fromLabel: 'Moroccan customers', fromCountry: 'MA', toLabel: 'AtlasTech platform on AWS', data: 'Customer personal data', purpose: 'Deliver the SaaS service', party: 'AtlasTech (controller for its own accounts)', role: 'controller', storage: 'platform', access: 'MA', dataSubjects: 'MA' },
  { id: 'F4', fromLabel: 'AtlasTech staff, Rabat', fromCountry: 'MA', toLabel: 'Email provider (Microsoft 365)', data: 'Employee and customer contact data', purpose: 'Email and collaboration', party: 'Microsoft (sub-processor)', role: 'subprocessor', storage: 'EU', access: 'MA', dataSubjects: 'MIXED' },
  { id: 'F5', fromLabel: 'AtlasTech platform on AWS', fromCountry: 'EU', toLabel: 'Payment provider', data: 'Billing contact and transaction data', purpose: 'Invoicing EU customers', party: 'Payment provider (sub-processor)', role: 'subprocessor', storage: 'UNKNOWN', access: 'UNKNOWN', dataSubjects: 'EU' },
  { id: 'F6', fromLabel: 'AtlasTech HR', fromCountry: 'MA', toLabel: 'HR files, Rabat office', data: 'Employee data', purpose: 'Payroll and HR', party: 'AtlasTech HR', role: 'internal', storage: 'MA', access: 'MA', dataSubjects: 'MA' },
];

export const SEED_AUDIT: AuditEvent[] = [
  { at: '2026-09-28T09:12:00Z', actor: 'Salma (Company admin)', action: 'Created organisation AtlasTech' },
  { at: '2026-09-28T09:40:00Z', actor: 'Youssef (GRC analyst)', action: 'Imported 11 existing evidence documents' },
  { at: '2026-09-29T14:05:00Z', actor: 'Youssef (GRC analyst)', action: 'Completed cybersecurity assessment (14 questions)' },
];
