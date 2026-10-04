import { useMemo, useState } from 'react';
import ChartCard, { Segmented } from '../components/ChartCard';
import TrendChart from './TrendChart';
import BarsChart from './BarsChart';
import DonutChart from './DonutChart';
import { useFilters } from '../context/FilterContext';
import { useDrill } from '../context/DrillContext';
import { useTheme } from '../context/ThemeContext';
import { accountMix, accountStatus, branchStats, demographics, depositTrend, loanAnalysis, loanGrowth, loanStatusMix, regionStats, transactionMix } from '../utils/analytics';
import { inr, inrCompact, num, pct, signedPct } from '../utils/format';

const axisInr = (v) => inrCompact(v, 1).replace('.0 ', ' ');

export function DepositTrendCard() {
  const { view } = useFilters();
  const data = useMemo(() => depositTrend(view.transactionsAnyType), [view]);
  return (
    <ChartCard
      title="Deposit trend"
      subtitle="How are deposits changing over time? Successful deposit transactions per month"
      empty={!data.length}
      description={`Area chart of monthly deposit inflow across ${data.length} months.`}
    >
      <TrendChart
        data={data}
        series={[{ key: 'amount', name: 'Deposits', type: 'area' }]}
        axisFormat={axisInr}
        tooltipRows={(p) => [['Deposits', inr(p.amount)], ['Transactions', num(p.count)], ['Change vs prior month', p.change == null ? '—' : signedPct(p.change)]]}
      />
    </ChartCard>
  );
}

export function LoanGrowthCard() {
  const { view } = useFilters();
  const { palette } = useTheme();
  const data = useMemo(() => loanGrowth(view.loans), [view]);
  return (
    <ChartCard
      title="Loan growth"
      subtitle="Sanctioned loan amount (area) and number of loans (line) by application month"
      empty={!data.length}
      description={`Combined chart of monthly sanctioned loan amount and loan count across ${data.length} months.`}
    >
      <TrendChart
        data={data}
        series={[
          { key: 'amount', name: 'Loan amount', type: 'area', axis: 'left' },
          { key: 'count', name: 'Loans', type: 'line', axis: 'right', color: palette.series[3] },
        ]}
        axisFormat={axisInr}
        tooltipRows={(p) => [['Loan amount', inr(p.amount)], ['Number of loans', num(p.count)], ['Change vs prior month', p.change == null ? '—' : signedPct(p.change)]]}
      />
    </ChartCard>
  );
}

export function AccountMixCard() {
  const { view } = useFilters();
  const data = useMemo(() => accountMix(view.accounts), [view]);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Account distribution" subtitle="Share of deposits by account type (non-closed accounts)" empty={!data.length} description={`Donut chart of deposits split across ${data.length} account types.`}>
      <DonutChart data={data} formatValue={inrCompact} centerValue={inrCompact(total, 1)} centerLabel="Deposits" tooltipRows={(d, s) => [['Deposits', inr(d.value)], ['Accounts', num(d.count)], ['Share', pct(s)]]} />
    </ChartCard>
  );
}

export function AccountStatusCard() {
  const { view } = useFilters();
  const data = useMemo(() => accountStatus(view.accounts), [view]);
  return (
    <ChartCard title="Account status" subtitle="Are accounts active, dormant or closed?" empty={!data.length} description="Donut chart of accounts by status.">
      <DonutChart data={data} formatValue={num} centerValue={num(data.reduce((s, d) => s + d.value, 0))} centerLabel="Accounts" />
    </ChartCard>
  );
}

export function TransactionsCard() {
  const { view } = useFilters();
  const [by, setBy] = useState('Transaction_Type');
  const [metric, setMetric] = useState('count');
  const data = useMemo(() => transactionMix(view.transactions, by), [view, by]);
  return (
    <ChartCard
      title="Transactions"
      subtitle="How is activity distributed by type or channel?"
      empty={!data.length}
      description={`Bar chart of transaction ${metric} by ${by === 'Channel' ? 'channel' : 'type'}.`}
      actions={
        <>
          <Segmented label="Group by" value={by} onChange={setBy} options={[['Transaction_Type', 'Type'], ['Channel', 'Channel']]} />
          <Segmented label="Metric" value={metric} onChange={setMetric} options={[['count', 'Count'], ['amount', 'Value']]} />
        </>
      }
    >
      <BarsChart layout="horizontal" yWidth={96} data={data} bars={[{ key: metric, name: metric === 'count' ? 'Transactions' : 'Value' }]} axisFormat={metric === 'count' ? num : axisInr} tooltipRows={(d) => [['Transactions', num(d.count)], ['Value', inr(d.amount)]]} />
    </ChartCard>
  );
}

export function TransactionStatusCard() {
  const { view } = useFilters();
  const data = useMemo(() => transactionMix(view.transactions, 'Transaction_Status').map((d) => ({ name: d.name, value: d.count })), [view]);
  return (
    <ChartCard title="Transaction outcomes" subtitle="Share of successful, pending and failed transactions" empty={!data.length} description="Donut chart of transactions by status.">
      <DonutChart data={data} formatValue={num} centerValue={num(view.transactions.length)} centerLabel="Transactions" />
    </ChartCard>
  );
}

