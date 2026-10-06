import { useEffect, useMemo, useState } from 'react';
import { BRAND } from '../brand';
import { AppBadge, Button, EvBadge, Flag, Logo, Meter, RiskBadge, addDays, fmtDate, Notice } from '../components/ui';
import { CONTROLS } from '../data/controls';
import { LEGAL_DISCLAIMER } from '../data/legal';
import { analyseFlow, sha256Hex } from '../engine/core';
import { useStore } from '../store';

const mrz = (s: string, n = 44) => (s.toUpperCase().replace(/[^A-Z0-9<]/g, '<') + '<'.repeat(n)).slice(0, n);

export function PassportPage({ go }: { go: (p: string) => void }) {
  const st = useStore();
  const { ctx, score, readiness, requirements, risks, actions, evidence, flows, answers } = st;
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);
  const today = new Date();

  const snapshot = useMemo(() => JSON.stringify({ ctx, evidence: Object.values(evidence).map((e) => [e.controlId, e.status, e.documents]), answers, flows: flows.map((f) => f.id) }), [ctx, evidence, answers, flows]);
  useEffect(() => { sha256Hex(snapshot).then(setHash).catch(() => setHash('')); }, [snapshot]);

  const relevant = requirements.filter((r) => r.status !== 'not_applicable');
  const applicable = requirements.filter((r) => r.status === 'applicable');
  const fully = applicable.filter((r) => r.evidence === 'supported');
  const partly = applicable.filter((r) => r.evidence === 'partial');
  const evidencePct = applicable.length ? ((fully.length + 0.5 * partly.length) / applicable.length) * 100 : 0;
  const review = requirements.filter((r) => r.status === 'review');
  const highRisks = risks.filter((r) => r.level === 'critical' || r.level === 'high');
  const openTop = actions.filter((a) => !a.done).slice(0, 3);
  const transfers = flows.map((f) => ({ f, a: analyseFlow(f, ctx) })).filter(({ a }) => a.findings.some((x) => x.level === 'transfer'));
  const docs = [...new Set(Object.values(evidence).flatMap((e) => e.documents))];
  const id = hash ? `ACP-${hash.slice(0, 4)}-${hash.slice(4, 8)}`.toUpperCase() : 'ACP-....-....';
  const yymmdd = today.toISOString().slice(2, 10).replace(/-/g, '');

  const summary = `${BRAND.name} EU Customer Security Passport\n${ctx.name} (${ctx.city}, Morocco), snapshot ${fmtDate(today)}, ref ${id}\n` +
    `Cybersecurity maturity ${score.score}/100. ISO 27001 control readiness ${readiness.pct}% (${readiness.supported} supported, ${readiness.partial} partial, ${readiness.not_demonstrated} not demonstrated).\n` +
    `Requirements that may apply: ${applicable.length} (${fully.length} fully and ${partly.length} partially evidenced); ${review.length} more to confirm with a professional.\n` +
    `Open high or critical risks: ${highRisks.length}. Priority actions: ${openTop.map((a) => a.action.title).join('; ')}.\n` +
    `Self-assessment based on information and evidence provided. Not a certification or legal opinion.`;

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-muted">Step 6 of 6</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">EU Customer Security Passport</h1>
          <p className="mt-2 max-w-2xl text-muted">A one-page security profile for European customers. It shows strengths and open gaps honestly, because a buyer trusts a supplier who knows its gaps.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(summary).then(() => setCopied(true), () => setCopied(false)); }}>{copied ? 'Summary copied' : 'Copy summary'}</Button>
          <Button variant="secondary" onClick={() => go('/supplier')}>View as EU buyer</Button>
          <Button onClick={() => window.print()}>Save as PDF</Button>
        </div>
      </div>

      <article className="print-area passport-bg relative overflow-hidden rounded-2xl border border-line shadow-[0_24px_70px_-40px_rgb(var(--accent)/.5)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-accent px-6 py-4 text-white dark:text-[rgb(14_18_27)] sm:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white p-1"><Logo size={26} /></span>
            <div><p className="text-xs opacity-80">{BRAND.name}</p><p className="text-lg font-semibold leading-tight">EU Customer Security Passport</p></div>
          </div>
          <div className="text-right text-xs"><p className="opacity-80">Passport reference</p><p className="font-mrz text-sm tracking-wider">{id}</p></div>
        </header>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Holder data */}
          <section className="relative">
            <div className="flex gap-5">
              <div className="flex h-28 w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-sunken">
                <span className="text-3xl font-semibold tracking-tight text-accent">{ctx.name.slice(0, 2).toUpperCase()}</span>
                <Flag c="MA" size={12} />
              </div>
              <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <F l="Company">{ctx.name}</F><F l="Legal form">{ctx.legalForm}</F>
                <F l="Country"><span className="inline-flex items-center gap-1.5"><Flag c="MA" size={11} />Morocco</span></F><F l="City">{ctx.city}</F>
                <F l="Sector">{ctx.sector === 'saas' ? 'Software / SaaS' : ctx.sector}</F><F l="People">{ctx.employees} staff, {ctx.contractors} contractors</F>
              </dl>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
              <F l="Serves"><span className="inline-flex items-center gap-1.5">{ctx.sellsTo.morocco && <Flag c="MA" size={11} />}{ctx.euCustomerCountries.map((c) => <Flag key={c} c={c} size={11} />)}</span></F>
              <F l="Hosting">{ctx.tech.aws ? 'AWS, ' : ''}{ctx.hosting === 'eu' ? 'EU region' : ctx.hosting === 'morocco' ? 'Morocco' : 'United States'}</F>
              <F l="Snapshot date">{fmtDate(today)}</F><F l="Review again by">{fmtDate(addDays(90))}</F>
            </dl>
            <div className="stamp-in pointer-events-none absolute -right-2 top-36 hidden h-28 w-28 items-center justify-center rounded-full border-[3px] border-accent/70 text-center text-accent sm:flex" aria-hidden>
              <div className="rounded-full border border-accent/50 px-2 py-5">
                <p className="text-[9px] font-semibold leading-tight">EVIDENCE<br />BASED</p>
                <p className="mt-1 text-[10px] font-semibold tabular">{today.toISOString().slice(0, 10)}</p>
                <p className="text-[8px] leading-tight">SELF-ASSESSED</p>
              </div>
            </div>
          </section>

          {/* Scores */}
          <section className="grid grid-cols-2 gap-4">
            <Score label="Cybersecurity maturity" value={`${score.score}/100`} pct={score.score} note="14-question assessment" />
            <Score label="ISO 27001 control readiness" value={`${readiness.pct}%`} pct={readiness.pct} note={`${readiness.supported + readiness.partial} of ${CONTROLS.length} controls with evidence`} />
            <Score label="Requirements that may apply" value={String(applicable.length)} pct={evidencePct} note={`${fully.length} fully, ${partly.length} partially evidenced; ${review.length} more to confirm with a professional`} />
            <Score label="High-risk gaps open" value={String(highRisks.length)} pct={(highRisks.length / risks.length) * 100} note={`of ${risks.length} assessed risks`} tone="bad" />
          </section>
        </div>

        <div className="grid gap-8 border-t border-line p-6 sm:p-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold">Requirements that may apply</h2>
            <ul className="space-y-2">
              {relevant.map((r) => (
                <li key={r.req.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="leading-snug">{r.req.title}<span className="block text-xs text-muted">{r.req.instrument.split(' (')[0]}{r.req.reference ? `, ${r.req.reference}` : ''}</span></span>
                  <span className="flex shrink-0 flex-col items-end gap-1"><AppBadge s={r.status} /><EvBadge s={r.evidence} short /></span>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-semibold">Cross-border data flows</h2>
              <ul className="space-y-2 text-sm">
                {transfers.map(({ f, a }) => {
                  const remote = f.access !== 'UNKNOWN' && f.access !== a.storage;
                  return (
                  <li key={f.id} className="flex items-start gap-2"><Flag c={remote ? a.storage : f.fromCountry} size={12} /><span className="text-muted">to</span><Flag c={remote ? f.access : a.storage} size={12} />
                    <span>{f.data}: <span className="text-muted">transfer safeguards to document</span></span></li>
                  );
                })}
                {!transfers.length && <li className="text-muted">No potential international transfer detected.</li>}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">Major risks</h2>
              <ul className="space-y-2 text-sm">{risks.slice(0, 3).map((r) => (
                <li key={r.risk.id} className="flex items-center justify-between gap-3"><span>{r.risk.title}</span><span className="flex items-center gap-2"><span className="tabular text-muted">{r.residual}/25</span><RiskBadge l={r.level} /></span></li>
              ))}</ul>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">Committed actions</h2>
              <ul className="space-y-2 text-sm">{openTop.map((a) => (
                <li key={a.action.id} className="flex items-center justify-between gap-3"><span>{a.action.title}</span><span className="shrink-0 text-xs tabular text-muted">by {fmtDate(addDays(a.action.days))}</span></li>
              ))}</ul>
            </div>
          </section>
        </div>

        <footer className="border-t border-line px-6 py-5 sm:px-8">
          <p className="text-xs text-muted"><b className="text-ink">Evidence on file ({docs.length}):</b> {docs.join(', ')}.</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{LEGAL_DISCLAIMER} Based on the information provided, statuses shown as supported appear satisfied; they are not a guarantee.</p>
          <p className="mt-2 break-all text-[11px] text-muted">Snapshot integrity (SHA-256 of the assessed data): <span className="font-mrz">{hash || 'computing...'}</span></p>
          <div className="mt-4 select-all rounded-md bg-sunken px-3 py-2 font-mrz text-[12px] leading-relaxed tracking-[0.14em] text-ink/80 scroll-x whitespace-pre">
            {mrz(`P<MAR${ctx.name}<<SECURITY<PASSPORT`)}{'\n'}{mrz(`${id.replace(/-/g, '')}<MAR${yymmdd}<${String(score.score).padStart(3, '0')}<${String(readiness.pct).padStart(3, '0')}<${highRisks.length}`)}
          </div>
        </footer>
      </article>

      <Notice className="no-print mt-6">The passport is a snapshot. Any change to answers or evidence produces a new reference and hash, so a customer can tell whether the version they hold is current.</Notice>
    </>
  );
}

const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
  <div><dt className="text-[11px] text-muted">{l}</dt><dd className="font-medium leading-snug">{children}</dd></div>
);
function Score({ label, value, pct, note, tone = 'accent' }: { label: string; value: string; pct: number; note: string; tone?: 'accent' | 'bad' }) {
  return (
    <div className="rounded-xl border border-line bg-surface/80 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-[1.65rem] font-semibold tabular ${tone === 'bad' ? 'text-bad' : ''}`}>{value}</p>
      <div className="mt-2"><Meter value={pct} tone={tone} /></div>
      <p className="mt-2 text-[11px] leading-snug text-muted">{note}</p>
    </div>
  );
}
