import { useMemo } from 'react';
import { Building2, Users, Landmark, HandCoins } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import { BranchPerformanceCard, RegionCard } from '../charts/ChartCards';
import { useFilters } from '../context/FilterContext';
import { useDrill } from '../context/DrillContext';
import { branchStats } from '../utils/analytics';
import { sum } from '../utils/aggregate';
import { branchColumns } from '../data/tableColumns';

export default function Branches() {
  const { view } = useFilters();
  const { openBranch } = useDrill();
  const stats = useMemo(() => branchStats(view), [view]);
  const columns = useMemo(() => branchColumns({ openBranch }), [openBranch]);
  return (
    <>
      <PageHeader title="Branch Analytics" subtitle="Compare branches on deposits, loans, customers and activity" />
      <section className="kpi-grid kpi-grid--4">
        <KpiCard label="Branches" value={stats.length} icon={Building2} />
        <KpiCard label="Deposits" value={sum(stats, (b) => b.deposits)} format="inr" icon={Landmark} />
        <KpiCard label="Loans outstanding" value={sum(stats, (b) => b.loans)} format="inr" icon={HandCoins} />
        <KpiCard label="Customers served" value={sum(stats, (b) => b.customers)} icon={Users} hint="Sum of distinct customers per branch" />
      </section>
      <div className="grid grid--2-1">
        <BranchPerformanceCard top={12} />
        <RegionCard />
      </div>
      <DataTable
        title="Branches"
        subtitle="Click a row to open branch details"
        rows={stats}
        columns={columns}
        rowKey={(r) => r.Branch_ID}
        onRowClick={(r) => openBranch(r.Branch_ID)}
        exportName="branches"
        initialSort={{ key: 'dep', dir: 'desc' }}
        searchPlaceholder="Search branch, city, manager…"
      />
    </>
  );
}
