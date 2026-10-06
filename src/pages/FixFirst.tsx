import { Badge, Button, Meter, PageHeader, Panel, RiskBadge, Stat, addDays, fmtDate } from '../components/ui';
import { CONTROL_BY_ID } from '../data/controls';
import { LEGAL_REQUIREMENTS } from '../data/legal';
import { useStore } from '../store';

const EFFORT = { S: 'Days', M: 'Weeks', L: 'Months' } as const;
const reqTitle = (id: string) => LEGAL_REQUIREMENTS.find((r) => r.id === id)?.instrument.split(' (')[0] ?? id;

export function FixFirstPage({ go }: { go: (p: string) => void }) {
  const { ctx, risks, actions, score, readiness, requirements, evidence } = useStore();
  const top = risks[0];
  const open = actions.filter((a) => !a.done);
  const first = open.slice(0, 3);
  const later = open.slice(3);
  const highCount = risks.filter((r) => r.level === 'critical' || r.level === 'high').length;
  const why = [
    ...top.weakControls.map((id) => evidence[id]?.note).filter(Boolean).slice(0, 3),
    ctx.dataTypes.customerPersonal ? `Customer personal data from ${ctx.euCustomerCountries.map((c) => (c === 'FR' ? 'France' : c === 'DE' ? 'Germany' : 'Spain')).join(' and ')} and Morocco is processed.` : '',
    `${ctx.admins} administrators and ${ctx.contractors} contractors have access to production.`,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader step="Step 5 of 6" title="What should you fix first?" intro="Ranked by how much risk each action removes, how severe that risk is, its legal relevance, and the effort and cost it takes." />

      <section className="mb-6 rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">For the CEO, in one sentence</p>
        <p className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">Your largest exposure is {top.risk.title.charAt(0).toLowerCase() + top.risk.title.slice(1)}.</p>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_280px]">
          <div>
            <p className="text-sm font-medium">Why</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{why.map((w) => <li key={w}>{w}</li>)}</ul>
            <p className="mt-4 text-sm"><span className="font-medium">Recommended action:</span> {first[0]?.action.title}.</p>
          </div>
          <div className="rounded-lg bg-sunken p-4">
            <div className="flex items-center justify-between"><span className="text-sm">Residual risk</span><RiskBadge l={top.level} /></div>
            <p className="mt-2 text-3xl font-semibold tabular">{top.residual}<span className="text-base text-muted">/25</span></p>
            <p className="mt-1 text-xs text-muted">Likelihood {top.risk.likelihood}/5 × impact {top.risk.impact}/5 = {top.inherent}. Evidence-based control effectiveness {Math.round(top.effectiveness * 100)}%.</p>
            <div className="mt-3"><Meter value={top.residual} max={25} tone="bad" /></div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cybersecurity maturity" value={<>{score.score}<span className="text-base text-muted">/100</span></>} sub={`${score.bySeverity.critical + score.bySeverity.high} critical or high gaps`} />
        <Stat label="High or critical risks" value={highCount} tone="bad" sub={`of ${risks.length} in the register`} />
        <Stat label="ISO 27001 control readiness" value={`${readiness.pct}%`} sub={`${readiness.supported} supported, ${readiness.partial} partial`} />
        <Stat label="Requirements to review" value={requirements.filter((r) => r.status === 'review').length} tone="warn" sub="with a professional" />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Fix these 3 first</h2>
      <ol className="grid gap-4 lg:grid-cols-3">
        {first.map((p, i) => (
          <li key={p.action.id} className="flex flex-col rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white dark:text-[rgb(14_18_27)]">{i + 1}</span>
              <span className="text-sm text-muted">removes <b className="text-ink tabular">{p.riskReduction}</b> risk points</span>
            </div>
            <h3 className="mt-3 font-semibold leading-snug">{p.action.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.action.detail}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
              <dt className="text-muted">Effort</dt><dd>{EFFORT[p.action.effort]}</dd>
              <dt className="text-muted">Cost</dt><dd>{p.action.cost}</dd>
              <dt className="text-muted">Owner</dt><dd>{p.action.owner}</dd>
              <dt className="text-muted">Deadline</dt><dd className="tabular">{fmtDate(addDays(p.action.days))}</dd>
              <dt className="text-muted">Frameworks</dt><dd>{p.action.controls.map((c) => `ISO ${c}`).join(', ')}; NIST {[...new Set(p.action.controls.flatMap((c) => CONTROL_BY_ID[c].nist.map((n) => n.category)))].join(', ')}</dd>
            </dl>
            {p.regulatoryLinks.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-4">{[...new Set(p.regulatoryLinks.map(reqTitle))].map((t) => <Badge key={t} tone="accent">{t}</Badge>)}</div>
            )}
          </li>
        ))}
      </ol>

      <h2 className="mb-3 mt-10 text-lg font-semibold">30, 60 and 90-day plan</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {([30, 60, 90] as const).map((ph) => (
          <Panel key={ph} title={`Within ${ph} days`}>
            <ul className="space-y-3">
              {open.filter((p) => p.phase === ph).map((p) => (
                <li key={p.action.id} className="text-sm">
                  <p className="font-medium leading-snug">{p.action.title}{first.includes(p) && <Badge tone="accent" className="ml-2">Top 3</Badge>}</p>
                  <p className="text-xs text-muted">{p.action.owner}, due {fmtDate(addDays(p.action.days))}, -{p.riskReduction} risk points</p>
                </li>
              ))}
              {!open.filter((p) => p.phase === ph).length && <li className="text-sm text-muted">Nothing planned in this window.</li>}
            </ul>
          </Panel>
        ))}
      </div>
      {later.length === 0 && open.length === 0 && <p className="mt-4 text-sm text-muted">All actions are evidenced.</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => go('/passport')}>Generate the security passport</Button>
        <Button variant="secondary" onClick={() => go('/workspace')}>Open the risk register</Button>
      </div>
    </>
  );
}
