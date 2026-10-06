// Domain model. Everything that decides a status, a score or a permission is deterministic code.
// AI-style text analysis only proposes evidence findings; a human applies them.

export type CountryCode = 'MA' | 'FR' | 'DE' | 'ES' | 'EU' | 'US' | 'UNKNOWN';
export type Applicability = 'applicable' | 'review' | 'not_applicable';
export type EvidenceStatus = 'supported' | 'partial' | 'not_demonstrated' | 'irrelevant';
export type SourceStatus = 'verified' | 'secondary' | 'unverified_demo';
export type Confidence = 'high' | 'medium' | 'low';
export type Hosting = 'eu' | 'morocco' | 'us';
export type Role = 'executive' | 'analyst' | 'auditor';

export interface OrgContext {
  name: string;
  legalForm: string;
  country: 'MA';
  city: string;
  sector: 'saas' | 'it_services' | 'bpo' | 'fintech' | 'ecommerce' | 'consulting';
  employees: number;
  admins: number;
  contractors: number;
  sellsTo: { morocco: boolean; eu: boolean; africa: boolean };
  euCustomerCountries: CountryCode[];
  /** Sells services to companies established in the EU (B2B). */
  euBusinessCustomers: boolean;
  /** Offers goods/services directly to individuals in the EU, or monitors their behaviour. */
  euIndividualsTargeted: boolean;
  /** At least one customer is an EU financial entity (bank, insurer, investment firm...). */
  euFinancialCustomers: boolean;
  /** Processes personal data on behalf of EU customers. */
  euDataProcessed: boolean;
  /** Processes personal data of people in Morocco (customers, employees). */
  moroccanPersonalData: boolean;
  hosting: Hosting;
  /** Staff in Morocco can access customer data hosted elsewhere. */
  remoteAccessFromMorocco: boolean;
  publicEntity: boolean;
  vitalInfrastructure: boolean;
  dataTypes: { customerPersonal: boolean; employee: boolean; financial: boolean; health: boolean; credentials: boolean };
  tech: { aws: boolean; m365: boolean; googleWs: boolean; onPrem: boolean; vpn: boolean; remoteWork: boolean; apis: boolean };
}

export interface Evaluation {
  status: Applicability;
  reason: string;
  confidence: Confidence;
}

export interface LegalRequirement {
  id: string;
  jurisdiction: 'MA' | 'EU' | 'CROSS';
  instrument: string;
  /** Article or official reference. null when not verified against the official text. */
  reference: string | null;
  title: string;
  /** Plain-language summary written by us, not quoted from the source. */
  summary: string;
  kind: 'territorial' | 'obligation' | 'transfer' | 'contractual' | 'cybersecurity';
  /** Human-readable applicability condition shown next to the result. */
  condition: string;
  controls: string[];
  source: { name: string; url: string; status: SourceStatus; checkedOn: string; note?: string };
  professionalReview: boolean;
  evaluate: (c: OrgContext) => Evaluation;
}

export interface Expectation {
  id: string;
  label: string;
  /** design = documented intent (policy text). operation = proof it actually runs (records, logs, test results). */
  kind: 'design' | 'operation';
  patterns: RegExp[];
}

export type NistFunction = 'GV' | 'ID' | 'PR' | 'DE' | 'RS' | 'RC';

export interface Control {
  /** ISO/IEC 27001:2022 Annex A identifier. Titles are our own short paraphrases, not ISO text. */
  id: string;
  title: string;
  theme: 'Organizational' | 'People' | 'Technological';
  nist: { fn: NistFunction; category: string }[];
  owner: string;
  expectations: Expectation[];
}

export interface EvidenceRecord {
  controlId: string;
  status: EvidenceStatus;
  documents: string[];
  note: string;
  updatedAt: string;
  source: 'seed' | 'analysis';
}

export interface Risk {
  id: string;
  title: string;
  scenario: string;
  likelihood: number; // 1..5
  impact: number; // 1..5
  controls: string[];
  /** Optional key-control weights (default 1). E.g. MFA dominates the likelihood of account compromise. */
  weights?: Record<string, number>;
  owner: string;
  treatment: 'Reduce' | 'Transfer' | 'Accept' | 'Avoid';
}

export interface Action {
  id: string;
  title: string;
  detail: string;
  controls: string[];
  effort: 'S' | 'M' | 'L';
  cost: 'Low' | 'Medium' | 'High';
  owner: string;
  days: number;
}

export interface Question {
  id: string;
  topic: string;
  text: string;
  weight: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  controls: string[];
}
export type Answer = 'yes' | 'partial' | 'no';

export interface DataFlow {
  id: string;
  fromLabel: string;
  fromCountry: CountryCode;
  toLabel: string;
  data: string;
  purpose: string;
  party: string;
  role: 'processor' | 'subprocessor' | 'internal' | 'controller';
  /** 'platform' means: follow the company's hosting choice. */
  storage: CountryCode | 'platform';
  access: CountryCode;
  dataSubjects: 'EU' | 'MA' | 'MIXED';
}

export interface AuditEvent {
  at: string;
  actor: string;
  action: string;
}
