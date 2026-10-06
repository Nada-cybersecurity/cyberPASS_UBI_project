import { lazy, Suspense } from 'react';
import { Shell } from './components/Shell';
import { Landing } from './pages/Landing';
import { ContextPage } from './pages/Context';
import { RequirementsPage } from './pages/Requirements';
import { FlowsPage } from './pages/Flows';
import { FixFirstPage } from './pages/FixFirst';
import { PassportPage } from './pages/Passport';
import { SupplierPage } from './pages/Supplier';
import { WorkspacePage } from './pages/Workspace';
import { MethodPage } from './pages/Method';
import { SettingsPage } from './pages/Settings';
import { useRoute } from './store';

// The evidence page pulls in pdf.js; load it on demand in the multi-file build.
const EvidencePage = lazy(() => import('./pages/Evidence'));

export function App() {
  const [path, go] = useRoute();
  if (path === '/') return <Landing go={go} />;
  const page: Record<string, JSX.Element> = {
    '/context': <ContextPage go={go} />,
    '/requirements': <RequirementsPage go={go} />,
    '/flows': <FlowsPage />,
    '/evidence': <EvidencePage go={go} />,
    '/fix-first': <FixFirstPage go={go} />,
    '/passport': <PassportPage go={go} />,
    '/supplier': <SupplierPage go={go} />,
    '/workspace': <WorkspacePage />,
    '/method': <MethodPage />,
    '/settings': <SettingsPage />,
  };
  return (
    <Shell path={path} go={go}>
      <Suspense fallback={<p className="text-sm text-muted">Loading the evidence analyser...</p>}>
        {page[path] ?? (
          <div className="py-20 text-center">
            <h1 className="text-xl font-semibold">This page does not exist</h1>
            <p className="mt-2 text-muted">Go back to the <a href="#/context">company context</a>.</p>
          </div>
        )}
      </Suspense>
    </Shell>
  );
}
