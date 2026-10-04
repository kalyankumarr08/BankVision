import { useMemo } from 'react';
import { HandCoins, Banknote, ShieldCheck, AlertOctagon, Percent } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import { LoanAnalysisCards, LoanGrowthCard, LoanStatusCard } from '../charts/ChartCards';
import { useFilters } from '../context/FilterContext';
import { useDrill } from '../context/DrillContext';
import { isLiveLoan, isSanctioned } from '../data/schema';
import { approvalStats } from '../utils/analytics';
import { avgValid, share, sum } from '../utils/aggregate';
import { loanColumns } from '../data/tableColumns';

export default function Loans() {
  const { view } = useFilters();
  const { openLoan, openCustomer } = useDrill();
  const columns = useMemo(() => loanColumns({ openLoan, openCustomer }), [openLoan, openCustomer]);
  const s = approvalStats(view.loans);
  const settled = view.loans.filter((l) => ['Approved', 'Closed', 'Defaulted'].includes(l.Loan_Status));
  return (
    <>
      <PageHeader title="Loan Analytics" subtitle="Portfolio growth, demand and approvals" />
      <section className="kpi-grid">
        <KpiCard label="Applications" value={view.loans.length} icon={HandCoins} />
        <KpiCard label="Sanctioned amount" value={sum(view.loans.filter(isSanctioned), (l) => l.Loan_Amount)} format="inr" icon={Banknote} hint="Loan amount of Approved, Closed and Defaulted loans" />
        <KpiCard label="Outstanding" value={sum(view.loans.filter(isLiveLoan), (l) => l.Outstanding_Amount)} format="inr" icon={Banknote} hint="Approved and Defaulted loans" />
        <KpiCard label="Approval rate" value={s.approvalRate} format="pct" icon={ShieldCheck} hint="Approved ÷ decided (Pending excluded)" />
        <KpiCard label="Default rate" value={share(settled.filter((l) => l.Loan_Status === 'Defaulted').length, settled.length)} format="pct" icon={AlertOctagon} hint="Defaulted ÷ settled loans (Approved + Closed + Defaulted)" />
        <KpiCard label="Avg interest rate" value={avgValid(view.loans, (l) => l.Interest_Rate)} format="pct" icon={Percent} />
      </section>
      <div className="grid grid--2-1"><LoanGrowthCard /><LoanStatusCard /></div>
      <div className="grid grid--2"><LoanAnalysisCards /></div>
      <DataTable
        title="Loans"
        subtitle="Click a row to open loan details"
        rows={view.loans}
        columns={columns}
        rowKey={(r) => r.Loan_ID}
        onRowClick={(r) => openLoan(r.Loan_ID)}
        exportName="loans"
        searchPlaceholder="Search loan ID, customer, type…"
        quickFilters={[{ label: 'statuses', accessor: (r) => r.Loan_Status, options: ['Approved', 'Pending', 'Rejected', 'Closed', 'Defaulted'] }]}
      />
    </>
  );
}
