import { useMemo } from 'react';
import { ArrowLeftRight, IndianRupee, CheckCircle2, Receipt } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import { DepositTrendCard, TransactionStatusCard, TransactionsCard } from '../charts/ChartCards';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { useDrill } from '../context/DrillContext';
import { avgValid, share, sum } from '../utils/aggregate';
import { transactionColumns } from '../data/tableColumns';

export default function Transactions() {
  const { model } = useData();
  const { view } = useFilters();
  const { openCustomer } = useDrill();
  const columns = useMemo(() => transactionColumns({ openCustomer }), [openCustomer]);
  const ok = view.transactions.filter((t) => t.Transaction_Status === 'Success');
  return (
    <>
      <PageHeader title="Transaction Analytics" subtitle="Volumes, channels and success rates" />
      <section className="kpi-grid kpi-grid--4">
        <KpiCard label="Transactions" value={view.transactions.length} icon={ArrowLeftRight} />
        <KpiCard label="Successful value" value={sum(ok, (t) => t.Amount)} format="inr" icon={IndianRupee} hint="Sum of amounts where status = Success" />
        <KpiCard label="Success rate" value={share(ok.length, view.transactions.length)} format="pct" icon={CheckCircle2} />
        <KpiCard label="Average ticket" value={avgValid(ok, (t) => t.Amount)} format="inr" icon={Receipt} hint="Mean successful transaction amount" />
      </section>
      <div className="grid grid--2-1"><TransactionsCard /><TransactionStatusCard /></div>
      <DepositTrendCard />
      <DataTable
        title="Transactions"
        subtitle="Click a row to open the customer"
        rows={view.transactions}
        columns={columns}
        rowKey={(r) => r.Transaction_ID}
        onRowClick={(r) => r.Customer_ID && openCustomer(r.Customer_ID)}
        exportName="transactions"
        initialSort={{ key: 'date', dir: 'desc' }}
        searchPlaceholder="Search ID, customer, channel…"
        quickFilters={[
          { label: 'types', accessor: (r) => r.Transaction_Type, options: model.options.txnTypes },
          { label: 'statuses', accessor: (r) => r.Transaction_Status, options: ['Success', 'Pending', 'Failed'] },
        ]}
      />
    </>
  );
}
