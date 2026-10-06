import { Badge, PageHeader, Panel, SOURCE } from '../components/ui';
import { LEGAL_DISCLAIMER } from '../data/legal';
import type { SourceStatus } from '../engine/types';

const THREATS: [string, string, string][] = [
  ['Malicious uploads', 'Files are parsed in the browser and never uploaded. Magic-byte check, 5 MB and 40-page limits, pdf.js with eval disabled.', 'Server-side: isolated parsing worker, antivirus (ClamAV), content disarm, object storage with no execute.'],
  ['Prompt injection in documents', 'Analysis is deterministic. Instruction-like sentences are detected, shown to the user, and excluded from scoring.', 'LLM calls receive documents as quoted data with a fixed schema; output is validated and needs human approval.'],
  ['Cross-tenant data leakage', 'Single demo tenant; data lives only in the visitor\'s browser.', 'Every row carries tenant_id; PostgreSQL row-level security plus tenant-scoped queries; isolation tests in CI.'],
  ['Broken access control / privilege escalation', 'Role switcher previews the UI; edit actions are disabled outside the analyst role.', 'Server-side RBAC on every endpoint, deny by default, permission tests per role.'],
  ['XSS', 'React escapes output; no dangerouslySetInnerHTML; user text inputs strip angle brackets and are length-limited.', 'Strict Content-Security-Policy, Trusted Types.'],
  ['SQL injection', 'No database in the demo.', 'Parameterised queries through an ORM only.'],
  ['SSRF', 'The app makes no server-side requests.', 'No user-supplied URLs fetched server-side; egress allow-list.'],
  ['Credential theft', 'No accounts in the public demo.', 'Passwordless or MFA login, short-lived session cookies (HttpOnly, Secure, SameSite), rate limiting.'],
  ['Tampered passport', 'SHA-256 of the assessed data is shown on every passport.', 'Server-signed passports with a public verification page.'],
];

export function MethodPage() {
  return (
    <>
      <PageHeader title="Method and security" intro="How results are calculated, where legal data comes from, and how the product protects your data." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="What is decided by code, and what is not">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li><b>Deterministic rules:</b> applicability, risk scores, priorities, permissions and every status. Same input, same output.</li>
            <li><b>Assisted analysis:</b> reading documents and proposing which controls they support. A person validates before anything changes.</li>
            <li><b>Never:</b> a statement that you are "compliant". Results read "based on the information provided, this appears satisfied".</li>
          </ul>
        </Panel>
        <Panel title="Formulas">
          <ul className="space-y-2 text-sm leading-relaxed">
            <li><b>Cybersecurity maturity</b> = Σ(weight × answer) / Σ(weight) × 100. Yes 1, partly 0.5, no 0.</li>
            <li><b>Risk</b>: inherent = likelihood × impact. Residual = inherent × (1 − mean control effectiveness). Effectiveness comes only from evidence: supported 60%, partial 20%, none 0%.</li>
            <li><b>Priority</b> = risk reduction weighted by current severity × (1 + 0.15 × legal links) / (effort × cost).</li>
            <li><b>ISO 27001 control readiness</b> = (supported + 0.5 × partial) / controls in scope. An indicator, not an audit opinion.</li>
          </ul>
        </Panel>
        <Panel title="Legal data quality">
          <p className="text-sm leading-relaxed">Every requirement records its jurisdiction, instrument, reference (only when verified), our own plain-language summary, the applicability condition, source URL, date checked, confidence and whether professional review is needed. Moroccan article numbers are left blank until checked against the Bulletin Officiel.</p>
          <div className="mt-4 flex flex-wrap gap-2">{(Object.keys(SOURCE) as SourceStatus[]).map((s) => <Badge key={s} tone={SOURCE[s].tone}>{SOURCE[s].label}</Badge>)}</div>
        </Panel>
        <Panel title="Disclaimer">
          <p className="text-sm leading-relaxed">{LEGAL_DISCLAIMER}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">ISO/IEC 27001 control identifiers are used for mapping only; control titles are our own summaries. NIST CSF 2.0 categories are public. AtlasTech and all its documents are fictional.</p>
        </Panel>
      </div>
      <h2 className="mb-3 mt-10 text-lg font-semibold">Threat model</h2>
      <div className="scroll-x rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line bg-sunken/60"><tr><th className="px-4 py-2.5 text-left text-xs font-medium text-muted">Threat</th><th className="px-4 py-2.5 text-left text-xs font-medium text-muted">In this MVP</th><th className="px-4 py-2.5 text-left text-xs font-medium text-muted">Production design</th></tr></thead>
          <tbody className="divide-y divide-line">{THREATS.map(([t, m, p]) => <tr key={t}><td className="px-4 py-3 font-medium">{t}</td><td className="px-4 py-3">{m}</td><td className="px-4 py-3 text-muted">{p}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
