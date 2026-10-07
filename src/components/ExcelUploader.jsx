import { useRef, useState } from 'react';
import { AlertTriangle, Check, FolderUp, Loader2, Lock, Upload } from 'lucide-react';
import { useUpload, UPLOAD_STEPS } from '../context/UploadContext';
import { formatBytes, MAX_FILE_BYTES, RECOMMENDED_BYTES } from '../utils/excelParser';

/** Hidden file input + trigger. Used by the drop zone and by "Upload another file". */
export function UploadButton({ children, className = 'btn btn--ghost', icon = true }) {
  const { upload } = useUpload();
  const input = useRef(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) upload(file);
        }}
      />
      <button type="button" className={className} onClick={() => input.current?.click()}>
        {icon && <Upload size={15} aria-hidden="true" />} {children}
      </button>
    </>
  );
}

function Progress({ file, stage }) {
  return (
    <div className="card dropzone dropzone--busy" role="status" aria-live="polite">
      <Loader2 className="spin" size={30} aria-hidden="true" />
      <h2>Analyzing Excel…</h2>
      {file && <p className="muted">{file.name} · {formatBytes(file.size)}</p>}
      <ol className="steps">
        {UPLOAD_STEPS.map((label, i) => {
          const state = i < stage ? 'done' : i === stage ? 'active' : 'todo';
          return (
            <li key={label} className={`steps__item steps__item--${state}`}>
              {state === 'done' ? <Check size={15} aria-hidden="true" /> : state === 'active' ? <Loader2 className="spin" size={15} aria-hidden="true" /> : <span className="steps__dot" aria-hidden="true" />}
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Large import card: drag & drop, error and loading states. */
export default function ExcelUploader() {
  const { status, stage, file, error, upload } = useUpload();
  const [over, setOver] = useState(false);

  if (status === 'processing') return <Progress file={file} stage={stage} />;

  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) upload(dropped);
  };

  return (
    <section
      className={`card dropzone${over ? ' is-over' : ''}${status === 'error' ? ' dropzone--error' : ''}`}
      aria-label="Import banking dataset"
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }}
      onDrop={onDrop}
    >
      {status === 'error' && (
        <div className="dropzone__error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>{error?.title}</strong>
            <p>{error?.message}</p>
          </div>
        </div>
      )}
      <span className="dropzone__icon" aria-hidden="true"><FolderUp size={30} /></span>
      <h2>Import Banking Dataset</h2>
      <p className="muted dropzone__lead">Upload an Excel file to automatically analyze and visualize your banking data.</p>
      <div className="dropzone__drag" aria-hidden="true">Drag &amp; drop an Excel file here <span>or</span></div>
      <UploadButton className="btn btn--primary btn--lg">Choose Excel File</UploadButton>
      <p className="muted small">Supported: .xlsx, .xls · Recommended size up to {formatBytes(RECOMMENDED_BYTES)} (limit {formatBytes(MAX_FILE_BYTES)})</p>
      <p className="privacy"><Lock size={13} aria-hidden="true" /> Your Excel data is processed locally in your browser.</p>
    </section>
  );
}
