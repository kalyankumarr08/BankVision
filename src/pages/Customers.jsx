import { useMemo } from 'react';
import { Users, CalendarClock, Wallet, Smartphone } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import DataTable from '../components/DataTable';
import { DemographicsCards } from '../charts/ChartCards';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { useDrill } from '../context/DrillContext';
import { customerBalances } from '../utils/analytics';
import { avgValid, share } from '../utils/aggregate';
import { customerColumns } from '../data/tableColumns';

export default function Customers() {
  const { model } = useData();
  const { view } = useFilters();
  const { openCustomer } = useDrill();
  const balances = useMemo(() => customerBalances(view.accounts), [view.accounts]);
  const columns = useMemo(() => customerColumns({ balances, openCustomer }), [balances, openCustomer]);
  const digital = share(view.customers.filter((c) => c.Digital_User === 'Yes').length, view.customers.length);
  return (
    <>
      <PageHeader title="Customer Analytics" subtitle="Who our customers are, and how much they hold" />
      <section className="kpi-grid kpi-grid--4">
        <KpiCard label="Customers" value={view.customers.length} icon={Users} />
        <KpiCard label="Average age" value={avgValid(view.customers, (c) => c.Age)} format="number" icon={CalendarClock} hint="Mean of valid ages" />
        <KpiCard label="Average income" value={avgValid(view.customers, (c) => c.Income)} format="inr" icon={Wallet} />
        <KpiCard label="Digital users" value={digital} format="pct" icon={Smartphone} hint="Customers flagged Digital_User = Yes" />
      </section>
      <div className="grid grid--2"><DemographicsCards only={['age', 'segment']} /></div>
      <div className="grid grid--2"><DemographicsCards only={['gender', 'income']} /></div>
      <DataTable
        title="Customers"
        subtitle="Click a row to open the customer profile"
        rows={view.customers}
        columns={columns}
        rowKey={(r) => r.Customer_ID}
        onRowClick={(r) => openCustomer(r.Customer_ID)}
        exportName="customers"
        searchPlaceholder="Search name, ID, city…"
        quickFilters={[{ label: 'segments', accessor: (r) => r.Customer_Segment, options: model.options.segments }]}
      />
    </>
  );
}
