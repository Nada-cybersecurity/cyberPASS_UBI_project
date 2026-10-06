import type { ReactNode } from 'react';
import type { Applicability, CountryCode, EvidenceStatus, SourceStatus } from '../engine/types';
import type { RiskLevel } from '../engine/core';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'accent';
const TONE: Record<Tone, string> = {
  ok: 'bg-oksoft text-ok', warn: 'bg-warnsoft text-warn', bad: 'bg-badsoft text-bad', neutral: 'bg-neutralsoft text-neutral', accent: 'bg-accentsoft text-accent',
};
export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONE[tone], className)}>{children}</span>;
}

export const APPLICABILITY: Record<Applicability, { label: string; tone: Tone }> = {
  applicable: { label: 'Potentially applicable', tone: 'accent' },
  review: { label: 'Requires review', tone: 'warn' },
  not_applicable: { label: 'Not applicable', tone: 'neutral' },
};
export const EVIDENCE: Record<EvidenceStatus, { label: string; tone: Tone; short: string }> = {
  supported: { label: 'Supported', tone: 'ok', short: 'Supported' },
  partial: { label: 'Partially supported', tone: 'warn', short: 'Partial' },
  not_demonstrated: { label: 'Not demonstrated', tone: 'bad', short: 'Not shown' },
  irrelevant: { label: 'Irrelevant', tone: 'neutral', short: 'Irrelevant' },
};
export const RISK: Record<RiskLevel, { label: string; tone: Tone }> = {
  critical: { label: 'Critical', tone: 'bad' }, high: { label: 'High', tone: 'bad' }, medium: { label: 'Medium', tone: 'warn' }, low: { label: 'Low', tone: 'ok' },
};
export const SOURCE: Record<SourceStatus, { label: string; tone: Tone }> = {
  verified: { label: 'Official source checked', tone: 'ok' },
  secondary: { label: 'Re-verify before reliance', tone: 'warn' },
  unverified_demo: { label: 'Demo placeholder', tone: 'bad' },
};

export const AppBadge = ({ s }: { s: Applicability }) => <Badge tone={APPLICABILITY[s].tone}>{APPLICABILITY[s].label}</Badge>;
export const EvBadge = ({ s, short }: { s: EvidenceStatus; short?: boolean }) => <Badge tone={EVIDENCE[s].tone}>{short ? EVIDENCE[s].short : EVIDENCE[s].label}</Badge>;
export const RiskBadge = ({ l }: { l: RiskLevel }) => <Badge tone={RISK[l].tone}>{RISK[l].label}</Badge>;

export function Panel({ children, className, title, action, pad = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; pad?: boolean }) {
  return (
    <section className={cx('rounded-xl border border-line bg-surface', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function Button({ children, onClick, variant = 'primary', disabled, className, title, type = 'button' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; className?: string; title?: string; type?: 'button' | 'submit';
}) {
  const v = {
    primary: 'bg-accent text-white hover:opacity-90 dark:text-[rgb(14_18_27)]',
    secondary: 'border border-line bg-surface hover:bg-sunken',
    ghost: 'hover:bg-sunken text-muted hover:text-ink',
  }[variant];
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick}
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45', v, className)}>
      {children}
    </button>
  );
}

export function PageHeader({ step, title, intro, right }: { step?: string; title: string; intro?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {step && <p className="mb-1 text-sm text-muted">{step}</p>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{title}</h1>
        {intro && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{intro}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cx('mt-1 text-2xl font-semibold tabular', tone && TONE[tone].split(' ')[1])}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Meter({ value, max = 100, tone = 'accent' }: { value: number; max?: number; tone?: Tone }) {
  const bar = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', neutral: 'bg-neutral', accent: 'bg-accent' }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={cx('h-full rounded-full transition-all duration-500', bar)} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
    </div>
  );
}

export function Notice({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <div className={cx('rounded-lg px-4 py-3 text-sm leading-relaxed', TONE[tone], className)}>{children}</div>;
}

// Moroccan eight-point star (khatam) as the brand mark.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="9" y="9" width="22" height="22" rx="2" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" />
      <rect x="9" y="9" width="22" height="22" rx="2" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" transform="rotate(45 20 20)" />
      <path d="M14.5 20.5l3.8 3.8 7.4-8" fill="none" stroke="rgb(var(--ink))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Flags drawn in SVG: emoji flags do not render on Windows.
export function Flag({ c, size = 18 }: { c: CountryCode | 'EU'; size?: number }) {
  const w = size * 1.4, h = size;
  const common = { width: w, height: h, viewBox: '0 0 42 30', className: 'inline-block shrink-0 rounded-[2px] ring-1 ring-black/10' } as const;
  if (c === 'MA')
    return (
      <svg {...common} aria-label="Morocco"><rect width="42" height="30" fill="#C1272D" />
        <path d="M21 8.6l2.6 8-6.8-4.9h8.4l-6.8 4.9z" fill="none" stroke="#006233" strokeWidth="1.3" strokeLinejoin="round" transform="translate(0 2.2)" /></svg>
    );
  if (c === 'EU')
    return (
      <svg {...common} aria-label="European Union"><rect width="42" height="30" fill="#003399" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={21 + 8 * Math.sin(a)} cy={15 - 8 * Math.cos(a)} r="1.25" fill="#FFCC00" />;
        })}</svg>
    );
  if (c === 'FR') return <svg {...common} aria-label="France"><rect width="14" height="30" fill="#0055A4" /><rect x="14" width="14" height="30" fill="#fff" /><rect x="28" width="14" height="30" fill="#EF4135" /></svg>;
  if (c === 'DE') return <svg {...common} aria-label="Germany"><rect width="42" height="10" fill="#000" /><rect y="10" width="42" height="10" fill="#DD0000" /><rect y="20" width="42" height="10" fill="#FFCE00" /></svg>;
  if (c === 'US') return <svg {...common} aria-label="United States">{Array.from({ length: 7 }).map((_, i) => <rect key={i} y={i * 4.3} width="42" height="2.15" fill="#B22234" />)}<rect width="18" height="15" fill="#3C3B6E" /></svg>;
  return <svg {...common} aria-label="Unknown"><rect width="42" height="30" fill="rgb(var(--sunken))" /><text x="21" y="20" textAnchor="middle" fontSize="13" fill="rgb(var(--muted))">?</text></svg>;
}

export function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className={cx('flex items-start justify-between gap-4 py-2.5', disabled ? 'opacity-60' : 'cursor-pointer')}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-accent' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </label>
  );
}

export function Chips<T extends string>({ options, value, onChange, disabled }: { options: { v: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.v);
        return (
          <button key={o.v} type="button" disabled={disabled} aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.v) : [...value, o.v])}
            className={cx('rounded-full border px-3 py-1 text-sm transition', on ? 'border-accent bg-accentsoft text-accent' : 'border-line text-muted hover:text-ink')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, disabled }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-sunken p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" disabled={disabled} aria-pressed={value === o.v} onClick={() => onChange(o.v)}
          className={cx('rounded-md px-3 py-1.5 text-sm transition', value === o.v ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
