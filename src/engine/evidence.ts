import type { Confidence, Control, EvidenceStatus } from './types';

// Evidence analysis, MVP version: deterministic clause matching.
// Why not an LLM by default: the result must be explainable, reproducible, cheap and immune to
// instructions hidden inside documents. An LLM provider can be plugged in later behind the same
// interface (see docs/ARCHITECTURE.md); its output would still go through human validation.
//
// Core principle: a policy proves DESIGN, not OPERATION. A document that only describes rules
// can at best be "partially supported".

export interface ControlFinding {
  control: Control;
  status: EvidenceStatus;
  matched: { id: string; label: string; kind: 'design' | 'operation'; excerpt: string }[];
  missing: { id: string; label: string; kind: 'design' | 'operation' }[];
  confidence: Confidence;
}

export interface AnalysisResult {
  fileName: string;
  characters: number;
  verdict: EvidenceStatus;
  findings: ControlFinding[]; // controls with enough signal to propose a status
  weakSignals: { control: Control; label: string }[]; // one element only, not enough to rely on
  injectionWarnings: string[];
  summary: string;
}

const MIN_MATCHES = 2;

const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) (instructions|rules)/i,
  /disregard (the )?(previous|above|system)/i,
  /you are now /i,
  /system prompt/i,
  /mark (this|all|every) (document|control|controls|requirement)s? as (compliant|supported|passed)/i,
  /\bact as\b.{0,30}\b(auditor|assistant|admin)/i,
];

/** Quote the shortest sentence containing the match, clipped around it, so excerpts read cleanly. */
function excerpt(parts: string[], re: RegExp): string {
  const best = parts.filter((s) => re.test(s)).sort((a, b) => a.length - b.length)[0] ?? '';
  if (best.length <= 170) return best;
  const m = re.exec(best);
  const i = m ? m.index : 0;
  const start = Math.max(0, i - 70);
  const end = Math.min(best.length, i + (m ? m[0].length : 0) + 80);
  return (start > 0 ? '... ' : '') + best.slice(start, end).trim() + (end < best.length ? ' ...' : '');
}

/** PDF text wraps mid-sentence, so matching runs on whitespace-collapsed text, split into sentences. */
export function normalise(text: string): string {
  return text.replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim();
}
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/);

export function analyseEvidence(rawText: string, fileName: string, controls: Control[]): AnalysisResult {
  const text = normalise(rawText);
  const parts = sentences(text);
  const isInjection = (s: string) => INJECTION_PATTERNS.some((p) => p.test(s));
  const injectionWarnings = parts.filter(isInjection).map((l) => l.trim().slice(0, 160));
  // Instruction-like sentences are excluded from matching: they are data, never instructions, and must not earn credit.
  const kept = parts.filter((s) => !isInjection(s));
  const clean = kept.join(' ');

  const findings: ControlFinding[] = [];
  const weakSignals: AnalysisResult['weakSignals'] = [];

  for (const control of controls) {
    const matched: ControlFinding['matched'] = [];
    const missing: ControlFinding['missing'] = [];
    for (const exp of control.expectations) {
      const hit = exp.patterns.find((p) => p.test(clean));
      if (hit) matched.push({ id: exp.id, label: exp.label, kind: exp.kind, excerpt: excerpt(kept, hit) });
      else missing.push({ id: exp.id, label: exp.label, kind: exp.kind });
    }
    if (matched.length >= MIN_MATCHES) {
      const designTotal = control.expectations.filter((e) => e.kind === 'design').length;
      const designHit = matched.filter((m) => m.kind === 'design').length;
      const opHit = matched.filter((m) => m.kind === 'operation').length;
      const status: EvidenceStatus = opHit > 0 && designHit / designTotal >= 0.5 ? 'supported' : 'partial';
      const ratio = matched.length / control.expectations.length;
      const confidence: Confidence = matched.length >= 3 && ratio >= 0.6 && clean.length > 800 ? 'high' : ratio >= 0.4 ? 'medium' : 'low';
      findings.push({ control, status, matched, missing, confidence });
    } else if (matched.length === 1) {
      weakSignals.push({ control, label: matched[0].label });
    }
  }

  findings.sort((a, b) => b.matched.length - a.matched.length);
  const verdict: EvidenceStatus = !findings.length
    ? 'irrelevant'
    : findings.some((f) => f.status === 'supported')
      ? 'supported'
      : 'partial';

  const summary = !findings.length
    ? 'This document does not demonstrate any mapped control.'
    : verdict === 'supported'
      ? `Contains operating evidence for ${findings.filter((f) => f.status === 'supported').map((f) => f.control.id).join(', ')}.`
      : `Describes rules for ${findings.map((f) => f.control.id).join(', ')}, but does not prove they are applied.`;

  return { fileName, characters: clean.length, verdict, findings, weakSignals, injectionWarnings, summary };
}

export const STATUS_RANK: Record<EvidenceStatus, number> = { irrelevant: 0, not_demonstrated: 1, partial: 2, supported: 3 };
/** New evidence can raise a control's status, never silently lower it. */
export const mergeStatus = (current: EvidenceStatus, proposed: EvidenceStatus): EvidenceStatus =>
  STATUS_RANK[proposed] > STATUS_RANK[current] ? proposed : current;
