import { AppBadge, Badge, Button, Chips, Flag, PageHeader, Panel, Segmented, Toggle } from '../components/ui';
import type { CountryCode, Hosting, OrgContext } from '../engine/types';
import { useStore } from '../store';

const SECTORS: { v: OrgContext['sector']; label: string }[] = [
  { v: 'saas', label: 'Software / SaaS' }, { v: 'it_services', label: 'IT services' }, { v: 'bpo', label: 'BPO / call centre' },
  { v: 'fintech', label: 'Fintech' }, { v: 'ecommerce', label: 'E-commerce' }, { v: 'consulting', label: 'Consulting' },
];

export function ContextPage({ go }: { go: (p: string) => void }) {
  const { ctx, setCtx, requirements, canEdit } = useStore();
  const d = !canEdit;
  const counts = {
    applicable: requirements.filter((r) => r.status === 'applicable').length,
    review: requirements.filter((r) => r.status === 'review').length,
    na: requirements.filter((r) => r.status === 'not_applicable').length,
  };
  const markets = (['morocco', 'eu', 'africa'] as const).filter((k) => ctx.sellsTo[k]);
  const dataTypes = (Object.keys(ctx.dataTypes) as (keyof OrgContext['dataTypes'])[]).filter((k) => ctx.dataTypes[k]);
  const tech = (Object.keys(ctx.tech) as (keyof OrgContext['tech'])[]).filter((k) => ctx.tech[k]);

  return (
    <>
      <PageHeader step="Step 1 of 6" title="Your business context"
        intro="These answers decide which rules may apply. Change any of them and the results update instantly. AtlasTech's answers are pre-filled." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Company">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name"><input disabled={d} value={ctx.name} maxLength={60} onChange={(e) => setCtx({ name: e.target.value.replace(/[<>]/g, '') })} className="input" /></Field>
              <Field label="Country">
                <div className="input flex items-center gap-2"><Flag c="MA" size={13} /> Morocco <span className="ml-auto text-xs text-muted">more countries soon</span></div>
              </Field>
              <Field label="Industry">
                <select disabled={d} value={ctx.sector} onChange={(e) => setCtx({ sector: e.target.value as OrgContext['sector'] }, `Changed industry to ${e.target.value}`)} className="input">
                  {SECTORS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Employees">
                <input disabled={d} type="number" min={1} max={100000} value={ctx.employees} onChange={(e) => setCtx({ employees: Math.max(1, Math.min(100000, Number(e.target.value) || 1)) })} className="input tabular" />
              </Field>
            </div>
          </Panel>

          <Panel title="Who you sell to">
            <Chips disabled={d} value={markets as string[]} onChange={(v) => setCtx({ sellsTo: { morocco: v.includes('morocco'), eu: v.includes('eu'), africa: v.includes('africa') } }, 'Changed markets')}
              options={[{ v: 'morocco', label: 'Morocco' }, { v: 'eu', label: 'European Union' }, { v: 'africa', label: 'Other African countries' }]} />
            {ctx.sellsTo.eu && (
              <div className="mt-5 divide-y divide-line border-t border-line">
                <div className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className="font-medium">EU customer countries</span>
                  <Chips disabled={d} value={ctx.euCustomerCountries as string[]} onChange={(v) => setCtx({ euCustomerCountries: v as CountryCode[] })}
                    options={[{ v: 'FR', label: 'France' }, { v: 'DE', label: 'Germany' }, { v: 'ES', label: 'Spain' }]} />
                </div>
                <Toggle disabled={d} checked={ctx.euBusinessCustomers} onChange={(v) => setCtx({ euBusinessCustomers: v }, `EU business customers: ${v}`)} label="Do you provide services to European companies?" />
                <Toggle disabled={d} checked={ctx.euIndividualsTargeted} onChange={(v) => setCtx({ euIndividualsTargeted: v }, `Targets EU individuals: ${v}`)}
                  label="Do you sell directly to individuals in the EU?" hint="For example consumers who sign up on your website from France." />
                {ctx.euBusinessCustomers && (
                  <>
                    <Toggle disabled={d} checked={ctx.euDataProcessed} onChange={(v) => setCtx({ euDataProcessed: v }, `Processes EU customer personal data: ${v}`)}
                      label="Do European customers' systems or data pass through you?" hint="You store or access personal data on their behalf." />
                    <Toggle disabled={d} checked={ctx.euFinancialCustomers} onChange={(v) => setCtx({ euFinancialCustomers: v }, `EU financial customers: ${v}`)}
                      label="Is any EU customer a bank, insurer or other financial firm?" />
                  </>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Where data lives">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium">Customer data is hosted in</span>
              <Segmented<Hosting> disabled={d} value={ctx.hosting} onChange={(v) => setCtx({ hosting: v }, `Hosting changed to ${v}`)}
                options={[{ v: 'eu', label: 'EU region' }, { v: 'morocco', label: 'Morocco' }, { v: 'us', label: 'United States' }]} />
            </div>
            {ctx.hosting !== 'morocco' && (
              <div className="mt-2 border-t border-line">
                <Toggle disabled={d} checked={ctx.remoteAccessFromMorocco} onChange={(v) => setCtx({ remoteAccessFromMorocco: v }, `Remote access from Morocco: ${v}`)}
                  label="Can staff in Morocco access that data?" hint="Support, engineering or administrators working from Morocco." />
              </div>
            )}
            <div className="mt-2 border-t border-line">
              <Toggle disabled={d} checked={ctx.moroccanPersonalData} onChange={(v) => setCtx({ moroccanPersonalData: v })} label="Do you process personal data of people in Morocco?" hint="Moroccan customers, employees, prospects." />
            </div>
          </Panel>

          <Panel title="Data, systems and people">
            <p className="mb-2 text-sm font-medium">Data you handle</p>
            <Chips disabled={d} value={dataTypes as string[]}
              onChange={(v) => setCtx({ dataTypes: { customerPersonal: v.includes('customerPersonal'), employee: v.includes('employee'), financial: v.includes('financial'), health: v.includes('health'), credentials: v.includes('credentials') } })}
              options={[{ v: 'customerPersonal', label: 'Customer personal data' }, { v: 'employee', label: 'Employee data' }, { v: 'financial', label: 'Financial data' }, { v: 'health', label: 'Health data' }, { v: 'credentials', label: 'Credentials' }]} />
            <p className="mb-2 mt-5 text-sm font-medium">Technology</p>
            <Chips disabled={d} value={tech as string[]}
              onChange={(v) => setCtx({ tech: { aws: v.includes('aws'), m365: v.includes('m365'), googleWs: v.includes('googleWs'), onPrem: v.includes('onPrem'), vpn: v.includes('vpn'), remoteWork: v.includes('remoteWork'), apis: v.includes('apis') } })}
              options={[{ v: 'aws', label: 'AWS' }, { v: 'm365', label: 'Microsoft 365' }, { v: 'googleWs', label: 'Google Workspace' }, { v: 'onPrem', label: 'On-premise servers' }, { v: 'vpn', label: 'VPN' }, { v: 'remoteWork', label: 'Remote employees' }, { v: 'apis', label: 'Public APIs' }]} />
            <div className="mt-5 grid grid-cols-3 gap-4">
              <Field label="Employees"><div className="input tabular">{ctx.employees}</div></Field>
              <Field label="Administrators"><input disabled={d} type="number" min={0} max={500} value={ctx.admins} onChange={(e) => setCtx({ admins: Math.max(0, Number(e.target.value) || 0) })} className="input tabular" /></Field>
              <Field label="Contractors"><input disabled={d} type="number" min={0} max={5000} value={ctx.contractors} onChange={(e) => setCtx({ contractors: Math.max(0, Number(e.target.value) || 0) })} className="input tabular" /></Field>
            </div>
          </Panel>

          <Panel title="Special status in Morocco">
            <Toggle disabled={d} checked={ctx.publicEntity} onChange={(v) => setCtx({ publicEntity: v }, `Public entity: ${v}`)} label="Public administration or public company" />
            <Toggle disabled={d} checked={ctx.vitalInfrastructure} onChange={(v) => setCtx({ vitalInfrastructure: v }, `Vital infrastructure: ${v}`)} label="Designated vital-importance infrastructure" hint="Energy, water, transport, health, finance or telecom operators designated by the authorities." />
          </Panel>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Panel title="Live result">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Count n={counts.applicable} label="May apply" className="text-accent" />
              <Count n={counts.review} label="To review" className="text-warn" />
              <Count n={counts.na} label="Not applicable" className="text-muted" />
            </div>
            <ul className="mt-5 space-y-2.5">
              {requirements.filter((r) => r.status !== 'not_applicable').map((r) => (
                <li key={r.req.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="leading-snug">{r.req.title}</span>
                  <span className="shrink-0"><AppBadge s={r.status} /></span>
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" onClick={() => go('/requirements')}>See why each one applies</Button>
            <p className="mt-3 text-xs text-muted">Try it: switch off <Badge tone="neutral">Can staff in Morocco access that data?</Badge> and watch the transfer requirement change.</p>
          </Panel>
        </aside>
      </div>
      <style>{`.input{width:100%;border:1px solid rgb(var(--line));background:rgb(var(--surface));border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;color:rgb(var(--ink))}.input:disabled{opacity:.7}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs text-muted">{label}</span>{children}</label>;
}
function Count({ n, label, className }: { n: number; label: string; className: string }) {
  return <div className="rounded-lg bg-sunken py-3"><p className={`text-2xl font-semibold tabular ${className}`}>{n}</p><p className="text-xs text-muted">{label}</p></div>;
}
