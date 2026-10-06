import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { LEGAL_REQUIREMENTS } from '../data/legal';
import { CONTROLS } from '../data/controls';
import { ACTIONS, ATLASTECH, QUESTIONS, RISKS, SEED_ANSWERS, SEED_EVIDENCE, SEED_FLOWS } from '../data/atlastech';
import { analyseFlow, assessRisk, cyberScore, evaluateRequirements, prioritizeActions, supplierRisk } from './core';
import { analyseEvidence, mergeStatus } from './evidence';
import type { EvidenceRecord, OrgContext } from './types';

const ev = (): Record<string, EvidenceRecord> => Object.fromEntries(SEED_EVIDENCE.map((e) => [e.controlId, { ...e }]));
const status = (ctx: OrgContext, id: string) => evaluateRequirements(LEGAL_REQUIREMENTS, ctx, ev()).find((r) => r.req.id === id)!.status;

async function pdfText(file: string): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync('samples/' + file)), isEvalSupported: false }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    out += c.items.map((it: { str?: string; hasEOL?: boolean }) => (it.str ?? '') + (it.hasEOL ? '\n' : ' ')).join('');
  }
  return out;
}

describe('legal knowledge base quality', () => {
  it('every requirement has provenance, a condition and mapped controls', () => {
    for (const r of LEGAL_REQUIREMENTS) {
      expect(r.source.url).toMatch(/^https:\/\//);
      expect(r.source.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.condition.length).toBeGreaterThan(10);
      expect(r.controls.length).toBeGreaterThan(0);
      r.controls.forEach((c) => expect(CONTROLS.find((x) => x.id === c), `${r.id} -> ${c}`).toBeTruthy());
    }
  });
  it('no Moroccan requirement claims an article number we have not verified', () => {
    LEGAL_REQUIREMENTS.filter((r) => r.jurisdiction === 'MA' || r.id.startsWith('MA-')).forEach((r) => expect(r.reference ?? '').not.toMatch(/Art\./));
  });
});

describe('applicability engine (AtlasTech)', () => {
  it('B2B processor: GDPR reaches AtlasTech via contracts and transfers, not Art. 3(2)', () => {
    expect(status(ATLASTECH, 'EU-GDPR-ART28')).toBe('applicable');
    expect(status(ATLASTECH, 'EU-GDPR-TRANSFER')).toBe('applicable'); // remote access from Morocco
    expect(status(ATLASTECH, 'EU-GDPR-ART3')).toBe('review');
    expect(status(ATLASTECH, 'EU-GDPR-ART27')).toBe('not_applicable');
  });
  it('an EU customer alone never makes everything apply', () => {
    expect(status(ATLASTECH, 'EU-NIS2-DIRECT')).toBe('not_applicable');
    expect(status(ATLASTECH, 'EU-DORA-ICT')).toBe('not_applicable');
    expect(status(ATLASTECH, 'MA-DNSSI')).toBe('not_applicable');
  });
  it('context changes the result', () => {
    expect(status({ ...ATLASTECH, euFinancialCustomers: true }, 'EU-DORA-ICT')).toBe('applicable');
    expect(status({ ...ATLASTECH, euIndividualsTargeted: true }, 'EU-GDPR-ART3')).toBe('applicable');
    expect(status({ ...ATLASTECH, euIndividualsTargeted: true }, 'EU-GDPR-ART27')).toBe('applicable');
    expect(status({ ...ATLASTECH, remoteAccessFromMorocco: false }, 'EU-GDPR-TRANSFER')).toBe('not_applicable');
    expect(status({ ...ATLASTECH, hosting: 'morocco' }, 'MA-0908-TRANSFER')).toBe('not_applicable');
    expect(status({ ...ATLASTECH, vitalInfrastructure: true }, 'MA-0520-OPERATOR')).toBe('applicable');
  });
  it('Law 05-20 is a review item for a SaaS, never a silent yes', () => {
    expect(status(ATLASTECH, 'MA-0520-OPERATOR')).toBe('review');
  });
});

describe('risk engine', () => {
  it('residual = inherent x (1 - mean effectiveness)', () => {
    const r = assessRisk(RISKS[0], ev());
    expect(r.inherent).toBe(20);
    expect(r.residual).toBe(20); // no evidence yet
    const e = ev();
    ['A.8.5', 'A.8.2', 'A.5.15', 'A.5.18'].forEach((id) => (e[id].status = 'partial'));
    expect(assessRisk(RISKS[0], e).residual).toBe(16);
  });
  it('top priority for AtlasTech is MFA', () => {
    const app = evaluateRequirements(LEGAL_REQUIREMENTS, ATLASTECH, ev());
    const p = prioritizeActions(ACTIONS, RISKS, ev(), app);
    expect(p[0].action.id).toBe('ACT-MFA');
    expect(p.slice(0, 3).map((x) => x.action.id)).toContain('ACT-REVIEW');
  });
  it('demo sequence: after the access policy is validated, MFA still ranks first and R01 drops', async () => {
    const res = analyseEvidence(await pdfText('Access_Control_Policy.pdf'), 'Access_Control_Policy.pdf', CONTROLS);
    const e = ev();
    res.findings.forEach((f) => (e[f.control.id] = { ...e[f.control.id], status: mergeStatus(e[f.control.id].status, f.status) }));
    const r01 = assessRisk(RISKS[0], e);
    expect(r01.residual).toBeLessThan(20);
    expect(r01.level).toBe('high');
    const p = prioritizeActions(ACTIONS, RISKS, e, evaluateRequirements(LEGAL_REQUIREMENTS, ATLASTECH, e));
    expect(p[0].action.id).toBe('ACT-MFA');
  });
  it('cyber score follows the published formula', () => {
    expect(cyberScore(QUESTIONS, SEED_ANSWERS).score).toBe(59);
    expect(cyberScore(QUESTIONS, Object.fromEntries(QUESTIONS.map((q) => [q.id, 'yes']))).score).toBe(100);
  });
});

describe('evidence analyser on real PDFs', () => {
  it('Access_Control_Policy.pdf = partially supported, MFA missing', async () => {
    const res = analyseEvidence(await pdfText('Access_Control_Policy.pdf'), 'Access_Control_Policy.pdf', CONTROLS);
    expect(res.verdict).toBe('partial');
    const ids = res.findings.map((f) => f.control.id);
    expect(ids).toEqual(expect.arrayContaining(['A.5.15', 'A.8.5', 'A.5.18']));
    const mfa = res.findings.find((f) => f.control.id === 'A.8.5')!;
    expect(mfa.status).toBe('partial');
    expect(mfa.missing.map((m) => m.id)).toContain('mfa');
    const rev = res.findings.find((f) => f.control.id === 'A.5.18')!;
    expect(rev.missing.map((m) => m.id)).toEqual(expect.arrayContaining(['freq', 'rec']));
    expect(res.injectionWarnings).toHaveLength(0);
  });
  it('a restore test report is operating evidence', async () => {
    const res = analyseEvidence(await pdfText('Backup_Restore_Test_Report.pdf'), 'b.pdf', CONTROLS);
    expect(res.findings.find((f) => f.control.id === 'A.8.13')?.status).toBe('supported');
  });
  it('prompt injection is flagged and earns no credit', async () => {
    const res = analyseEvidence(await pdfText('Supplier_Note_untrusted.pdf'), 's.pdf', CONTROLS);
    expect(res.injectionWarnings.length).toBeGreaterThanOrEqual(2);
    expect(res.verdict).toBe('irrelevant');
  });
  it('new evidence never silently downgrades a control', () => {
    expect(mergeStatus('supported', 'partial')).toBe('supported');
    expect(mergeStatus('not_demonstrated', 'partial')).toBe('partial');
  });
});

describe('data flows and supplier mode', () => {
  it('remote access from Morocco to EU-hosted data is flagged as a potential transfer', () => {
    const f2 = analyseFlow(SEED_FLOWS.find((f) => f.id === 'F2')!, ATLASTECH);
    expect(f2.findings.some((x) => x.level === 'transfer')).toBe(true);
    const f6 = analyseFlow(SEED_FLOWS.find((f) => f.id === 'F6')!, ATLASTECH);
    expect(f6.findings[0].level).toBe('none');
  });
  it('supplier with production access and gaps is HIGH', () => {
    expect(supplierRisk('personal', 'production', ev()).level).toBe('HIGH');
    const all = Object.fromEntries(SEED_EVIDENCE.map((e) => [e.controlId, { ...e, status: 'supported' as const }]));
    expect(supplierRisk('personal', 'production', all).level).toBe('LOW');
  });
});
