import type {
  Action, Answer, Applicability, CountryCode, DataFlow, EvidenceRecord, EvidenceStatus, LegalRequirement,
  OrgContext, Question, Risk,
} from './types';

// ---------------------------------------------------------------------------
// Applicability
// ---------------------------------------------------------------------------
export interface ApplicabilityResult {
  req: LegalRequirement;
  status: Applicability;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: EvidenceStatus;
}

export function evaluateRequirements(
  reqs: LegalRequirement[],
  ctx: OrgContext,
  evidence: Record<string, EvidenceRecord>,
): ApplicabilityResult[] {
  return reqs.map((req) => {
    const e = req.evaluate(ctx);
    return { req, ...e, evidence: requirementEvidence(req.controls, evidence) };
  });
}

/** supported = every linked control supported; partial = any linked control has some evidence; else not demonstrated. */
export function requirementEvidence(controlIds: string[], evidence: Record<string, EvidenceRecord>): EvidenceStatus {
  const st = controlIds.map((id) => evidence[id]?.status ?? 'not_demonstrated');
  if (st.length && st.every((s) => s === 'supported')) return 'supported';
  if (st.some((s) => s === 'supported' || s === 'partial')) return 'partial';
  return 'not_demonstrated';
}

// ---------------------------------------------------------------------------
// Risk (ISO 27005-style: identify, analyse, evaluate, treat)
// ---------------------------------------------------------------------------
// Control effectiveness is derived ONLY from evidence status, never from a self-declaration.
// Residual = inherent x (1 - weighted mean effectiveness of the risk's controls).
export const EFFECTIVENESS: Record<EvidenceStatus, number> = {
  supported: 0.6, // evidence that the control operates; residual risk never drops to zero
  partial: 0.2, // documented, implementation not demonstrated
  not_demonstrated: 0,
  irrelevant: 0,
};

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export const riskLevel = (score: number): RiskLevel =>
  score >= 20 ? 'critical' : score >= 15 ? 'high' : score >= 8 ? 'medium' : 'low';

export interface RiskResult {
  risk: Risk;
  inherent: number;
  effectiveness: number;
  residual: number;
  level: RiskLevel;
  weakControls: string[];
}

export function assessRisk(risk: Risk, evidence: Record<string, EvidenceRecord>): RiskResult {
  const inherent = risk.likelihood * risk.impact;
  const w = (id: string) => risk.weights?.[id] ?? 1;
  const totalW = risk.controls.reduce((s, id) => s + w(id), 0);
  const effectiveness = totalW
    ? risk.controls.reduce((s, id) => s + w(id) * EFFECTIVENESS[evidence[id]?.status ?? 'not_demonstrated'], 0) / totalW
    : 0;
  const residual = Math.round(inherent * (1 - effectiveness));
  const weakControls = risk.controls.filter((id) => (evidence[id]?.status ?? 'not_demonstrated') !== 'supported');
  return { risk, inherent, effectiveness, residual, level: riskLevel(residual), weakControls };
}

export const assessRisks = (risks: Risk[], evidence: Record<string, EvidenceRecord>) =>
  risks.map((r) => assessRisk(r, evidence)).sort((a, b) => b.residual - a.residual || b.inherent - a.inherent);

// ---------------------------------------------------------------------------
// "What should I fix first?"
// priority = sum(reduction on each risk x severity weight of that risk today)
//            x (1 + 0.15 x regulatory links) / (effort weight x cost weight)
// Severity weight makes reductions on critical risks count more than on low ones.
// ---------------------------------------------------------------------------
export const EFFORT_WEIGHT = { S: 1, M: 1.6, L: 2.5 } as const;
export const COST_WEIGHT = { Low: 1, Medium: 1.25, High: 1.5 } as const;
export const SEVERITY_WEIGHT: Record<RiskLevel, number> = { critical: 2, high: 1.5, medium: 1, low: 0.5 };

export interface PrioritizedAction {
  action: Action;
  riskReduction: number;
  regulatoryLinks: string[];
  frameworks: string[];
  score: number;
  phase: 30 | 60 | 90;
  done: boolean;
}

