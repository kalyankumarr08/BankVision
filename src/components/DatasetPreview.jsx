import { useMemo } from 'react';
import DataTable from './DataTable';
import { fmtDate, num } from '../utils/format';

const TYPE_LABEL = { id: 'ID', text: 'Text', numeric: 'Numeric', category: 'Category', date: 'Date', empty: 'Empty' };

/** Searchable, sortable, paginated preview. Only one page of rows is ever rendered into the DOM. */
export default function DatasetPreview({ columns, rows, totalRows }) {
  const tableCols = useMemo(
    () =>
      columns
        .filter((c) => c.type !== 'empty')
        .map((c) => ({
          key: c.key,
          label: c.name,
          accessor: (r) => r[c.key],
          align: c.type === 'numeric' ? 'right' : undefined,
          render: (r) => {
            const v = r[c.key];
            if (v == null || v === '') return <span className="dim">—</span>;
            if (c.type === 'date') return fmtDate(v);
            if (c.type === 'numeric') return Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
            return String(v);
          },
          csv: (r) => r[c.key],
        })),
    [columns],
  );
  return (
    <section aria-label="Dataset preview">
      <h2 className="section-title">Dataset Preview</h2>
      <ul className="chips type-chips" aria-label="Detected column types">
        {columns.map((c) => (
          <li key={c.key} className={`type-chip type-chip--${c.type}`} title={`${c.name}: ${TYPE_LABEL[c.type]}${c.role ? ` (${c.role})` : ''}`}>
            <b>{c.name}</b><span>{TYPE_LABEL[c.type]}</span>
          </li>
        ))}
      </ul>
      <DataTable title="Uploaded data" subtitle={`${num(rows.length)}${rows.length !== totalRows ? ` of ${num(totalRows)}` : ''} rows`} rows={rows} columns={tableCols} rowKey={(r) => r.__i} exportName="uploaded-data" searchPlaceholder="Search all columns…" />
    </section>
  );
}
