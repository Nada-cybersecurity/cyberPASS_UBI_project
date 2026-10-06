import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ACTIONS, ATLASTECH, QUESTIONS, RISKS, SEED_ANSWERS, SEED_AUDIT, SEED_EVIDENCE, SEED_FLOWS } from './data/atlastech';
import { CONTROLS } from './data/controls';
import { LEGAL_REQUIREMENTS } from './data/legal';
import { assessRisks, controlReadiness, cyberScore, evaluateRequirements, prioritizeActions } from './engine/core';
import { mergeStatus, type AnalysisResult } from './engine/evidence';
import type { Answer, AuditEvent, DataFlow, EvidenceRecord, OrgContext, Role } from './engine/types';

export const ROLE_LABEL: Record<Role, string> = { analyst: 'GRC analyst', executive: 'Executive', auditor: 'Auditor' };
const ACTOR: Record<Role, string> = { analyst: 'Youssef (GRC analyst)', executive: 'Karim (Executive)', auditor: 'External auditor' };
const KEY = 'afrieu-cyberpass-demo-v1';

export interface DocRecord { name: string; verdict: string; controls: string[]; at: string }
interface State {
  ctx: OrgContext;
  evidence: Record<string, EvidenceRecord>;
  answers: Record<string, Answer>;
  flows: DataFlow[];
  role: Role;
  audit: AuditEvent[];
  docs: DocRecord[];
}

const initial = (): State => ({
  ctx: ATLASTECH,
  evidence: Object.fromEntries(SEED_EVIDENCE.map((e) => [e.controlId, e])),
  answers: SEED_ANSWERS,
  flows: SEED_FLOWS,
  role: 'analyst',
  audit: SEED_AUDIT,
  docs: [],
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch { /* storage unavailable: run in memory */ }
  return initial();
}

export interface RiskChange { id: string; title: string; before: number; after: number }

function useStoreValue() {
  const [s, setS] = useState<State>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s]);

  const canEdit = s.role === 'analyst';
  const log = (st: State, action: string): AuditEvent[] => [{ at: new Date().toISOString(), actor: ACTOR[st.role], action }, ...st.audit].slice(0, 200);

  const setCtx = useCallback((patch: Partial<OrgContext>, label?: string) =>
    setS((st) => ({ ...st, ctx: { ...st.ctx, ...patch }, audit: label ? log(st, label) : st.audit })), []);
  const setAnswer = useCallback((id: string, a: Answer) =>
    setS((st) => ({ ...st, answers: { ...st.answers, [id]: a }, audit: log(st, `Changed assessment answer ${id} to ${a}`) })), []);
  const setRole = useCallback((role: Role) => setS((st) => ({ ...st, role })), []);
  const addFlow = useCallback((f: DataFlow) =>
    setS((st) => ({ ...st, flows: [...st.flows, f], audit: log(st, `Added data flow ${f.fromLabel} to ${f.toLabel}`) })), []);
  const removeFlow = useCallback((id: string) =>
    setS((st) => ({ ...st, flows: st.flows.filter((f) => f.id !== id), audit: log(st, `Removed data flow ${id}`) })), []);
  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setS(initial());
  }, []);

  /** Human validation step: a reviewer applies analyser findings to the control register. */
  const applyAnalysis = (res: AnalysisResult): RiskChange[] => {
    const before = assessRisks(RISKS, s.evidence);
    const evidence = { ...s.evidence };
    const today = new Date().toISOString().slice(0, 10);
    for (const f of res.findings) {
      const cur = evidence[f.control.id];
      const status = mergeStatus(cur?.status ?? 'not_demonstrated', f.status);
      const missing = f.missing.map((m) => m.label).join(', ');
      evidence[f.control.id] = {
        controlId: f.control.id,
        status,
        documents: Array.from(new Set([...(cur?.documents ?? []), res.fileName])),
        note: missing ? `From ${res.fileName}. Still missing: ${missing}.` : `From ${res.fileName}.`,
        updatedAt: today,
        source: 'analysis',
      };
    }
    const after = assessRisks(RISKS, evidence);
    const changes = before
      .map((b) => ({ id: b.risk.id, title: b.risk.title, before: b.residual, after: after.find((a) => a.risk.id === b.risk.id)!.residual }))
      .filter((c) => c.after !== c.before);
    setS((st) => ({
      ...st,
      evidence,
      docs: [{ name: res.fileName, verdict: res.verdict, controls: res.findings.map((f) => f.control.id), at: new Date().toISOString() }, ...st.docs.filter((d) => d.name !== res.fileName)],
      audit: log(st, `Validated analysis of ${res.fileName} (${res.findings.map((f) => `${f.control.id} ${f.status}`).join('; ') || 'no mapped control'})`),
    }));
    return changes;
  };

  const derived = useMemo(() => {
    const requirements = evaluateRequirements(LEGAL_REQUIREMENTS, s.ctx, s.evidence);
    const risks = assessRisks(RISKS, s.evidence);
    const actions = prioritizeActions(ACTIONS, RISKS, s.evidence, requirements);
    const score = cyberScore(QUESTIONS, s.answers);
    const readiness = controlReadiness(CONTROLS.map((c) => c.id), s.evidence);
    return { requirements, risks, actions, score, readiness };
  }, [s.ctx, s.evidence, s.answers]);

  return { ...s, ...derived, canEdit, setCtx, setAnswer, setRole, addFlow, removeFlow, reset, applyAnalysis };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

// ---------------- hash router ----------------
export function useRoute(): [string, (to: string) => void] {
  const read = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => { setPath(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [path, (to: string) => { window.location.hash = to; }];
}
