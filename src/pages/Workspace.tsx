import { useState } from 'react';
import { AppBadge, Badge, EvBadge, Meter, PageHeader, Panel, RiskBadge, Segmented, cx } from '../components/ui';
import { QUESTIONS } from '../data/atlastech';
import { CONTROLS } from '../data/controls';
import { EFFECTIVENESS } from '../engine/core';
import type { Answer, NistFunction } from '../engine/types';
import { useStore } from '../store';

type Tab = 'risks' | 'controls' | 'applicability' | 'nist' | 'assessment' | 'audit';
const NIST: Record<NistFunction, string> = { GV: 'Govern', ID: 'Identify', PR: 'Protect', DE: 'Detect', RS: 'Respond', RC: 'Recover' };

export function WorkspacePage() {
  const [tab, setTab] = useState<Tab>('risks');
  return (
    <>
      <PageHeader title="GRC workspace" intro="The detailed view for analysts and auditors. Every number on the executive pages can be traced here." />
      <div className="mb-5 scroll-x"><Segmented<Tab> value={tab} onChange={setTab} options={[
        { v: 'risks', label: 'Risk register' }, { v: 'controls', label: 'Controls and evidence' }, { v: 'applicability', label: 'Applicability' },
        { v: 'nist', label: 'NIST CSF 2.0' }, { v: 'assessment', label: 'Assessment' }, { v: 'audit', label: 'Audit trail' }]} /></div>
      {tab === 'risks' && <Risks />}{tab === 'controls' && <Controls />}{tab === 'applicability' && <Applicability />}
      {tab === 'nist' && <Nist />}{tab === 'assessment' && <Assessment />}{tab === 'audit' && <Audit />}
    </>
  );
}

const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => <th className={cx('whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted', className)}>{children}</th>;
const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => <td className={cx('px-3 py-2.5 align-top', className)}>{children}</td>;
const Table = ({ head, children }: { head: React.ReactNode; children: React.ReactNode }) => (
  <div className="scroll-x rounded-xl border border-line bg-surface"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-line bg-sunken/60"><tr>{head}</tr></thead><tbody className="divide-y divide-line">{children}</tbody></table></div>
);

function Risks() {
  const { risks } = useStore();
  return (
    <>
      <Table head={<><Th>ID</Th><Th>Risk</Th><Th>L</Th><Th>I</Th><Th>Inherent</Th><Th>Control effectiveness</Th><Th>Residual</Th><Th>Treatment</Th><Th>Owner</Th><Th>Controls</Th></>}>
        {risks.map((r) => (
          <tr key={r.risk.id}>
            <Td className="tabular text-muted">{r.risk.id}</Td>
            <Td><p className="font-medium">{r.risk.title}</p><p className="mt-0.5 max-w-sm text-xs text-muted">{r.risk.scenario}</p></Td>
            <Td className="tabular">{r.risk.likelihood}</Td><Td className="tabular">{r.risk.impact}</Td><Td className="tabular">{r.inherent}</Td>
            <Td className="w-36"><span className="tabular">{Math.round(r.effectiveness * 100)}%</span><div className="mt-1"><Meter value={r.effectiveness * 100} tone="ok" /></div></Td>
            <Td><span className="mr-2 tabular font-semibold">{r.residual}</span><RiskBadge l={r.level} /></Td>
            <Td>{r.risk.treatment}</Td><Td className="whitespace-nowrap">{r.risk.owner}</Td>
            <Td className="text-xs tabular">{r.risk.controls.join(', ')}</Td>
          </tr>
        ))}
      </Table>
      <p className="mt-3 text-xs text-muted">ISO 27005 approach. Inherent = likelihood × impact (1-5 each). Effectiveness per control comes only from evidence: supported {EFFECTIVENESS.supported * 100}%, partial {EFFECTIVENESS.partial * 100}%, not demonstrated 0%. Residual = inherent × (1 − mean effectiveness). Levels: critical ≥ 20, high ≥ 15, medium ≥ 8.</p>
    </>
  );
}

function Controls() {
  const { evidence } = useStore();
  return (
    <Table head={<><Th>ISO 27001:2022</Th><Th>Control (our summary)</Th><Th>NIST CSF 2.0</Th><Th>Owner</Th><Th>Status</Th><Th>Evidence</Th><Th>Note</Th></>}>
      {CONTROLS.map((c) => {
        const e = evidence[c.id];
        return (
          <tr key={c.id}>
            <Td className="font-medium tabular">{c.id}</Td><Td>{c.title}</Td><Td className="text-xs">{c.nist.map((n) => n.category).join(', ')}</Td>
            <Td className="whitespace-nowrap">{c.owner}</Td><Td><EvBadge s={e?.status ?? 'not_demonstrated'} /></Td>
            <Td className="text-xs">{e?.documents.join(', ') || <span className="text-muted">None</span>}</Td>
            <Td className="max-w-xs text-xs text-muted">{e?.note}{e?.source === 'analysis' && <Badge tone="accent" className="ml-1">validated analysis</Badge>}</Td>
          </tr>
        );
      })}
    </Table>
  );
}

