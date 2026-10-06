import { useState } from 'react';
import { AppBadge, Badge, Button, EvBadge, Flag, Notice, PageHeader, RiskBadge, SOURCE, Segmented, cx } from '../components/ui';
import { CONTROL_BY_ID } from '../data/controls';
import type { ApplicabilityResult } from '../engine/core';
import type { Applicability } from '../engine/types';
import { useStore } from '../store';

type Filter = 'relevant' | Applicability | 'all';

export function RequirementsPage({ go }: { go: (p: string) => void }) {
  const { requirements } = useStore();
  const [filter, setFilter] = useState<Filter>('relevant');
  const [open, setOpen] = useState<string | null>('EU-GDPR-TRANSFER');
  const keep = (r: ApplicabilityResult) => filter === 'all' || (filter === 'relevant' ? r.status !== 'not_applicable' : r.status === filter);
  const cols = [
    { key: 'MA', title: 'Morocco', flag: <Flag c="MA" />, items: requirements.filter((r) => r.req.jurisdiction === 'MA') },
    { key: 'EU', title: 'European Union', flag: <Flag c="EU" />, items: requirements.filter((r) => r.req.jurisdiction === 'EU') },
    { key: 'CROSS', title: 'Cross-border data', flag: <span className="flex items-center gap-1"><Flag c="EU" size={14} /><Flag c="MA" size={14} /></span>, items: requirements.filter((r) => r.req.jurisdiction === 'CROSS') },
  ];

  return (
    <>
      <PageHeader step="Step 2 of 6" title="What may apply to you, and why"
        intro="Each result comes from an explicit rule applied to your answers. Having an EU customer never switches everything on: territorial scope, contracts and data transfers are assessed separately."
        right={<Segmented<Filter> value={filter} onChange={setFilter} options={[{ v: 'relevant', label: 'Relevant' }, { v: 'review', label: 'To review' }, { v: 'all', label: 'All' }]} />} />

      <Notice tone="accent" className="mb-6">
        "Potentially applicable" means the condition shown is met by your answers. It is a readiness indication, not a legal opinion.
        Items marked for professional review should be confirmed by a qualified lawyer or DPO.
      </Notice>

      <div className="grid gap-6 xl:grid-cols-3">
        {cols.map((c) => (
          <section key={c.key}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">{c.flag}{c.title}
              <span className="ml-auto text-xs font-normal text-muted">{c.items.filter((r) => r.status !== 'not_applicable').length} of {c.items.length} relevant</span>
            </h2>
            <div className="space-y-3">
              {c.items.filter(keep).map((r) => <ReqCard key={r.req.id} r={r} open={open === r.req.id} toggle={() => setOpen(open === r.req.id ? null : r.req.id)} />)}
              {!c.items.filter(keep).length && <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Nothing in this filter. Switch to "All" to see every rule we checked.</p>}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => go('/flows')}>See your data flows</Button>
        <Button variant="secondary" onClick={() => go('/evidence')}>Add evidence</Button>
      </div>
    </>
  );
}

function ReqCard({ r, open, toggle }: { r: ApplicabilityResult; open: boolean; toggle: () => void }) {
  const { evidence, risks, actions } = useStore();
  const src = SOURCE[r.req.source.status];
  const linkedRisks = risks.filter((x) => x.risk.controls.some((c) => r.req.controls.includes(c))).slice(0, 3);
  const linkedActions = actions.filter((a) => !a.done && a.action.controls.some((c) => r.req.controls.includes(c))).slice(0, 2);
  const na = r.status === 'not_applicable';
  return (
    <article className={cx('rounded-xl border bg-surface transition', open ? 'border-accent/50 shadow-sm' : 'border-line', na && 'opacity-75')}>
      <button onClick={toggle} className="w-full p-4 text-left" aria-expanded={open}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium leading-snug">{r.req.title}</p>
            <p className="mt-0.5 text-xs text-muted">{r.req.instrument}{r.req.reference ? `, ${r.req.reference}` : ''}</p>
          </div>
          <AppBadge s={r.status} />
        </div>
        <p className="mt-3 text-sm leading-relaxed">{r.reason}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!na && <EvBadge s={r.evidence} />}
          {r.req.professionalReview && !na && <Badge tone="warn">Professional review</Badge>}
          <span className="text-xs text-muted">Confidence: {r.confidence}</span>
        </div>
      </button>
      {open && (
        <div className="space-y-4 border-t border-line p-4 text-sm">
          <p className="leading-relaxed text-muted">{r.req.summary}</p>
          <div className="rounded-lg bg-sunken p-3">
            <p className="text-xs text-muted">Applicability condition</p>
            <p className="mt-0.5 font-medium">{r.req.condition}</p>
          </div>
          {!na && (
            <div>
              <p className="mb-2 text-xs text-muted">Evidence chain: requirement, control, evidence, risk, action</p>
              <ol className="relative space-y-2 border-l-2 border-line pl-4">
                {r.req.controls.map((id) => (
                  <li key={id} className="flex flex-wrap items-center gap-2">
                    <span className="text-muted">Control</span><span className="font-medium tabular">{id}</span><span>{CONTROL_BY_ID[id]?.title}</span>
                    <EvBadge s={evidence[id]?.status ?? 'not_demonstrated'} short />
                    {evidence[id]?.documents.length ? <span className="text-xs text-muted">{evidence[id].documents.join(', ')}</span> : null}
                  </li>
                ))}
                {linkedRisks.map((x) => (
                  <li key={x.risk.id} className="flex flex-wrap items-center gap-2"><span className="text-muted">Risk</span><span>{x.risk.title}</span><RiskBadge l={x.level} /><span className="text-xs tabular text-muted">{x.residual}/25</span></li>
                ))}
                {linkedActions.map((a) => (
                  <li key={a.action.id} className="flex flex-wrap items-center gap-2"><span className="text-muted">Action</span><span className="font-medium">{a.action.title}</span></li>
                ))}
              </ol>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs">
            <Badge tone={src.tone}>{src.label}</Badge>
            <span className="text-muted">Checked {r.req.source.checkedOn}</span>
            <a href={r.req.source.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{r.req.source.name}</a>
            {r.req.source.note && <p className="w-full text-muted">{r.req.source.note}</p>}
          </div>
        </div>
      )}
    </article>
  );
}
