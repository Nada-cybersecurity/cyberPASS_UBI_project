import { useState } from 'react';
import { Badge, Button, EvBadge, Flag, Notice, PageHeader, Panel, Segmented, cx } from '../components/ui';
import { CONTROL_BY_ID } from '../data/controls';
import { KEY_SUPPLIER_CONTROLS, supplierRisk, type SupplierAccess, type SupplierData } from '../engine/core';
import type { EvidenceRecord } from '../engine/types';
import { useStore } from '../store';

const BASE_REQUESTS = [
  'ISO/IEC 27001 certificate and scope, if certified',
  'Information security policy and access control policy',
  'Data processing agreement (GDPR Art. 28)',
];

export function SupplierPage({ go }: { go: (p: string) => void }) {
  const { ctx, evidence } = useStore();
  const [name, setName] = useState(ctx.name);
  const [service, setService] = useState('Software development and SaaS hosting');
  const [data, setData] = useState<SupplierData>('personal');
  const [access, setAccess] = useState<SupplierAccess>('production');
  const [shared, setShared] = useState(true);
  const [copied, setCopied] = useState(false);

  const ev: Record<string, EvidenceRecord> = shared ? evidence : {};
  const res = supplierRisk(data, access, ev);
  const requests = [...BASE_REQUESTS, ...res.gaps.map((g) => g.request)];
  const safeName = name.replace(/[<>]/g, '').slice(0, 60) || 'the supplier';
  const email = `Subject: Security evidence request for ${safeName}\n\nHello,\n\nAs part of our supplier security review for "${service}", please provide the following within 15 working days:\n\n${requests.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nThe service involves ${data === 'personal' ? 'personal data of our customers' : data === 'sensitive' ? 'sensitive personal data' : 'our business data'} and ${access} access. Thank you.\n`;

  return (
    <>
      <PageHeader title="Assess an African supplier" intro="For a European company: rate the cyber risk of a supplier from the data and access you give them, and send a precise evidence request instead of a 300-question spreadsheet." />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Panel title="Supplier">
          <div className="space-y-4 text-sm">
            <label className="block"><span className="mb-1 block text-xs text-muted">Supplier name</span>
              <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2" /></label>
            <div><span className="mb-1 block text-xs text-muted">Country</span><span className="inline-flex items-center gap-2"><Flag c="MA" size={13} /> Morocco</span></div>
            <label className="block"><span className="mb-1 block text-xs text-muted">Service</span>
              <input value={service} maxLength={80} onChange={(e) => setService(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2" /></label>
            <div><span className="mb-1.5 block text-xs text-muted">Data they will handle</span>
              <Segmented<SupplierData> value={data} onChange={setData} options={[{ v: 'business', label: 'Business' }, { v: 'personal', label: 'Personal' }, { v: 'sensitive', label: 'Sensitive' }]} /></div>
            <div><span className="mb-1.5 block text-xs text-muted">Access to your systems</span>
              <Segmented<SupplierAccess> value={access} onChange={setAccess} options={[{ v: 'none', label: 'None' }, { v: 'limited', label: 'Limited' }, { v: 'production', label: 'Production' }, { v: 'admin', label: 'Admin' }]} /></div>
            <label className="flex items-start gap-2 rounded-lg bg-sunken p-3">
              <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="mt-0.5" />
              <span><span className="font-medium">Supplier shared a CyberPass passport</span><span className="block text-xs text-muted">Use their evidence statuses instead of assuming nothing is proven.</span></span>
            </label>
          </div>
        </Panel>

        <div className="space-y-6">
          <section className={cx('rounded-xl border p-6', res.level === 'HIGH' ? 'border-bad/40 bg-badsoft' : res.level === 'MEDIUM' ? 'border-warn/40 bg-warnsoft' : 'border-ok/40 bg-oksoft')}>
            <p className="text-sm">Supplier cyber risk for <b>{safeName}</b></p>
            <p className={cx('mt-1 text-4xl font-semibold tracking-tight', res.level === 'HIGH' ? 'text-bad' : res.level === 'MEDIUM' ? 'text-warn' : 'text-ok')}>{res.level}</p>
            <p className="mt-2 text-sm">Exposure {res.exposure}/6 from {data} data and {access} access. {res.gaps.length} of {KEY_SUPPLIER_CONTROLS.length} key controls lack operating evidence.</p>
          </section>

          <Panel title="Reasons">
            <ul className="space-y-2.5">
              {KEY_SUPPLIER_CONTROLS.map((k) => {
                const s = ev[k.id]?.status ?? 'not_demonstrated';
                const gap = s !== 'supported';
                return (
                  <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className={gap ? '' : 'text-muted'}>{gap ? k.reason : `${CONTROL_BY_ID[k.id].title}: evidenced`} <span className="text-xs text-muted">({k.id})</span></span>
                    <EvBadge s={s} short />
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Evidence request to send" action={<Button variant="secondary" onClick={() => navigator.clipboard?.writeText(email).then(() => setCopied(true), () => setCopied(false))}>{copied ? 'Copied' : 'Copy as email'}</Button>}>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">{requests.map((r) => <li key={r}>{r}</li>)}</ol>
            <div className="mt-4 flex flex-wrap gap-2"><Badge tone="accent">Tailored to {res.gaps.length} gaps</Badge><Badge tone="neutral">{requests.length} items</Badge></div>
          </Panel>
          <Notice>This rating supports a procurement decision; it does not replace your own due diligence or contractual safeguards.</Notice>
          <Button variant="secondary" onClick={() => go('/passport')}>Back to the supplier's passport</Button>
        </div>
      </div>
    </>
  );
}
