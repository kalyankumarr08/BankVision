import { useMemo } from 'react';
import { Download, FileDown, Printer } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import InsightCard from '../components/InsightCard';
import EmptyState from '../components/EmptyState';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { branchStats, computeKpis, customerBalances, loanAnalysis } from '../utils/analytics';
import { buildInsights } from '../utils/insights';
import { buildReportHtml } from '../utils/report';
import { describeFilters } from '../utils/filters';
import { downloadFile, stamp, toCSV } from '../utils/csv';
import { inr, inrCompact, num, pct } from '../utils/format';
import { accountColumns, branchColumns, customerColumns, loanColumns, transactionColumns } from '../data/tableColumns';

export default function Reports() {
  const { model } = useData();
  const { view, filters } = useFilters();
  const kpis = useMemo(() => computeKpis(view, model.endMonth), [view, model]);
  const stats = useMemo(() => branchStats(view), [view]);
  const insights = useMemo(() => buildInsights(view, stats), [view, stats]);
  const loanRows = useMemo(() => loanAnalysis(view.loans), [view]);
  const active = describeFilters(filters, model);

  const datasets = [
    ['Customers', view.customers, customerColumns({ balances: customerBalances(view.accounts) })],
    ['Accounts', view.accounts, accountColumns()],
    ['Transactions', view.transactions, transactionColumns()],
    ['Loans', view.loans, loanColumns()],
    ['Branches', stats, branchColumns()],
  ];
  const exportCsv = (name, rows, cols) =>
    downloadFile(`${name.toLowerCase()}-${stamp()}.csv`, toCSV(rows, cols.map((c) => ({ label: c.label, accessor: c.csv ?? c.accessor }))));
  const downloadReport = () =>
    downloadFile(`bankvision-report-${stamp()}.html`, buildReportHtml({ filters: active, kpis, insights, loans: loanRows, branches: [...stats].sort((a, b) => b.deposits - a.deposits).slice(0, 10) }), 'text/html;charset=utf-8');
  const fmt = (k) => (k.format === 'inr' ? inrCompact(k.value) : k.format === 'pct' ? pct(k.value) : num(k.value));

  return (
    <>
      <PageHeader
        title="Reports & Exports"
        subtitle="Everything below respects the active filters"
        actions={
          <>
            <button type="button" className="btn btn--primary" onClick={downloadReport}><FileDown size={15} aria-hidden="true" /> Download report</button>
            <button type="button" className="btn btn--ghost" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /> Print dashboard</button>
          </>
        }
      />
      <section className="card" aria-label="Applied filters">
        <h3>Applied filters</h3>
        {active.length ? (
          <div className="chips">{active.map(([k, v]) => <span key={k} className="pill">{k}: {v}</span>)}</div>
        ) : <p className="muted">No filters applied — reports cover the complete dataset.</p>}
      </section>

      <section className="card" aria-label="Summary">
        <h3>Summary metrics</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Metric</th><th scope="col" className="num">Value</th><th scope="col">Definition</th></tr></thead>
            <tbody>{kpis.map((k) => <tr key={k.key}><td>{k.label}</td><td className="num">{fmt(k)}</td><td className="muted">{k.hint}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-label="CSV exports">
        <h2 className="section-title">Export filtered data (CSV)</h2>
        <div className="grid grid--3">
          {datasets.map(([name, rows, cols]) => (
            <article key={name} className="card export-card">
              <div>
                <h4>{name}</h4>
                <p className="muted">{num(rows.length)} rows in the current view</p>
              </div>
              <button type="button" className="btn btn--ghost" disabled={!rows.length} onClick={() => exportCsv(name, rows, cols)}>
                <Download size={15} aria-hidden="true" /> Export CSV
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card" aria-label="Loan portfolio">
        <h3>Loan portfolio by type</h3>
        {loanRows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">Loan type</th><th scope="col" className="num">Loans</th><th scope="col" className="num">Amount</th><th scope="col" className="num">Approval</th><th scope="col" className="num">Rejection</th></tr></thead>
              <tbody>{loanRows.map((l) => <tr key={l.name}><td>{l.name}</td><td className="num">{num(l.count)}</td><td className="num">{inr(l.amount)}</td><td className="num">{pct(l.approvalRate)}</td><td className="num">{pct(l.rejectionRate)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState compact />}
      </section>

      <section aria-label="Key insights">
        <h2 className="section-title">Key Insights</h2>
        {insights.length ? <div className="grid grid--3">{insights.map((i) => <InsightCard key={i.id} title={i.title} text={i.text} />)}</div> : <div className="card"><EmptyState compact /></div>}
      </section>
    </>
  );
}
