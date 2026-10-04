import { useMemo } from 'react';
import { Landmark, Wallet, PauseCircle, PiggyBank } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import { AccountMixCard, AccountStatusCard } from '../charts/ChartCards';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { useDrill } from '../context/DrillContext';
import { isActiveAccount } from '../data/schema';
import { avgValid, share, sum } from '../utils/aggregate';
import { accountColumns } from '../data/tableColumns';

export default function Accounts() {
  const { model } = useData();
  const { view } = useFilters();
  const { openCustomer, openBranch } = useDrill();
  const columns = useMemo(() => accountColumns({ openCustomer, openBranch }), [openCustomer, openBranch]);
  const active = view.accounts.filter(isActiveAccount);
  return (
    <>
      <PageHeader title="Account Analytics" subtitle="Deposit base, account mix and account health" />
      <section className="kpi-grid kpi-grid--4">
        <KpiCard label="Active accounts" value={active.length} icon={Landmark} hint="Accounts that are not closed" />
        <KpiCard label="Total deposits" value={sum(active, (a) => a.Balance)} format="inr" icon={PiggyBank} />
        <KpiCard label="Average balance" value={avgValid(active, (a) => a.Balance)} format="inr" icon={Wallet} />
        <KpiCard label="Dormant accounts" value={share(view.accounts.filter((a) => a.Account_Status === 'Dormant').length, view.accounts.length)} format="pct" icon={PauseCircle} hint="Dormant ÷ all accounts" />
      </section>
      <div className="grid grid--2"><AccountMixCard /><AccountStatusCard /></div>
      <DataTable
        title="Accounts"
        subtitle="Click a row to open the account holder"
        rows={view.accounts}
        columns={columns}
        rowKey={(r) => r.Account_ID}
        onRowClick={(r) => openCustomer(r.Customer_ID)}
        exportName="accounts"
        searchPlaceholder="Search account, customer, branch…"
        quickFilters={[
          { label: 'account types', accessor: (r) => r.Account_Type, options: model.options.accountTypes },
          { label: 'statuses', accessor: (r) => r.Account_Status, options: ['Active', 'Dormant', 'Closed'] },
        ]}
      />
    </>
  );
}
