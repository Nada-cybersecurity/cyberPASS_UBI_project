import type { Control } from '../engine/types';

// ISO/IEC 27001:2022 Annex A identifiers are used for mapping only.
// Titles are our own short paraphrases. ISO text is copyrighted and is NOT reproduced here.
// NIST CSF 2.0 function/category codes are public (NIST, US Government work).
// Each control lists the evidence elements an auditor would look for:
//   design    = the rule is written down
//   operation = proof the rule actually runs (records, logs, test results)

const rx = (...p: RegExp[]) => p;

export const CONTROLS: Control[] = [
  {
    id: 'A.5.1', title: 'Approved security policy', theme: 'Organizational', owner: 'CEO',
    nist: [{ fn: 'GV', category: 'GV.PO' }],
    expectations: [
      { id: 'pol', label: 'Information security policy exists', kind: 'design', patterns: rx(/information security policy/i) },
      { id: 'appr', label: 'Approved by management', kind: 'design', patterns: rx(/approved by (management|the board|the ceo|ceo)/i) },
      { id: 'rev', label: 'Dated policy review', kind: 'operation', patterns: rx(/policy (was )?reviewed on \d{4}-\d{2}-\d{2}/i) },
    ],
  },
  {
    id: 'A.5.9', title: 'Asset inventory', theme: 'Organizational', owner: 'CTO',
    nist: [{ fn: 'ID', category: 'ID.AM' }],
    expectations: [
      { id: 'inv', label: 'Asset inventory defined', kind: 'design', patterns: rx(/asset (inventory|register)/i) },
      { id: 'own', label: 'Asset owners assigned', kind: 'design', patterns: rx(/asset owners?/i) },
      { id: 'upd', label: 'Inventory review record', kind: 'operation', patterns: rx(/inventory (updated|reviewed) on/i) },
    ],
  },
  {
    id: 'A.5.14', title: 'Rules for transferring information', theme: 'Organizational', owner: 'DPO / Legal',
    nist: [{ fn: 'PR', category: 'PR.DS' }],
    expectations: [
      { id: 'rules', label: 'International transfer rules', kind: 'design', patterns: rx(/international (data )?transfers?|cross[- ]border transfers?|transfer (mechanism|safeguards?)/i) },
      { id: 'scc', label: 'Standard Contractual Clauses referenced', kind: 'design', patterns: rx(/standard contractual clauses|\bSCCs?\b/i) },
      { id: 'signed', label: 'Signed DPA / SCCs or transfer impact assessment', kind: 'operation', patterns: rx(/signed (dpa|data processing agreement)|executed (sccs?|standard contractual clauses)|transfer impact assessment/i) },
    ],
  },
  {
    id: 'A.5.15', title: 'Access control rules', theme: 'Organizational', owner: 'CTO',
    nist: [{ fn: 'PR', category: 'PR.AA' }],
    expectations: [
      { id: 'rules', label: 'Access control rules documented', kind: 'design', patterns: rx(/access control policy|access to (information|systems) (shall|must|is)/i) },
      { id: 'lp', label: 'Least privilege / need-to-know', kind: 'design', patterns: rx(/least privilege|need[- ]to[- ]know/i) },
      { id: 'rbac', label: 'Role-based access profiles', kind: 'design', patterns: rx(/role[- ]based/i) },
      { id: 'jml', label: 'Joiner / leaver process', kind: 'design', patterns: rx(/joiners?|leavers?|onboarding|offboarding/i) },
      { id: 'req', label: 'Access request records', kind: 'operation', patterns: rx(/access request (tickets?|records?|logs?)|approved access requests/i) },
    ],
  },
  {
    id: 'A.5.18', title: 'Access rights lifecycle and review', theme: 'Organizational', owner: 'Operations lead',
    nist: [{ fn: 'PR', category: 'PR.AA' }],
    expectations: [
      { id: 'rev', label: 'Access reviews defined', kind: 'design', patterns: rx(/access (rights )?(shall|must|will) be reviewed|review of access rights|access reviews?/i) },
      { id: 'freq', label: 'Quarterly review frequency', kind: 'design', patterns: rx(/quarterly|every (three|3) months/i) },
      { id: 'rm', label: 'Removal timeline for leavers', kind: 'design', patterns: rx(/(revoked|removed|disabled) within \d+|on the last working day|within (24|48) hours/i) },
      { id: 'rec', label: 'Signed access review records', kind: 'operation', patterns: rx(/access review (record|log|evidence|sign[- ]?off)|review completed on \d{4}/i) },
    ],
  },
  {
    id: 'A.5.19', title: 'Supplier security', theme: 'Organizational', owner: 'Operations lead',
    nist: [{ fn: 'GV', category: 'GV.SC' }],
    expectations: [
      { id: 'dd', label: 'Supplier security assessment process', kind: 'design', patterns: rx(/supplier (security|assessment|due diligence)|third[- ]party risk/i) },
      { id: 'res', label: 'Completed supplier assessments', kind: 'operation', patterns: rx(/supplier (assessment|questionnaire) (completed|results)|vendor review (record|completed)/i) },
    ],
  },
  {
    id: 'A.5.20', title: 'Security terms in supplier agreements', theme: 'Organizational', owner: 'DPO / Legal',
    nist: [{ fn: 'GV', category: 'GV.SC' }],
    expectations: [
      { id: 'cl', label: 'Security clauses in contracts', kind: 'design', patterns: rx(/security (clauses|requirements) in (contracts|agreements)/i) },
      { id: 'dpa', label: 'Data processing agreements in place', kind: 'operation', patterns: rx(/signed (dpa|data processing agreement)/i) },
    ],
  },
  {
    id: 'A.5.24', title: 'Incident response planning', theme: 'Organizational', owner: 'CTO',
    nist: [{ fn: 'RS', category: 'RS.MA' }],
    expectations: [
      { id: 'roles', label: 'Incident roles defined', kind: 'design', patterns: rx(/incident response (team|roles|lead|manager)|incident (coordinator|commander|lead)/i) },
      { id: 'sev', label: 'Severity classification', kind: 'design', patterns: rx(/severity (levels?|classification)|classif(y|ication) of incidents/i) },
      { id: 'esc', label: 'Escalation contacts', kind: 'design', patterns: rx(/contact list|escalation (path|matrix|contacts)/i) },
      { id: 'ex', label: 'Tested through an exercise', kind: 'operation', patterns: rx(/tabletop|exercise (held|conducted|completed)|simulation (held|conducted)/i) },
    ],
  },
  {
    id: 'A.5.26', title: 'Incident response execution', theme: 'Organizational', owner: 'CTO',
    nist: [{ fn: 'RS', category: 'RS.MI' }],
    expectations: [
      { id: 'steps', label: 'Containment and recovery steps', kind: 'design', patterns: rx(/containment|eradicat|recovery steps/i) },
      { id: 'notify', label: 'Customer notification', kind: 'design', patterns: rx(/notify (affected )?customers|customer notification/i) },
      { id: 'timeline', label: 'Notification timeline in hours', kind: 'design', patterns: rx(/within \d+ hours of (detection|discovery|becoming aware)/i) },
      { id: 'll', label: 'Lessons learned', kind: 'design', patterns: rx(/lessons learned|post[- ]incident review/i) },
      { id: 'log', label: 'Incident log', kind: 'operation', patterns: rx(/incident (log|register) (entries|records)/i) },
    ],
  },
  {
    id: 'A.5.30', title: 'Business continuity readiness', theme: 'Organizational', owner: 'CEO',
    nist: [{ fn: 'RC', category: 'RC.RP' }],
    expectations: [
      { id: 'bcp', label: 'Continuity plan', kind: 'design', patterns: rx(/business continuity|continuity plan|disaster recovery plan/i) },
      { id: 'obj', label: 'Recovery objectives (RTO/RPO)', kind: 'design', patterns: rx(/\bRTO\b|\bRPO\b|recovery time objective/i) },
      { id: 'test', label: 'Continuity test', kind: 'operation', patterns: rx(/continuity (test|exercise) (completed|held)|dr test (completed|held)/i) },
    ],
  },
  {
    id: 'A.5.31', title: 'Legal and contractual requirements register', theme: 'Organizational', owner: 'DPO / Legal',
    nist: [{ fn: 'GV', category: 'GV.OC' }],
    expectations: [
      { id: 'reg', label: 'Legal requirements identified', kind: 'design', patterns: rx(/legal (requirements|register)|regulatory requirements|applicable laws/i) },
      { id: 'upd', label: 'Register reviewed', kind: 'operation', patterns: rx(/legal register (reviewed|updated) on/i) },
    ],
  },
  {
    id: 'A.5.34', title: 'Personal data protection', theme: 'Organizational', owner: 'DPO / Legal',
    nist: [{ fn: 'PR', category: 'PR.DS' }, { fn: 'GV', category: 'GV.OC' }],
    expectations: [
      { id: 'pol', label: 'Data protection policy / privacy notice', kind: 'design', patterns: rx(/data protection policy|privacy notice/i) },
      { id: 'dsr', label: 'Data subject rights handling', kind: 'design', patterns: rx(/data subject (rights|requests)|right of access/i) },
      { id: 'ret', label: 'Retention schedule', kind: 'design', patterns: rx(/data retention|retention schedule/i) },
      { id: 'ropa', label: 'Processing register or CNDP receipt', kind: 'operation', patterns: rx(/record of processing|processing register|cndp (declaration|receipt|authori[sz]ation)/i) },
    ],
  },
  {
    id: 'A.6.3', title: 'Security awareness and training', theme: 'People', owner: 'HR lead',
    nist: [{ fn: 'PR', category: 'PR.AT' }],
    expectations: [
      { id: 'prog', label: 'Awareness programme', kind: 'design', patterns: rx(/awareness (training|programme|program)|security training/i) },
      { id: 'phish', label: 'Phishing awareness', kind: 'design', patterns: rx(/phishing/i) },
      { id: 'comp', label: 'Completion records', kind: 'operation', patterns: rx(/completion (rate|records?)|completed (the )?training|attendance (list|record)/i) },
    ],
  },
  {
    id: 'A.8.2', title: 'Privileged access', theme: 'Technological', owner: 'CTO',
    nist: [{ fn: 'PR', category: 'PR.AA' }],
    expectations: [
      { id: 'restr', label: 'Privileged accounts restricted', kind: 'design', patterns: rx(/privileged (accounts|access|users)|administrator (accounts|rights|access)/i) },
      { id: 'sep', label: 'Separate admin accounts', kind: 'design', patterns: rx(/separate (administrator|admin|privileged) accounts?|dedicated admin(istrator)? accounts?/i) },
      { id: 'mon', label: 'Privileged activity logged', kind: 'design', patterns: rx(/privileged (activity|actions|sessions) (shall|must|are|will) be (logged|monitored|recorded)/i) },
      { id: 'list', label: 'Privileged access register', kind: 'operation', patterns: rx(/list of privileged (users|accounts)|privileged access register/i) },
    ],
  },
  {
    id: 'A.8.5', title: 'Secure authentication (MFA)', theme: 'Technological', owner: 'CTO',
    nist: [{ fn: 'PR', category: 'PR.AA' }],
    expectations: [
      { id: 'cx', label: 'Password length and complexity', kind: 'design', patterns: rx(/(minimum|at least) (of )?\d+ characters|password complexity|complex passwords?/i) },
      { id: 'lock', label: 'Account lockout', kind: 'design', patterns: rx(/locked out|lockout|failed (login|logon|sign[- ]in) attempts/i) },
      { id: 'pm', label: 'Password manager', kind: 'design', patterns: rx(/password manager/i) },
      { id: 'mfa', label: 'Multi-factor authentication required', kind: 'design', patterns: rx(/multi[- ]factor|\bMFA\b|two[- ]factor|\b2FA\b/i) },
      { id: 'mfaop', label: 'MFA enforcement report', kind: 'operation', patterns: rx(/(mfa|multi[- ]factor).{0,60}(enforced|enabled for all|report|export)|conditional access (policy|report)/i) },
    ],
  },
  {
    id: 'A.8.7', title: 'Malware and endpoint protection', theme: 'Technological', owner: 'CTO',
    nist: [{ fn: 'DE', category: 'DE.CM' }, { fn: 'PR', category: 'PR.PS' }],
    expectations: [
      { id: 'edr', label: 'Endpoint protection deployed', kind: 'design', patterns: rx(/anti[- ]?malware|endpoint (protection|detection)|\bEDR\b/i) },
      { id: 'rep', label: 'Endpoint console report', kind: 'operation', patterns: rx(/(edr|endpoint) (console|report|export)/i) },
    ],
  },
  {
    id: 'A.8.8', title: 'Vulnerability management', theme: 'Technological', owner: 'CTO',
    nist: [{ fn: 'ID', category: 'ID.RA' }],
    expectations: [
      { id: 'vm', label: 'Scanning and patching rules', kind: 'design', patterns: rx(/vulnerability (management|scanning)|patch(ing)? (within|timeline|policy)/i) },
      { id: 'scan', label: 'Scan results', kind: 'operation', patterns: rx(/scan (report|results)|findings remediated/i) },
    ],
  },
  {
    id: 'A.8.13', title: 'Backups and restore testing', theme: 'Technological', owner: 'CTO',
    nist: [{ fn: 'PR', category: 'PR.DS' }, { fn: 'RC', category: 'RC.RP' }],
    expectations: [
      { id: 'sch', label: 'Backup schedule', kind: 'design', patterns: rx(/daily backups?|backups? (are|shall be) (taken|performed)|backup (schedule|frequency)/i) },
      { id: 'ret', label: 'Retention period', kind: 'design', patterns: rx(/retention period|retained for \d+/i) },
      { id: 'iso', label: 'Isolated or immutable copy', kind: 'design', patterns: rx(/separate (aws )?(region|account|location)|off[- ]?site|immutable/i) },
      { id: 'test', label: 'Restore test results', kind: 'operation', patterns: rx(/restore test|restoration test|test restore|restored successfully/i) },
    ],
  },
  {
    id: 'A.8.15', title: 'Logging and monitoring', theme: 'Technological', owner: 'CTO',
    nist: [{ fn: 'DE', category: 'DE.CM' }],
    expectations: [
      { id: 'log', label: 'Logging requirements', kind: 'design', patterns: rx(/logs (are|shall be) (retained|collected|centralised|centralized)|logging (policy|standard)/i) },
      { id: 'siem', label: 'Centralised log monitoring', kind: 'design', patterns: rx(/centrali[sz]ed log|\bSIEM\b/i) },
      { id: 'rev', label: 'Log or alert review records', kind: 'operation', patterns: rx(/log review (record|completed)|alert (review|triage) records?/i) },
    ],
  },
];

export const CONTROL_BY_ID = Object.fromEntries(CONTROLS.map((c) => [c.id, c])) as Record<string, Control>;
