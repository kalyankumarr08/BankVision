import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock, RotateCcw, SearchX } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ExcelUploader from '../components/ExcelUploader';
import DatasetSummary from '../components/DatasetSummary';
import DataQuality from '../components/DataQuality';
import DataSourceBar from '../components/DataSourceBar';
import DynamicFilters from '../components/DynamicFilters';
import DynamicKPI from '../components/DynamicKPI';
import AutoChartGrid from '../components/AutoChartGrid';
import InsightsPanel from '../components/InsightsPanel';
import DatasetPreview from '../components/DatasetPreview';
import { useUpload } from '../context/UploadContext';
import { applyFilters } from '../utils/dataAnalysis';
import { primaryDate } from '../utils/chartRecommendation';

/** Dashboard generated entirely from the uploaded sheet; filters here are local to this page. */
function Analytics({ dataset }) {
  const { columns, rows, entity, singular } = dataset;
  const dateCols = useMemo(() => columns.filter((c) => c.type === 'date'), [columns]);
  const initial = useMemo(() => ({ cats: {}, dateKey: primaryDate(columns)?.key ?? '', from: '', to: '' }), [columns]);
  const [filters, setFilters] = useState(initial);
  useEffect(() => setFilters(initial), [initial]); // new sheet / file → clean filters

  const change = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const activeCount = Object.values(filters.cats).filter(Boolean).length + (filters.from ? 1 : 0) + (filters.to ? 1 : 0);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  if (!rows.length) return <div className="card empty" role="status"><SearchX size={30} aria-hidden="true" /><p>This worksheet has no data rows. Select another sheet or upload a different file.</p></div>;

  return (
    <>
      <DataQuality issues={dataset.issues} />
      <DynamicFilters dataset={dataset} filters={filters} onChange={change} onReset={() => setFilters(initial)} dateCols={dateCols} activeCount={activeCount} />
      {filtered.length === 0 ? (
        <div className="card empty" role="status">
          <SearchX size={30} aria-hidden="true" />
          <p>No rows match the selected filters.</p>
          <button type="button" className="btn btn--ghost" onClick={() => setFilters(initial)}><RotateCcw size={15} aria-hidden="true" /> Reset Filters</button>
        </div>
      ) : (
        <>
          <p className="muted small rows-note" role="status">Showing {filtered.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')} rows.</p>
          <DynamicKPI rows={filtered} columns={columns} entity={entity} singular={singular} />
          <AutoChartGrid columns={columns} rows={filtered} entity={entity} singular={singular} />
          <InsightsPanel rows={filtered} columns={columns} entity={entity} singular={singular} />
          <DatasetPreview columns={columns} rows={filtered} totalRows={rows.length} />
        </>
      )}
    </>
  );
}

export default function ExcelImport() {
  const { status, dataset, switching, compatible } = useUpload();
  const ready = status === 'ready';
  return (
    <>
      <PageHeader
        title="Excel Import"
        subtitle="Upload a workbook and BankVision detects the columns and builds KPIs, filters, charts and insights automatically"
      />
      <p className="privacy privacy--page"><Lock size={14} aria-hidden="true" /> Your Excel data is processed locally in your browser. Nothing is uploaded to a server.</p>
      {ready && <DataSourceBar onImportPage />}
      {!ready && <ExcelUploader />}
      {ready && <DatasetSummary />}
      {ready && compatible && <p className="note"><Link to="/">Open the main Dashboard</Link> to explore this workbook with BankVision’s built-in analytics.</p>}
      {ready && switching && <div className="card empty" role="status"><Loader2 className="spin" size={26} aria-hidden="true" /><p>Analyzing sheet…</p></div>}
      {ready && !switching && dataset && <Analytics key={dataset.sheetName} dataset={dataset} />}
    </>
  );
}
