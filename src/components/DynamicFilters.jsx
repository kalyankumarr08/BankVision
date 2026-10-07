import { useMemo, useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { rankedCategories } from '../utils/chartRecommendation';
import { byType } from '../utils/dataAnalysis';

const MAX_FILTERS = 6;

/** Filters chosen from the detected columns: useful categories (2–30 values) and the main date column. */
export function filterColumns(columns) {
  return rankedCategories(columns).filter((c) => c.unique <= 30).slice(0, MAX_FILTERS);
}

export default function DynamicFilters({ dataset, filters, onChange, onReset, dateCols, activeCount }) {
  const { columns, rows } = dataset;
  const [open, setOpen] = useState(false);
  const cats = useMemo(() => filterColumns(columns), [columns]);
  const options = useMemo(() => {
    const o = {};
    for (const c of cats) {
      const set = new Set();
      for (const r of rows) if (r[c.key] != null) set.add(r[c.key]);
      o[c.key] = [...set].sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }));
    }
    return o;
  }, [cats, rows]);

  const dateCol = filters.dateKey;
  const range = useMemo(() => {
    if (!dateCol) return {};
    let min = '9999';
    let max = '0000';
    for (const r of rows) {
      const d = r[dateCol];
      if (d && d < min) min = d;
      if (d && d > max) max = d;
    }
    return max < min ? {} : { min, max };
  }, [rows, dateCol]);

  if (!cats.length && !dateCols.length) return null;
  return (
    <section className="filterbar card" aria-label="Dataset filters">
      <div className="filterbar__top">
        <button type="button" className="btn btn--ghost afilters__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="afilters-panel">
          <Filter size={15} aria-hidden="true" /> Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
        <span className="afilters__title"><Filter size={15} aria-hidden="true" /> Filters{activeCount ? <span className="pill">{activeCount} active</span> : null}</span>
        <button type="button" className="btn btn--ghost" onClick={onReset} disabled={!activeCount}><RotateCcw size={15} aria-hidden="true" /> Reset Filters</button>
      </div>
      <div id="afilters-panel" className={`afilters__panel${open ? ' is-open' : ''}`}>
        {dateCols.length > 1 && (
          <div className="field">
            <label htmlFor="af-datekey">Date field</label>
            <select id="af-datekey" value={dateCol} onChange={(e) => onChange({ dateKey: e.target.value, from: '', to: '' })}>
              {dateCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
        )}
        {dateCol && (
          <>
            <div className="field">
              <label htmlFor="af-from">From</label>
              <input id="af-from" type="date" value={filters.from} min={range.min} max={filters.to || range.max} onChange={(e) => onChange({ from: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="af-to">To</label>
              <input id="af-to" type="date" value={filters.to} min={filters.from || range.min} max={range.max} onChange={(e) => onChange({ to: e.target.value })} />
            </div>
          </>
        )}
        {cats.map((c) => (
          <div className="field" key={c.key}>
            <label htmlFor={`af-${c.key}`}>{c.label}</label>
            <select id={`af-${c.key}`} value={filters.cats[c.key] ?? ''} onChange={(e) => onChange({ cats: { ...filters.cats, [c.key]: e.target.value } })}>
              <option value="">All</option>
              {options[c.key].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

export const dateColumns = (columns) => byType(columns, 'date');
