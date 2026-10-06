import { useRef, useState } from 'react';
import { Badge, Button, EvBadge, Notice, PageHeader, Panel, cx } from '../components/ui';
import { CONTROLS } from '../data/controls';
import { SAMPLE_DOCS } from '../data/samples';
import { analyseEvidence, type AnalysisResult } from '../engine/evidence';
import { MAX_FILE_BYTES, base64ToBuffer, extractPdfText } from '../engine/pdf';
import { useStore, type RiskChange } from '../store';

type Phase = { k: 'idle' } | { k: 'busy'; name: string; step: number } | { k: 'done'; res: AnalysisResult } | { k: 'error'; msg: string };
const STEPS = ['Reading the document in your browser', `Matching against ${CONTROLS.length} ISO 27001 controls`, 'Checking for embedded instructions', 'Separating written rules from proof of operation'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function EvidencePage({ go }: { go: (p: string) => void }) {
  const { canEdit, applyAnalysis, docs } = useStore();
  const [phase, setPhase] = useState<Phase>({ k: 'idle' });
  const [applied, setApplied] = useState<RiskChange[] | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function run(name: string, getText: () => Promise<string>) {
    setApplied(null);
    try {
      setPhase({ k: 'busy', name, step: 0 });
      const text = await getText();
      for (let i = 1; i < STEPS.length; i++) { await wait(380); setPhase({ k: 'busy', name, step: i }); }
      await wait(380);
      setPhase({ k: 'done', res: analyseEvidence(text, name, CONTROLS) });
    } catch (e) {
      setPhase({ k: 'error', msg: e instanceof Error ? e.message : 'The file could not be read.' });
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const name = file.name.replace(/[^\w.\- ]/g, '_').slice(0, 80);
    const ext = name.toLowerCase().split('.').pop();
    if (file.size > MAX_FILE_BYTES) return setPhase({ k: 'error', msg: `This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 5 MB.` });
    if (ext === 'pdf') return run(name, async () => extractPdfText(await file.arrayBuffer()));
    if (ext === 'txt' || ext === 'md') return run(name, () => file.text());
    setPhase({ k: 'error', msg: 'This demo reads PDF and TXT files. DOCX, XLSX and image (OCR) support is on the roadmap.' });
  }

  return (
    <>
      <PageHeader step="Step 4 of 6" title="Check your evidence"
        intro="Upload a policy, plan or record. The analyser shows which controls it supports and what is still missing. A written policy proves intent, not implementation, so it can never count as full proof on its own." />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Panel title="Upload a document">
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); if (canEdit) onFile(e.dataTransfer.files[0]); }}
              className={cx('flex flex-col items-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition', drag ? 'border-accent bg-accentsoft' : 'border-line')}>
              <svg width="28" height="28" viewBox="0 0 24 24" className="text-muted" aria-hidden><path d="M12 16V4m0 0l-4 4m4-4l4 4M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <p className="mt-2 text-sm font-medium">Drop a PDF here</p>
              <p className="mt-1 text-xs text-muted">PDF or TXT, up to 5 MB. The file is read in your browser and never uploaded.</p>
              <input ref={input} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
              <Button variant="secondary" className="mt-4" disabled={!canEdit} onClick={() => input.current?.click()}>Choose a file</Button>
            </div>
          </Panel>
          <Panel title="Or try a sample document">
            <ul className="space-y-2">
              {SAMPLE_DOCS.map((s) => (
                <li key={s.name}>
                  <button disabled={!canEdit || phase.k === 'busy'} onClick={() => run(s.name, () => extractPdfText(base64ToBuffer(s.base64)))}
                    className="w-full rounded-lg border border-line p-3 text-left transition hover:border-accent/60 hover:bg-sunken disabled:opacity-50">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{s.description}</p>
                  </button>
                </li>
              ))}
            </ul>
            {!canEdit && <p className="mt-3 text-xs text-muted">Switch to the GRC analyst view to analyse documents.</p>}
          </Panel>
          {docs.length > 0 && (
            <Panel title="Validated this session">
              <ul className="space-y-2 text-sm">{docs.map((d) => <li key={d.name} className="flex justify-between gap-2"><span className="truncate">{d.name}</span><span className="text-xs text-muted">{d.controls.join(', ') || 'no control'}</span></li>)}</ul>
            </Panel>
          )}
        </div>

        <div aria-live="polite">
          {phase.k === 'idle' && (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-line p-8 text-center">
              <p className="font-medium">No document analysed yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted">Start with <b>Access_Control_Policy.pdf</b>: it shows how a good policy still leaves gaps a European customer will ask about.</p>
            </div>
          )}
          {phase.k === 'busy' && (
            <Panel title={`Analysing ${phase.name}`}>
              <ol className="space-y-3">
                {STEPS.map((s, i) => (
                  <li key={s} className={cx('flex items-center gap-3 text-sm', i > phase.step && 'text-muted')}>
                    <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', i < phase.step ? 'bg-ok text-white' : i === phase.step ? 'animate-pulse bg-accent text-white' : 'bg-sunken')}>{i < phase.step ? '✓' : i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </Panel>
          )}
          {phase.k === 'error' && (
            <Notice tone="bad"><b>The document was not analysed.</b> {phase.msg}</Notice>
          )}
          {phase.k === 'done' && <Result res={phase.res} applied={applied} canEdit={canEdit}
            onApply={() => setApplied(applyAnalysis(phase.res))} onDiscard={() => { setPhase({ k: 'idle' }); setApplied(null); }} go={go} />}
        </div>
      </div>
    </>
  );
}

function Result({ res, applied, onApply, onDiscard, canEdit, go }: { res: AnalysisResult; applied: RiskChange[] | null; onApply: () => void; onDiscard: () => void; canEdit: boolean; go: (p: string) => void }) {
  const top = res.findings[0];
  return (
    <div className="space-y-4 rise">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted">{res.fileName}</p>
            <p className="mt-1 text-lg font-semibold">{res.summary}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Evidence status</p>
            <div className="mt-1 scale-110 origin-right"><EvBadge s={res.verdict} /></div>
            {top && <p className="mt-2 text-xs text-muted">Confidence: <b className="text-ink">{top.confidence}</b></p>}
          </div>
        </div>
        {res.injectionWarnings.length > 0 && (
          <Notice tone="bad" className="mt-4">
            <b>Instruction-like text found and ignored.</b> The document tried to tell the system what to do. It was treated as data and earned no credit:
            <ul className="mt-2 list-disc pl-5">{res.injectionWarnings.map((w) => <li key={w} className="italic">{w}</li>)}</ul>
          </Notice>
        )}
      </Panel>

      {res.findings.map((f) => (
        <Panel key={f.control.id} pad={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-sm"><span className="font-semibold tabular">{f.control.id}</span> <span className="text-muted">{f.control.title}</span></p>
            <div className="flex items-center gap-2"><EvBadge s={f.status} /><span className="text-xs text-muted">{f.confidence} confidence</span></div>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-ok">Found in the document</p>
              <ul className="space-y-2.5">{f.matched.map((m) => (
                <li key={m.id} className="text-sm"><span className="font-medium">{m.label}</span>
                  <span className="ml-1.5 text-xs text-muted">({m.kind === 'design' ? 'written rule' : 'proof of operation'})</span>
                  <p className="mt-0.5 border-l-2 border-line pl-2 text-xs italic text-muted">{m.excerpt}</p></li>
              ))}</ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-bad">Missing or unclear</p>
              <ul className="space-y-1.5">{f.missing.map((m) => (
                <li key={m.id} className="text-sm">{m.label} <span className="text-xs text-muted">({m.kind === 'design' ? 'not written' : 'no proof it runs'})</span></li>
              ))}</ul>
            </div>
          </div>
        </Panel>
      ))}

      {res.weakSignals.length > 0 && (
        <Notice>Mentioned, but not enough to count: {res.weakSignals.map((w) => `${w.control.id} ${w.control.title} (${w.label.toLowerCase()})`).join('; ')}.</Notice>
      )}

      {applied === null ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <p className="mr-auto text-sm text-muted">A person validates every finding before it changes the control register.</p>
          <Button variant="ghost" onClick={onDiscard}>Discard</Button>
          <Button onClick={onApply} disabled={!canEdit || !res.findings.length}>Validate and apply to controls</Button>
        </div>
      ) : (
        <Panel title="Applied to the control register">
          {applied.length ? (
            <ul className="space-y-2">{applied.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 text-sm"><span>{c.title}</span>
                <span className="tabular"><span className="text-muted line-through">{c.before}</span> <b>{c.after}</b><span className="text-muted">/25 residual risk</span></span></li>
            ))}</ul>
          ) : <p className="text-sm text-muted">No residual risk changed: the controls already had equal or better evidence.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="warn">Risk is reduced only a little: a policy is not proof that MFA or reviews actually happen.</Badge>
          </div>
          <Button className="mt-4" onClick={() => go('/fix-first')}>See what to fix first</Button>
        </Panel>
      )}
    </div>
  );
}
