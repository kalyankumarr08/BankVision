import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from 'lucide-react';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { toCSV, downloadFile, stamp } from '../utils/csv';

/**
 * columns: [{ key, label, accessor(row), render?(row), align?, csv? }]
 * quickFilters: [{ label, accessor(row), options: [] }]
 */
export default function DataTable({ title, subtitle, rows, columns, rowKey, onRowClick, quickFilters = [], exportName, initialSort, searchPlaceholder = 'Search table…' }) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [sort, setSort] = useState(initialSort ?? null); // { key, dir }
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quick, setQuick] = useState({});

  const processed = useMemo(() => {
    let out = rows;
    quickFilters.forEach((q, i) => {
      if (quick[i]) out = out.filter((r) => q.accessor(r) === quick[i]);
    });
    const needle = deferred.trim().toLowerCase();
    if (needle) out = out.filter((r) => columns.some((c) => String(c.accessor(r) ?? '').toLowerCase().includes(needle)));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const dir = sort.dir === 'asc' ? 1 : -1;
        out = [...out].sort((a, b) => {
          const x = col.accessor(a);
          const y = col.accessor(b);
          if (x == null) return 1;
          if (y == null) return -1;
          return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true })) * dir;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, deferred, sort, quick, columns]);

  useEffect(() => setPage(1), [rows, deferred, sort, quick, pageSize]);

  const pageRows = processed.slice((page - 1) * pageSize, page * pageSize);
  const toggleSort = (key) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));

  const exportCsv = () =>
    downloadFile(`${exportName ?? 'table'}-${stamp()}.csv`, toCSV(processed, columns.map((c) => ({ label: c.label, accessor: c.csv ?? c.accessor }))));

  return (
    <section className="card table-card" aria-label={title}>
      <header className="card__head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <button type="button" className="btn btn--ghost" onClick={exportCsv} disabled={!processed.length}>
          <Download size={15} aria-hidden="true" /> Export CSV
        </button>
      </header>

      <div className="table-tools">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label={`Search ${title}`} />
        </label>
        {quickFilters.map((q, i) => (
          <select key={q.label} value={quick[i] ?? ''} onChange={(e) => setQuick((s) => ({ ...s, [i]: e.target.value }))} aria-label={`Filter by ${q.label}`}>
            <option value="">All {q.label}</option>
            {q.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ))}
      </div>

      {processed.length === 0 ? (
        <EmptyState message={rows.length ? 'No rows match your search.' : 'No data available for the selected filters.'} showReset={!rows.length} />
      ) : (
        <>
          <div className="table-wrap" tabIndex={0} role="region" aria-label={`${title} table, scrollable`}>
            <table className="table">
              <thead>
                <tr>
                  {columns.map((c) => {
                    const active = sort?.key === c.key;
                    return (
                      <th key={c.key} scope="col" className={c.align === 'right' ? 'num' : ''} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button type="button" className="th-btn" onClick={() => toggleSort(c.key)}>
                          {c.label}
                          {active ? sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ArrowUpDown size={13} className="dim" />}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr
                    key={rowKey(r)}
                    className={onRowClick ? 'is-click' : ''}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(r)) : undefined}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={c.align === 'right' ? 'num' : ''}>
                        {c.render ? c.render(r) : c.accessor(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={processed.length} onPage={setPage} onPageSize={setPageSize} />
        </>
      )}
    </section>
  );
}