function Applicability() {
  const { requirements } = useStore();
  return (
    <Table head={<><Th>Jurisdiction</Th><Th>Requirement</Th><Th>Reference</Th><Th>Condition</Th><Th>Result</Th><Th>Confidence</Th><Th>Evidence</Th><Th>Source</Th></>}>
      {requirements.map((r) => (
        <tr key={r.req.id}>
          <Td>{r.req.jurisdiction === 'CROSS' ? 'Cross-border' : r.req.jurisdiction}</Td>
          <Td><p className="font-medium">{r.req.title}</p><p className="text-xs text-muted">{r.req.instrument}</p></Td>
          <Td className="text-xs">{r.req.reference ?? <span className="text-muted">To verify</span>}</Td>
          <Td className="max-w-[220px] text-xs">{r.req.condition}</Td><Td><AppBadge s={r.status} /></Td><Td>{r.confidence}</Td>
          <Td>{r.status !== 'not_applicable' && <EvBadge s={r.evidence} short />}</Td>
          <Td className="text-xs"><a href={r.req.source.url} target="_blank" rel="noopener noreferrer nofollow">{r.req.source.status}</a><br /><span className="text-muted">{r.req.source.checkedOn}</span></Td>
        </tr>
      ))}
    </Table>
  );
}

function Nist() {
  const { evidence } = useStore();
  const val = { supported: 1, partial: 0.5, not_demonstrated: 0, irrelevant: 0 };
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(NIST) as NistFunction[]).map((fn) => {
        const cs = CONTROLS.filter((c) => c.nist.some((n) => n.fn === fn));
        const pct = cs.length ? Math.round((cs.reduce((s, c) => s + val[evidence[c.id]?.status ?? 'not_demonstrated'], 0) / cs.length) * 100) : 0;
        return (
          <Panel key={fn} title={<span>{NIST[fn]} <span className="text-muted">({fn})</span></span>} action={<span className="text-sm font-semibold tabular">{pct}%</span>}>
            <Meter value={pct} tone={pct >= 60 ? 'ok' : pct >= 35 ? 'warn' : 'bad'} />
            <ul className="mt-4 space-y-1.5 text-sm">{cs.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2"><span><span className="tabular text-muted">{c.id}</span> {c.title}</span><EvBadge s={evidence[c.id]?.status ?? 'not_demonstrated'} short /></li>
            ))}</ul>
          </Panel>
        );
      })}
    </div>
  );
}

function Assessment() {
  const { answers, setAnswer, score, canEdit } = useStore();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Panel title="Cybersecurity assessment" pad={false}>
        <ul className="divide-y divide-line">{QUESTIONS.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="max-w-xl"><p className="text-sm font-medium">{q.topic} <span className="text-xs font-normal text-muted">weight {q.weight}, {q.severity}</span></p><p className="text-sm text-muted">{q.text}</p></div>
            <Segmented<Answer> disabled={!canEdit} value={answers[q.id] ?? 'no'} onChange={(a) => setAnswer(q.id, a)} options={[{ v: 'yes', label: 'Yes' }, { v: 'partial', label: 'Partly' }, { v: 'no', label: 'No' }]} />
          </li>
        ))}</ul>
      </Panel>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel title="Score">
          <p className="text-4xl font-semibold tabular">{score.score}<span className="text-lg text-muted">/100</span></p>
          <div className="mt-3"><Meter value={score.score} /></div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {(['critical', 'high', 'medium', 'low'] as const).map((s) => <div key={s} className="rounded-lg bg-sunken px-3 py-2"><dt className="text-xs capitalize text-muted">{s} gaps</dt><dd className="font-semibold tabular">{score.bySeverity[s]}</dd></div>)}
          </dl>
        </Panel>
        <p className="text-xs leading-relaxed text-muted">Score = Σ(weight × answer) / Σ(weight) × 100, with yes = 1, partly = 0.5, no = 0. A "partly" answer lowers the gap's severity by one level. Weights favour controls that stop the most common SME attacks (account takeover, ransomware).</p>
      </aside>
    </div>
  );
}

function Audit() {
  const { audit } = useStore();
  return (
    <Table head={<><Th>When (UTC)</Th><Th>Who</Th><Th>What</Th></>}>
      {audit.map((a, i) => <tr key={i}><Td className="whitespace-nowrap tabular text-xs">{a.at.replace('T', ' ').slice(0, 16)}</Td><Td className="whitespace-nowrap">{a.actor}</Td><Td>{a.action}</Td></tr>)}
    </Table>
  );
}

