import { CheckCircle2, FileSpreadsheet, Loader2, Trash2, TriangleAlert } from 'lucide-react';
import { UploadButton } from './ExcelUploader';
import { useUpload } from '../context/UploadContext';
import { formatBytes } from '../utils/excelParser';
import { num } from '../utils/format';

export default function DatasetSummary() {
  const { file, sheets, active, dataset, selectSheet, remove, switching, compatible } = useUpload();
  const totalRows = sheets.reduce((s, x) => s + x.rowCount, 0);
  const cur = sheets.find((s) => s.name === active);
  const usedCols = dataset ? dataset.columns.filter((c) => c.type !== 'empty').length : cur?.colCount ?? 0;

  return (
    <section className="card summary" aria-label="Uploaded dataset">
      <div className="summary__file">
        <span className="summary__icon" aria-hidden="true"><FileSpreadsheet size={22} /></span>
        <div className="summary__name">
          <strong title={file.name}>{file.name}</strong>
          <span className="muted">{formatBytes(file.size)}</span>
          <span className="ok-inline"><CheckCircle2 size={14} aria-hidden="true" /> Dataset successfully loaded</span>
        </div>
        <div className="summary__actions">
          <UploadButton>Upload another file</UploadButton>
          <button type="button" className="btn btn--ghost" onClick={remove}><Trash2 size={15} aria-hidden="true" /> Remove file</button>
        </div>
      </div>

      <dl className="summary__stats">
        <div><dt>Worksheets</dt><dd>{num(sheets.length)}</dd></div>
        <div><dt>Rows (this sheet)</dt><dd>{num(cur?.rowCount ?? 0)}</dd></div>
        <div><dt>Columns (this sheet)</dt><dd>{num(usedCols)}</dd></div>
        <div><dt>Rows (workbook)</dt><dd>{num(totalRows)}</dd></div>
      </dl>

      {compatible && <p className="note note--ok">This workbook matches the BankVision schema, so the main dashboards (Dashboard, Customers, Accounts…) now use it too.</p>}

      <div className="sheets" role="group" aria-label="Dataset sheets">
        <h3>Dataset Sheets {switching && <Loader2 className="spin" size={14} aria-label="Loading sheet" />}</h3>
        <ul>
          {sheets.map((s) => {
            const empty = s.rowCount === 0;
            return (
              <li key={s.name}>
                <button type="button" className={`sheet-btn${s.name === active ? ' is-active' : ''}`} aria-pressed={s.name === active} onClick={() => selectSheet(s.name)} disabled={switching}>
                  {empty ? <TriangleAlert size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                  <span className="sheet-btn__name">{s.name}</span>
                  <span className="sheet-btn__rows">{empty ? 'empty' : `${num(s.rowCount)} rows`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
