import { Badge, PageHeader, Panel } from '../components/ui';
import { useStore } from '../store';

const USERS = [
  { n: 'Salma B.', r: 'Company admin', e: 'salma@atlastech.example' },
  { n: 'Youssef A.', r: 'GRC analyst', e: 'youssef@atlastech.example' },
  { n: 'Karim T.', r: 'Executive', e: 'karim@atlastech.example' },
  { n: 'External auditor', r: 'Auditor', e: 'audit@firm.example' },
  { n: 'Imane R.', r: 'Employee', e: 'imane@atlastech.example' },
];
const PERMS = ['Configure organisation and users', 'Edit context and assessment', 'Validate evidence', 'Edit risks and actions', 'View executive dashboard', 'View evidence and registers', 'Complete assigned tasks'];
const MATRIX: Record<string, boolean[]> = {
  'Super admin': [true, true, true, true, true, true, true],
  'Company admin': [true, true, false, false, true, true, true],
  'GRC analyst': [false, true, true, true, true, true, true],
  Executive: [false, false, false, false, true, false, false],
  Auditor: [false, false, false, false, true, true, false],
  Employee: [false, false, false, false, false, false, true],
};

export function SettingsPage() {
  const { ctx } = useStore();
  return (
    <>
      <PageHeader title="Organisation" intro="Users, roles and data handling for this tenant. In the public demo this page is illustrative; roles are enforced server-side in the target architecture." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tenant">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-muted">Organisation</dt><dd className="font-medium">{ctx.name}</dd></div>
            <div><dt className="text-xs text-muted">Tenant ID</dt><dd className="font-medium tabular">tnt_7f3a9c2e</dd></div>
            <div><dt className="text-xs text-muted">Data region</dt><dd className="font-medium">Browser only (demo)</dd></div>
            <div><dt className="text-xs text-muted">Evidence retention</dt><dd className="font-medium">Until you reset the demo</dd></div>
          </dl>
        </Panel>
        <Panel title="Users">
          <ul className="divide-y divide-line text-sm">{USERS.map((u) => (
            <li key={u.e} className="flex items-center justify-between gap-3 py-2"><span><span className="font-medium">{u.n}</span><span className="block text-xs text-muted">{u.e}</span></span><Badge tone="neutral">{u.r}</Badge></li>
          ))}</ul>
        </Panel>
      </div>
      <Panel title="Role permissions" className="mt-6" pad={false}>
        <div className="scroll-x"><table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line"><tr><th className="px-4 py-2.5 text-left text-xs font-medium text-muted">Role</th>{PERMS.map((p) => <th key={p} className="px-2 py-2.5 text-left text-xs font-medium text-muted">{p}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{Object.entries(MATRIX).map(([r, row]) => (
            <tr key={r}><td className="px-4 py-2.5 font-medium">{r}</td>{row.map((v, i) => <td key={i} className="px-2 py-2.5">{v ? <span className="text-ok">Allowed</span> : <span className="text-muted">No</span>}</td>)}</tr>
          ))}</tbody>
        </table></div>
      </Panel>
    </>
  );
}
