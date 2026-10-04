import { useState } from 'react';
import { Filter, RotateCcw, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';

function Select({ id, label, value, onChange, options, all }) {
  return (
    <div className="field">
      <label htmlFor={`f-${id}`}>{label}</label>
      <select id={`f-${id}`} value={value} onChange={(e) => onChange(id, e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => {
          const [v, text] = Array.isArray(o) ? o : [o, o];
          return <option key={v} value={v}>{text}</option>;
        })}
      </select>
    </div>
  );
}

/** Global filters. Selections apply instantly; "Apply" simply closes the panel on small screens. */
export default function FilterBar() {
  const { model } = useData();
  const { filters: f, setFilter, reset, activeCount } = useFilters();
  const [open, setOpen] = useState(false);
  const o = model.options;

  const cities = f.state ? o.cityByState[f.state] ?? [] : o.cities;
  const branches = model.branches
    .filter((b) => (!f.state || b.State === f.state) && (!f.city || b.City === f.city))
    .map((b) => [b.Branch_ID, b.Branch_Name])
    .sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <section className="filterbar card" aria-label="Filters">
      <div className="filterbar__top">
        <button type="button" className="btn btn--ghost filterbar__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="filter-panel">
          <Filter size={15} aria-hidden="true" /> Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
        <span className="filterbar__title"><Filter size={15} aria-hidden="true" /> Filters{activeCount ? <span className="pill">{activeCount} active</span> : null}</span>
        <button type="button" className="btn btn--ghost" onClick={reset} disabled={!activeCount}>
          <RotateCcw size={15} aria-hidden="true" /> Reset Filters
        </button>
      </div>
      <div id="filter-panel" className={`filterbar__panel${open ? ' is-open' : ''}`}>
        <div className="field">
          <label htmlFor="f-from">From date</label>
          <input id="f-from" type="date" value={f.from} min={o.dateMin} max={f.to || o.dateMax} onChange={(e) => setFilter('from', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-to">To date</label>
          <input id="f-to" type="date" value={f.to} min={f.from || o.dateMin} max={o.dateMax} onChange={(e) => setFilter('to', e.target.value)} />
        </div>
        <Select id="state" label="State" value={f.state} onChange={setFilter} options={o.states} all="All states" />
        <Select id="city" label="City" value={f.city} onChange={setFilter} options={cities} all="All cities" />
        <Select id="branch" label="Branch" value={f.branch} onChange={setFilter} options={branches} all="All branches" />
        <Select id="accountType" label="Account type" value={f.accountType} onChange={setFilter} options={o.accountTypes} all="All types" />
        <Select id="segment" label="Customer segment" value={f.segment} onChange={setFilter} options={o.segments} all="All segments" />
        <Select id="gender" label="Gender" value={f.gender} onChange={setFilter} options={o.genders} all="All" />
        <Select id="loanType" label="Loan type" value={f.loanType} onChange={setFilter} options={o.loanTypes} all="All loan types" />
        <Select id="txnType" label="Transaction type" value={f.txnType} onChange={setFilter} options={o.txnTypes} all="All types" />
        <button type="button" className="btn btn--primary filterbar__apply" onClick={() => setOpen(false)}>
          <Check size={15} aria-hidden="true" /> Apply Filters
        </button>
      </div>
      <p className="filterbar__note muted">Date range applies to transactions and loan applications; account and customer figures are current snapshots.</p>
    </section>
  );
}
