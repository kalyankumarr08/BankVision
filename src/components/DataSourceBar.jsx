import { Link } from 'react-router-dom';
import { RotateCcw, Upload } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUpload } from '../context/UploadContext';
import { num } from '../utils/format';

/** "DATA SOURCE" indicator shown above every page: Demo Dataset (blue) or Uploaded Excel (green). */
export default function DataSourceBar({ onImportPage = false }) {
  const { kind, source } = useData();
  const up = useUpload();
  const uploaded = up.status === 'ready' && (kind === 'upload' || onImportPage);
  const totalRows = up.sheets.reduce((s, x) => s + x.rowCount, 0);
  return (
    <section className={`source card ${uploaded ? 'source--up' : 'source--demo'}`} aria-label="Data source">
      <span className="source__label">Data source</span>
      <span className="source__main">
        <i className="source__dot" aria-hidden="true" />
        {uploaded ? (
          <span><strong>Uploaded Excel</strong> <span className="muted">· {up.file.name} · {num(totalRows)} rows · {num(up.sheets.length)} sheet{up.sheets.length === 1 ? '' : 's'}</span></span>
        ) : (
          <span><strong>Demo Dataset</strong> <span className="muted">· {source.replace(' (bundled demo dataset)', '')}</span></span>
        )}
      </span>
      {up.status === 'ready' && !uploaded && <span className="muted small source__note">Your uploaded file is available in Excel Import.</span>}
      <span className="source__actions">
        {!onImportPage && <Link className="btn btn--ghost" to="/import"><Upload size={15} aria-hidden="true" /> {up.status === 'ready' ? 'View Excel Import' : 'Upload Excel'}</Link>}
        {up.status === 'ready' && <button type="button" className="btn btn--ghost" onClick={up.reset}><RotateCcw size={15} aria-hidden="true" /> Reset Dataset</button>}
      </span>
    </section>
  );
}
