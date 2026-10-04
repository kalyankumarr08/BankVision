import { useMemo } from 'react';
import { Users, Landmark, HandCoins, ArrowLeftRight, Wallet, Percent, Printer, FileDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import InsightCard from '../components/InsightCard';
import EmptyState from '../components/EmptyState';
import { AccountMixCard, BranchPerformanceCard, DemographicsCards, DepositTrendCard, LoanAnalysisCards, LoanGrowthCard, TransactionsCard } from '../charts/ChartCards';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { computeKpis, branchStats, loanAnalysis } from '../utils/analytics';
import { buildInsights } from '../utils/insights';
import { buildReportHtml } from '../utils/report';
import { describeFilters } from '../utils/filters';
import { downloadFile, stamp } from '../utils/csv';

const ICONS = { customers: Users, deposits: Landmark, loans: HandCoins, txns: ArrowLeftRight, avg: Wallet, approval: Percent };

export default function Dashboard() {
  const { model } = useData();
  const { view, filters } = useFilters();
  const kpis = useMemo(() => computeKpis(view, model.endMonth), [view, model]);
  const stats = useMemo(() => branchStats(view), [view]);
  const insights = useMemo(() => buildInsights(view, stats), [view, stats]);
  const noData = !view.customers.length && !view.transactions.length && !view.loans.length;

  const downloadReport = () =>
    downloadFile(
      `bankvision-report-${stamp()}.html`,
      buildReportHtml({ filters: describeFilters(filters, model), kpis, insights, loans: loanAnalysis(view.loans), branches: [...stats].sort((a, b) => b.deposits - a.deposits).slice(0, 10) }),
      'text/html;charset=utf-8',
    );

  return (
    <>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Banking performance at a glance — every figure is calculated from the Excel dataset and the active filters"
        actions={
          <>
            <button type="button" className="btn btn--ghost" onClick={downloadReport}><FileDown size={15} aria-hidden="true" /> Download report</button>
            <button type="button" className="btn btn--ghost" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /> Print</button>
          </>
        }
      />
      {noData ? (
        <div className="card"><EmptyState /></div>
      ) : (
        <>
          <section className="kpi-grid" aria-label="Key performance indicators">
            {kpis.map((k) => <KpiCard key={k.key} {...k} icon={ICONS[k.key]} />)}
          </section>
          <div className="grid grid--2-1">
            <DepositTrendCard />
            <AccountMixCard />
          </div>
          <div className="grid grid--2-1">
            <LoanGrowthCard />
            <TransactionsCard />
          </div>
          <div className="grid grid--2-1">
            <BranchPerformanceCard />
            <div className="stack"><DemographicsCards only={['segment', 'gender']} /></div>
          </div>
          <div className="grid grid--2"><LoanAnalysisCards /></div>
          <section aria-label="Key insights">
            <h2 className="section-title">Key Insights</h2>
            {insights.length ? (
              <div className="grid grid--3">{insights.map((i) => <InsightCard key={i.id} title={i.title} text={i.text} />)}</div>
            ) : <div className="card"><EmptyState compact /></div>}
          </section>
        </>
      )}
    </>
  );
}