export function DemographicsCards({ only }) {
  const { view } = useFilters();
  const d = useMemo(() => demographics(view.customers), [view]);
  const empty = !view.customers.length;
  const bar = (data) => <BarsChart data={data} bars={[{ key: 'value', name: 'Customers' }]} axisFormat={num} tooltipRows={(x) => [['Customers', num(x.value)]]} height={240} />;
  const cards = {
    age: <ChartCard key="age" title="Age groups" subtitle="Which age bands dominate the customer base?" empty={empty} description="Bar chart of customers by age group.">{bar(d.age)}</ChartCard>,
    gender: <ChartCard key="gender" title="Gender" subtitle="Customer split by gender" empty={empty} description="Donut chart of customers by gender."><DonutChart data={d.gender} formatValue={num} centerValue={num(view.customers.length)} centerLabel="Customers" height={200} /></ChartCard>,
    segment: <ChartCard key="segment" title="Customer segment" subtitle="Customers by segment" empty={empty} description="Bar chart of customers by segment.">{bar(d.segment)}</ChartCard>,
    income: <ChartCard key="income" title="Income range" subtitle="Customers by income band" empty={empty} description="Bar chart of customers by income band.">{bar(d.income)}</ChartCard>,
  };
  return only.map((k) => cards[k]);
}

export function LoanAnalysisCards() {
  const { view } = useFilters();
  const data = useMemo(() => loanAnalysis(view.loans), [view]);
  return (
    <>
      <ChartCard title="Loan demand by type" subtitle="Which loan type has the highest demand? Total loan amount" empty={!data.length} description="Bar chart of total loan amount by loan type.">
        <BarsChart data={data} bars={[{ key: 'amount', name: 'Loan amount' }]} axisFormat={axisInr} tooltipRows={(d) => [['Total amount', inr(d.amount)], ['Number of loans', num(d.count)], ['Outstanding', inr(d.outstanding)]]} />
      </ChartCard>
      <ChartCard title="Approval vs rejection" subtitle="Share of decided applications by loan type (Pending excluded)" empty={!data.length} description="Grouped bar chart of approval and rejection rates by loan type.">
        <BarsChart data={data} bars={[{ key: 'approvalRate', name: 'Approval rate' }, { key: 'rejectionRate', name: 'Rejection rate' }]} axisFormat={(v) => `${v}%`} tooltipRows={(d) => [['Approval rate', pct(d.approvalRate)], ['Rejection rate', pct(d.rejectionRate)], ['Loans', num(d.count)]]} />
      </ChartCard>
    </>
  );
}

export function LoanStatusCard() {
  const { view } = useFilters();
  const data = useMemo(() => loanStatusMix(view.loans), [view]);
  return (
    <ChartCard title="Loan status" subtitle="Portfolio by application / repayment status" empty={!data.length} description="Donut chart of loans by status.">
      <DonutChart data={data} formatValue={num} centerValue={num(view.loans.length)} centerLabel="Loans" />
    </ChartCard>
  );
}

const METRICS = {
  deposits: ['Deposits', inrCompact, axisInr, inr],
  loans: ['Loans outstanding', inrCompact, axisInr, inr],
  customers: ['Customers', num, num, num],
  transactions: ['Transactions', num, num, num],
};

export function BranchPerformanceCard({ top = 10 }) {
  const { view } = useFilters();
  const { openBranch } = useDrill();
  const [metric, setMetric] = useState('deposits');
  const stats = useMemo(() => branchStats(view), [view]);
  const data = useMemo(() => [...stats].sort((a, b) => b[metric] - a[metric]).slice(0, top).filter((b) => b[metric] > 0).map((b) => ({ ...b, name: b.Branch_Name })), [stats, metric, top]);
  const [label, , axis, full] = METRICS[metric];
  return (
    <ChartCard
      title="Branch performance"
      subtitle={`Top ${top} branches by ${label.toLowerCase()} — click a bar for branch details`}
      empty={!data.length}
      description={`Horizontal bar chart ranking branches by ${label}.`}
      actions={<Segmented label="Ranking metric" value={metric} onChange={setMetric} options={[['deposits', 'Deposits'], ['loans', 'Loans'], ['customers', 'Customers'], ['transactions', 'Txns']]} />}
    >
      <BarsChart layout="horizontal" data={data} bars={[{ key: metric, name: label }]} axisFormat={axis} height={Math.max(260, data.length * 34 + 30)} yWidth={150} onBarClick={(d) => openBranch(d.Branch_ID)} tooltipRows={(d) => [[label, full(d[metric])], ['City', d.City], ['Manager', d.Manager]]} />
    </ChartCard>
  );
}

export function RegionCard() {
  const { view } = useFilters();
  const data = useMemo(() => regionStats(branchStats(view)), [view]);
  return (
    <ChartCard title="Regional comparison" subtitle="Deposits vs loans outstanding by region" empty={!data.length} description="Grouped bar chart of deposits and loans by region.">
      <BarsChart data={data} bars={[{ key: 'deposits', name: 'Deposits' }, { key: 'loans', name: 'Loans outstanding' }]} axisFormat={axisInr} tooltipRows={(d) => [['Deposits', inr(d.deposits)], ['Loans outstanding', inr(d.loans)]]} />
    </ChartCard>
  );
}
