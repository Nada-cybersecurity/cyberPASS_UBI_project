import { useState } from 'react';
import { Badge, Button, Flag, Notice, PageHeader, Panel, cx } from '../components/ui';
import { analyseFlow, countryName } from '../engine/core';
import type { CountryCode, DataFlow } from '../engine/types';
import { useStore } from '../store';

const COUNTRIES: CountryCode[] = ['MA', 'EU', 'FR', 'DE', 'ES', 'US', 'UNKNOWN'];

export function FlowsPage() {
  const { flows, ctx, canEdit, addFlow, removeFlow } = useStore();
  const analysed = flows.map((f) => ({ f, ...analyseFlow(f, ctx) }));
  const transfers = analysed.filter((a) => a.findings.some((x) => x.level === 'transfer')).length;
  const checks = analysed.filter((a) => a.findings.some((x) => x.level === 'check')).length;

  return (
    <>
      <PageHeader step="Step 3 of 6" title="Where your data goes"
        intro="Each flow is checked for where data is stored and where it is accessed from. Remote access counts: data hosted in the EU but opened from Rabat still crosses a border." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-muted">Data flows mapped</p><p className="text-2xl font-semibold tabular">{flows.length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-muted">Potential international transfers</p><p className="text-2xl font-semibold tabular text-bad">{transfers}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-muted">Flows with points to check</p><p className="text-2xl font-semibold tabular text-warn">{checks}</p></div>
      </div>

      <div className="space-y-3">
        {analysed.map(({ f, storage, findings }) => {
          const level = findings.some((x) => x.level === 'transfer') ? 'transfer' : findings.some((x) => x.level === 'check') ? 'check' : 'none';
          return (
            <article key={f.id} className={cx('rounded-xl border bg-surface', level === 'transfer' ? 'border-bad/40' : 'border-line')}>
              <div className="grid items-center gap-4 p-4 md:grid-cols-[1fr_auto_1fr]">
                <Node c={f.fromCountry} label={f.fromLabel} sub={f.dataSubjects === 'EU' ? 'People in the EU' : f.dataSubjects === 'MA' ? 'People in Morocco' : 'Mixed'} />
                <div className="flex flex-col items-center text-center">
                  <p className="text-xs font-medium">{f.data}</p>
                  <svg width="140" height="14" viewBox="0 0 140 14" className={level === 'transfer' ? 'text-bad' : level === 'check' ? 'text-warn' : 'text-ok'} aria-hidden>
                    <path d="M2 7h128" stroke="currentColor" strokeWidth="2" strokeDasharray={level === 'none' ? '0' : '5 4'} />
                    <path d="M128 2l8 5-8 5z" fill="currentColor" />
                  </svg>
                  <p className="text-xs text-muted">{f.purpose}</p>
                </div>
                <Node c={storage} label={f.toLabel} sub={`Stored: ${countryName(storage)}. Accessed from: ${countryName(f.access)}`} access={f.access} />
              </div>
              <div className="space-y-2 border-t border-line px-4 py-3">
                {findings.map((x, i) => (
                  <div key={i} className="flex flex-wrap items-start gap-2 text-sm">
                    <Badge tone={x.level === 'transfer' ? 'bad' : x.level === 'check' ? 'warn' : 'ok'}>{x.level === 'transfer' ? 'Potential transfer' : x.level === 'check' ? 'Check' : 'Clear'}</Badge>
                    <span className="flex-1"><span className="font-medium">{x.text}</span> <span className="text-muted">{x.next}</span></span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 text-xs text-muted">
                  <span>{f.party}</span>
                  {canEdit && !f.id.startsWith('F') && <button className="underline" onClick={() => removeFlow(f.id)}>Remove</button>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {canEdit && <AddFlow onAdd={addFlow} />}
      <Notice className="mt-6">The platform flags potential considerations. It does not decide whether a transfer is lawful: that depends on contracts and safeguards a professional should review.</Notice>
    </>
  );
}

function Node({ c, label, sub, access }: { c: CountryCode; label: string; sub: string; access?: CountryCode }) {
  return (
    <div className="flex items-start gap-3">
      <Flag c={c} size={20} />
      <div>
        <p className="text-sm font-medium leading-snug">{label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">{access && access !== c && <Flag c={access} size={11} />}{sub}</p>
      </div>
    </div>
  );
}

function AddFlow({ onAdd }: { onAdd: (f: DataFlow) => void }) {
  const [f, setF] = useState({ from: 'EU business customers', fromCountry: 'EU' as CountryCode, to: '', data: 'Customer personal data', purpose: '', storage: 'MA' as CountryCode, access: 'MA' as CountryCode, party: '', sub: false });
  const [err, setErr] = useState('');
  const clean = (s: string) => s.replace(/[<>]/g, '').slice(0, 80);
  const submit = () => {
    if (!f.to.trim() || !f.purpose.trim()) return setErr('Add a destination and a purpose to save this flow.');
    setErr('');
    onAdd({ id: 'U' + Date.now(), fromLabel: clean(f.from), fromCountry: f.fromCountry, toLabel: clean(f.to), data: clean(f.data), purpose: clean(f.purpose),
      party: clean(f.party) || 'Not specified', role: f.sub ? 'subprocessor' : 'internal', storage: f.storage, access: f.access, dataSubjects: f.fromCountry === 'MA' ? 'MA' : 'EU' });
    setF({ ...f, to: '', purpose: '', party: '' });
  };
  const sel = (k: 'fromCountry' | 'storage' | 'access') => (
    <select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value as CountryCode })} className="w-full rounded-lg border border-line bg-surface px-2 py-2 text-sm">
      {COUNTRIES.map((c) => <option key={c} value={c}>{countryName(c).replace(/^the /, '').replace(/^an unknown location$/, 'Unknown')}</option>)}
    </select>
  );
  const inp = (k: 'from' | 'to' | 'data' | 'purpose' | 'party', ph: string) => (
    <input value={f[k]} placeholder={ph} maxLength={80} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm" />
  );
  return (
    <Panel title="Add a data flow" className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <L t="Origin">{inp('from', 'Who sends the data')}</L><L t="Origin country">{sel('fromCountry')}</L>
        <L t="Destination">{inp('to', 'e.g. Analytics tool')}</L><L t="Type of data">{inp('data', 'e.g. Customer emails')}</L>
        <L t="Purpose">{inp('purpose', 'Why it is shared')}</L><L t="Processor or sub-processor">{inp('party', 'Company name')}</L>
        <L t="Storage location">{sel('storage')}</L><L t="Access location">{sel('access')}</L>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.sub} onChange={(e) => setF({ ...f, sub: e.target.checked })} /> This is a sub-processor</label>
      {err && <p className="mt-3 text-sm text-bad">{err}</p>}
      <Button className="mt-4" onClick={submit}>Add flow and analyse</Button>
    </Panel>
  );
}
const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="mb-1 block text-xs text-muted">{t}</span>{children}</label>;
