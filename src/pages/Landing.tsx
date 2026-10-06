import { BRAND } from '../brand';
import { Flag, Logo, Button, Badge } from '../components/ui';
import { LEGAL_DISCLAIMER } from '../data/legal';
import { useStore } from '../store';

const STEPS = [
  { t: 'Describe your business', d: 'Country, customers, data, systems. Plain questions, no jargon.' },
  { t: 'See what may apply', d: 'Moroccan and EU rules, each with the reason, the condition and the source.' },
  { t: 'Check your evidence', d: 'Upload policies and records. We show what they prove and what is missing.' },
  { t: 'Share your passport', d: 'A security profile your European customer can read in two minutes.' },
];

export function Landing({ go }: { go: (p: string) => void }) {
  const { ctx, score, readiness, requirements, risks } = useStore();
  const applicable = requirements.filter((r) => r.status === 'applicable').length;
  const review = requirements.filter((r) => r.status === 'review').length;
  const high = risks.filter((r) => r.level === 'critical' || r.level === 'high').length;

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5"><Logo /><span className="font-semibold">{BRAND.name}</span></div>
        <div className="flex items-center gap-2">
          <a href="#/method" className="hidden text-sm text-muted hover:text-ink sm:inline">How it works</a>
          <Button variant="secondary" onClick={() => go('/context')}>Open the demo</Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="rise">
          <div className="mb-5 flex items-center gap-2 text-sm text-muted">
            <Flag c="MA" size={14} /><span aria-hidden>to</span><Flag c="EU" size={14} />
            <span>Built for Moroccan companies working with Europe</span>
          </div>
          <h1 className="text-[2.4rem] font-semibold leading-[1.08] tracking-tight sm:text-[3.1rem]">
            Prove your security to European customers.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            {BRAND.name} works out which cybersecurity and data rules may apply to your business, checks the evidence you already have,
            tells you what to fix first, and turns the result into a security passport your customers can trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => go('/context')} className="px-5 py-2.5 text-[15px]">Try it as AtlasTech, a Moroccan SaaS</Button>
            <Button variant="secondary" onClick={() => go('/supplier')} className="px-5 py-2.5 text-[15px]">I am a European buyer</Button>
          </div>
          <p className="mt-4 text-sm text-muted">No sign-up. Demo data is fictional and stays in your browser.</p>
        </div>

        {/* Live preview of the passport, computed from the demo data */}
        <div className="rise passport-bg relative overflow-hidden rounded-2xl border border-line p-6 shadow-[0_20px_60px_-30px_rgb(var(--accent)/.45)]" style={{ animationDelay: '.1s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted">EU Customer Security Passport</p>
              <p className="mt-1 text-2xl font-semibold">{ctx.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Flag c="MA" size={12} /> {ctx.city}, Morocco</p>
            </div>
            <Badge tone="warn">Demo</Badge>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            <div><dt className="text-xs text-muted">Cybersecurity maturity</dt><dd className="text-2xl font-semibold tabular">{score.score}<span className="text-base text-muted">/100</span></dd></div>
            <div><dt className="text-xs text-muted">ISO 27001 control readiness</dt><dd className="text-2xl font-semibold tabular">{readiness.pct}%</dd></div>
            <div><dt className="text-xs text-muted">Requirements that may apply</dt><dd className="text-2xl font-semibold tabular">{applicable}<span className="text-base text-muted"> + {review} to review</span></dd></div>
            <div><dt className="text-xs text-muted">High-risk gaps open</dt><dd className="text-2xl font-semibold tabular text-bad">{high}</dd></div>
          </dl>
          <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-sm">
            <Flag c="EU" size={13} /><span className="text-muted">to</span><Flag c="MA" size={13} />
            <span className="text-muted">Remote access to EU customer data: transfer safeguards pending</span>
          </div>
          <p className="mt-4 select-none font-mrz text-[11px] leading-snug tracking-[0.12em] text-muted/70">
            P&lt;MAR{ctx.name.toUpperCase()}&lt;&lt;SECURITY&lt;PASSPORT&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <p className="max-w-3xl text-xl leading-relaxed sm:text-2xl">
            Africa and Europe are 14 km apart at the Strait of Gibraltar. For a Moroccan supplier, the distance to a signed European contract
            is a security questionnaire, a data transfer question and a list of evidence nobody explained.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="border-t-2 border-accent pt-4">
                <p className="text-sm font-semibold tabular text-accent">{i + 1}</p>
                <p className="mt-1 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted"><Flag c="MA" size={13} /> African supplier</p>
          <h2 className="mt-2 text-lg font-semibold">Win and keep European customers</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Know what your customers will ask for, fix the gaps that matter, and answer with evidence instead of promises.</p>
          <Button className="mt-5" onClick={() => go('/context')}>Start as a supplier</Button>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted"><Flag c="EU" size={13} /> European buyer</p>
          <h2 className="mt-2 text-lg font-semibold">Assess an African supplier</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Get a risk rating based on the data and access you share, and a precise evidence request to send.</p>
          <Button variant="secondary" className="mt-5" onClick={() => go('/supplier')}>Check a supplier</Button>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 pb-12 text-xs leading-relaxed text-muted sm:px-8">
        <p>{LEGAL_DISCLAIMER}</p>
        <p className="mt-2">AtlasTech is a fictional company. Morocco is the first supported jurisdiction; the rule engine is built to add more countries.</p>
      </footer>
    </div>
  );
}
