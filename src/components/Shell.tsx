import { useState, type ReactNode } from 'react';
import { BRAND } from '../brand';
import { LEGAL_DISCLAIMER } from '../data/legal';
import type { Role } from '../engine/types';
import { ROLE_LABEL, useStore } from '../store';
import { Badge, Logo, cx } from './ui';

export interface NavItem { path: string; label: string; step?: number; roles: Role[] }
export const JOURNEY: NavItem[] = [
  { path: '/context', label: 'Company context', step: 1, roles: ['analyst', 'auditor', 'executive'] },
  { path: '/requirements', label: 'Requirements', step: 2, roles: ['analyst', 'auditor', 'executive'] },
  { path: '/flows', label: 'Data flows', step: 3, roles: ['analyst', 'auditor', 'executive'] },
  { path: '/evidence', label: 'Evidence', step: 4, roles: ['analyst', 'auditor'] },
  { path: '/fix-first', label: 'Fix first', step: 5, roles: ['analyst', 'auditor', 'executive'] },
  { path: '/passport', label: 'Security passport', step: 6, roles: ['analyst', 'auditor', 'executive'] },
];
export const OTHER: NavItem[] = [
  { path: '/supplier', label: 'Check a supplier', roles: ['analyst', 'auditor', 'executive'] },
  { path: '/workspace', label: 'GRC workspace', roles: ['analyst', 'auditor'] },
  { path: '/method', label: 'Method and security', roles: ['analyst', 'auditor', 'executive'] },
  { path: '/settings', label: 'Organisation', roles: ['analyst', 'executive'] },
];

export function Shell({ path, go, children }: { path: string; go: (p: string) => void; children: ReactNode }) {
  const { ctx, role, setRole, reset } = useStore();
  const [open, setOpen] = useState(false);
  const item = (n: NavItem) => {
    const active = path === n.path;
    return (
      <li key={n.path}>
        <a href={'#' + n.path} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
          className={cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition', active ? 'bg-accentsoft font-medium text-accent' : 'text-muted hover:bg-sunken hover:text-ink')}>
          {n.step && <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', active ? 'bg-accent text-white dark:text-[rgb(14_18_27)]' : 'bg-sunken text-muted')}>{n.step}</span>}
          {n.label}
        </a>
      </li>
    );
  };
  const nav = (
    <nav className="flex h-full flex-col gap-6 p-4">
      <a href="#/" className="flex items-center gap-2.5 px-2 no-underline" style={{ color: 'inherit' }}>
        <Logo />
        <span className="text-[15px] font-semibold leading-tight">{BRAND.name}</span>
      </a>
      <div>
        <p className="px-3 pb-2 text-xs text-muted">{ctx.name} journey</p>
        <ul className="space-y-0.5">{JOURNEY.filter((n) => n.roles.includes(role)).map(item)}</ul>
      </div>
      <div>
        <p className="px-3 pb-2 text-xs text-muted">More</p>
        <ul className="space-y-0.5">{OTHER.filter((n) => n.roles.includes(role)).map(item)}</ul>
      </div>
      <div className="mt-auto rounded-lg border border-line p-3 text-xs leading-relaxed text-muted">
        Readiness assessment, not legal advice or certification.
        <a href="#/method" className="mt-1 block">Read the disclaimer</a>
      </div>
    </nav>
  );

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="no-print sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">{nav}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>{nav}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="no-print sticky z-30 flex flex-wrap items-center gap-3 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur sm:px-8" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <button className="rounded-md p-1.5 hover:bg-sunken lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </button>
          <span className="font-semibold">{ctx.name}</span>
          <Badge tone="warn">Fictional demo company</Badge>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted">
              <span className="hidden sm:inline">Viewing as</span>
              <select value={role} onChange={(e) => { const r = e.target.value as Role; setRole(r); if (!JOURNEY.concat(OTHER).find((n) => n.path === path)?.roles.includes(r)) go('/fix-first'); }}
                className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-ink">
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <button onClick={() => { if (confirm('Reset all demo data to the original AtlasTech state?')) { reset(); go('/context'); } }}
              className="rounded-md px-2 py-1 text-xs text-muted hover:bg-sunken hover:text-ink">Reset demo</button>
          </div>
        </header>
        {role !== 'analyst' && (
          <div className="no-print border-b border-line bg-sunken px-4 py-2 text-xs text-muted sm:px-8">
            {ROLE_LABEL[role]} view: read-only. Role switching here previews the interface; the target architecture enforces roles on the server.
          </div>
        )}
        <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">{children}</main>
        <footer className="no-print mx-auto max-w-[1200px] px-4 pb-10 text-xs leading-relaxed text-muted sm:px-8">{LEGAL_DISCLAIMER}</footer>
      </div>
    </div>
  );
}