export function prioritizeActions(
  actions: Action[],
  risks: Risk[],
  evidence: Record<string, EvidenceRecord>,
  applicable: ApplicabilityResult[],
): PrioritizedAction[] {
  const now = risks.map((r) => assessRisk(r, evidence).residual);
  return actions
    .map((action) => {
      const improved: Record<string, EvidenceRecord> = { ...evidence };
      for (const id of action.controls) improved[id] = { ...(evidence[id] ?? blank(id)), status: 'supported' };
      const after = risks.map((r) => assessRisk(r, improved).residual);
      const riskReduction = now.reduce((sum, v, i) => sum + (v - after[i]), 0);
      const weighted = now.reduce((sum, v, i) => sum + (v - after[i]) * SEVERITY_WEIGHT[riskLevel(v)], 0);
      const regulatoryLinks = applicable
        .filter((a) => a.status !== 'not_applicable' && a.req.controls.some((c) => action.controls.includes(c)))
        .map((a) => a.req.id);
      const score = (weighted * (1 + 0.15 * regulatoryLinks.length)) / (EFFORT_WEIGHT[action.effort] * COST_WEIGHT[action.cost]);
      const done = action.controls.every((id) => evidence[id]?.status === 'supported');
      const phase: 30 | 60 | 90 = action.days <= 30 ? 30 : action.days <= 60 ? 60 : 90;
      const frameworks = ['ISO 27001 ' + action.controls.join(', ')];
      return { action, riskReduction, regulatoryLinks, frameworks, score: Math.round(score * 10) / 10, phase, done };
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || b.score - a.score);
}

const blank = (controlId: string): EvidenceRecord => ({
  controlId, status: 'not_demonstrated', documents: [], note: '', updatedAt: '', source: 'seed',
});

// ---------------------------------------------------------------------------
// Cybersecurity maturity score (0-100)
// score = sum(weight x value) / sum(weight) x 100, value: yes 1, partial 0.5, no 0
// ---------------------------------------------------------------------------
export const ANSWER_VALUE: Record<Answer, number> = { yes: 1, partial: 0.5, no: 0 };

export function cyberScore(questions: Question[], answers: Record<string, Answer>) {
  const total = questions.reduce((s, q) => s + q.weight, 0);
  const got = questions.reduce((s, q) => s + q.weight * ANSWER_VALUE[answers[q.id] ?? 'no'], 0);
  const gaps = questions
    .filter((q) => (answers[q.id] ?? 'no') !== 'yes')
    .map((q) => ({ question: q, answer: answers[q.id] ?? 'no', severity: answers[q.id] === 'partial' ? downgrade(q.severity) : q.severity }));
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  gaps.forEach((g) => bySeverity[g.severity]++);
  return { score: Math.round((got / total) * 100), gaps, bySeverity };
}
const downgrade = (s: Question['severity']): Question['severity'] =>
  s === 'critical' ? 'high' : s === 'high' ? 'medium' : 'low';

// ---------------------------------------------------------------------------
// ISO 27001 control readiness indicator
// readiness = (supported + 0.5 x partial) / in-scope controls
// ---------------------------------------------------------------------------
export function controlReadiness(controlIds: string[], evidence: Record<string, EvidenceRecord>) {
  const counts = { supported: 0, partial: 0, not_demonstrated: 0, irrelevant: 0 };
  controlIds.forEach((id) => counts[evidence[id]?.status ?? 'not_demonstrated']++);
  const inScope = controlIds.length - counts.irrelevant;
  const pct = inScope ? Math.round(((counts.supported + 0.5 * counts.partial) / inScope) * 100) : 0;
  return { ...counts, inScope, pct };
}

// ---------------------------------------------------------------------------
// Cross-border data flows
// ---------------------------------------------------------------------------
export const EU_EEA = new Set<CountryCode>(['EU', 'FR', 'DE', 'ES']);
/** EU adequacy (partial list relevant to this MVP). Morocco is NOT on it. */
export const EU_ADEQUATE = new Set<CountryCode>([...EU_EEA]);
export const hostingCountry = (c: OrgContext): CountryCode => (c.hosting === 'eu' ? 'EU' : c.hosting === 'morocco' ? 'MA' : 'US');

export interface FlowFinding {
  level: 'transfer' | 'check' | 'none';
  text: string;
  next: string;
}

export function analyseFlow(flow: DataFlow, ctx: OrgContext): { storage: CountryCode; findings: FlowFinding[] } {
  const storage = flow.storage === 'platform' ? hostingCountry(ctx) : flow.storage;
  const findings: FlowFinding[] = [];
  const euData = flow.dataSubjects === 'EU' || flow.dataSubjects === 'MIXED' || EU_EEA.has(flow.fromCountry);
  const maData = flow.dataSubjects === 'MA' || flow.dataSubjects === 'MIXED';

  for (const [where, label] of [[storage, 'stored'], [flow.access, 'accessed']] as const) {
    if (euData && where !== 'UNKNOWN' && !EU_ADEQUATE.has(where)) {
      findings.push({
        level: 'transfer',
        text: `Potential international data transfer detected: EU personal data ${label} in ${countryName(where)}, which has no EU adequacy decision.`,
        next: 'Review applicable transfer mechanism and contractual safeguards (e.g. SCCs and a transfer impact assessment).',
      });
    }
  }
  if (maData && storage !== 'MA' && storage !== 'UNKNOWN') {
    findings.push({
      level: 'check',
      text: `Moroccan personal data stored in ${countryName(storage)}.`,
      next: 'Review Law 09-08 transfer conditions and CNDP formalities for this destination.',
    });
  }
  if (storage === 'UNKNOWN' || flow.access === 'UNKNOWN') {
    findings.push({ level: 'check', text: 'Storage or access location is unknown.', next: 'Ask the provider where data is stored and accessed from.' });
  }
  if (flow.role === 'subprocessor') {
    findings.push({ level: 'check', text: 'Sub-processor involved.', next: 'Confirm your customers authorised this sub-processor and that obligations flow down by contract.' });
  }
  if (!findings.length) findings.push({ level: 'none', text: 'No cross-border consideration detected.', next: 'No action from this flow.' });
  return { storage, findings };
}

export const countryName = (c: CountryCode) =>
  ({ MA: 'Morocco', FR: 'France', DE: 'Germany', ES: 'Spain', EU: 'the EU', US: 'the United States', UNKNOWN: 'an unknown location' })[c];

// ---------------------------------------------------------------------------
// Supplier risk (EU buyer view)
// ---------------------------------------------------------------------------
export type SupplierData = 'none' | 'business' | 'personal' | 'sensitive';
export type SupplierAccess = 'none' | 'limited' | 'production' | 'admin';

export const KEY_SUPPLIER_CONTROLS: { id: string; reason: string; request: string }[] = [
  { id: 'A.8.5', reason: 'MFA evidence missing', request: 'Evidence that MFA is enforced for all accounts with access to our data (e.g. identity provider report)' },
  { id: 'A.5.18', reason: 'Access reviews not evidenced', request: 'Latest access review record for systems holding our data, with reviewer and date' },
  { id: 'A.5.24', reason: 'Incident response not tested', request: 'Incident response plan, notification timelines and the latest exercise record' },
  { id: 'A.5.26', reason: 'Incident response incomplete', request: 'Customer breach notification procedure with committed timelines' },
  { id: 'A.8.13', reason: 'Backup restore not proven', request: 'Backup policy and the latest restore test result' },
  { id: 'A.5.14', reason: 'Transfer documentation incomplete', request: 'Signed data processing agreement with SCCs and a transfer impact assessment' },
  { id: 'A.5.19', reason: 'Own supplier security not assessed', request: 'List of sub-processors and how they are assessed' },
];

export function supplierRisk(
  data: SupplierData,
  access: SupplierAccess,
  evidence: Record<string, EvidenceRecord>,
) {
  const dataScore = { none: 0, business: 1, personal: 2, sensitive: 3 }[data];
  const accessScore = { none: 0, limited: 1, production: 2, admin: 3 }[access];
  const exposure = dataScore + accessScore; // 0..6
  const gaps = KEY_SUPPLIER_CONTROLS.filter((k) => (evidence[k.id]?.status ?? 'not_demonstrated') !== 'supported');
  const gapWeight = gaps.length / KEY_SUPPLIER_CONTROLS.length; // 0..1
  const level: 'HIGH' | 'MEDIUM' | 'LOW' =
    exposure >= 4 && gapWeight >= 0.3 ? 'HIGH' : exposure >= 2 && gapWeight >= 0.15 ? 'MEDIUM' : 'LOW';
  return { exposure, gaps, level };
}

// ---------------------------------------------------------------------------
// Passport snapshot integrity
// ---------------------------------------------------------------------------
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
