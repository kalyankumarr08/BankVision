import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import FilterBar from '../components/FilterBar';
import DataSourceBar from '../components/DataSourceBar';
import PageSkeleton from '../components/LoadingSkeleton';
import { useData } from '../context/DataContext';
import { FilterProvider } from '../context/FilterContext';
import { DrillProvider } from '../context/DrillContext';
import { AlertTriangle, RefreshCw, Upload } from 'lucide-react';

function LoadError({ message, onRetry }) {
  const { loadFile } = useData();
  const input = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const res = await loadFile(file);
    setUploadError(res.ok ? '' : res.error);
  };
  return (
    <div className="card error-card" role="alert">
      <AlertTriangle size={30} aria-hidden="true" />
      <h2>Unable to load banking data. Please check the dataset and try again.</h2>
      <p className="muted">{message}</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}><RefreshCw size={15} aria-hidden="true" /> Retry</button>
      <input ref={input} type="file" accept=".xlsx,.xls" hidden onChange={onFile} />
      <button type="button" className="btn btn--ghost" onClick={() => input.current?.click()}><Upload size={15} aria-hidden="true" /> Load a workbook</button>
      {uploadError && <p className="err-text">{uploadError}</p>}
    </div>
  );
}

function Shell({ children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('bankvision-sidebar') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { status } = useData();

  useEffect(() => localStorage.setItem('bankvision-sidebar', collapsed ? '1' : '0'), [collapsed]);
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className={`app${collapsed ? ' app--collapsed' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header onMenu={() => setMobileOpen(true)} ready={status === 'ready'} />
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
      <BottomNav onMenu={() => setMobileOpen(true)} />
    </div>
  );
}

export default function AppLayout() {
  const { status, error, reload } = useData();
  const { pathname } = useLocation();
  const onImport = pathname === '/import';
  return (
    <FilterProvider>
      <DrillProvider>
        <Shell>
          {status === 'error' ? (
            <LoadError message={error} onRetry={reload} />
          ) : status === 'loading' ? (
            <PageSkeleton />
          ) : (
            <>
              {!onImport && <DataSourceBar />}
              {!onImport && <FilterBar />}
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </>
          )}
        </Shell>
      </DrillProvider>
    </FilterProvider>
  );
}
