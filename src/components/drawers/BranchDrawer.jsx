import { useMemo } from 'react';
import Drawer from '../Drawer';
import { DetailGrid, MiniStats, Section } from '../DetailBits';
import { useData } from '../../context/DataContext';
import { useDrill } from '../../context/DrillContext';
import { isActiveAccount, isLiveLoan } from '../../data/schema';
import { approvalStats } from '../../utils/analytics';
import { sum, share } from '../../utils/aggregate';
import { inr, inrCompact, num, pct } from '../../utils/format';

export default function BranchDrawer({ id, onClose }) {
  const { model } = useData();
  const { openCustomer } = useDrill();
  const b = model.branchById.get(id);

  const d = useMemo(() => {
    const accounts = model.accounts.filter((a) => a.Branch_ID === id && isActiveAccount(a));
    const loans = model.loans.filter((l) => l.Branch_ID === id);
    const txns = model.transactions.filter((t) => t.Branch_ID === id).length;
    const byCust = new Map();
    accounts.forEach((a) => byCust.set(a.Customer_ID, (byCust.get(a.Customer_ID) || 0) + (Number(a.Balance) || 0)));
    const top = [...byCust].sort((x, y) => y[1] - x[1]).slice(0, 5);
    return { accounts, loans, txns, customers: byCust.size, top };
  }, [model, id]);

  if (!b) return null;
  const deposits = sum(d.accounts, (a) => a.Balance);
  const outstanding = sum(d.loans.filter(isLiveLoan), (l) => l.Outstanding_Amount);
  const stats = approvalStats(d.loans);

  return (
    <Drawer title={b.Branch_Name} subtitle={`${b.Branch_ID} · ${b.City}, ${b.State} · ${b.Region} region`} onClose={onClose}>
      <MiniStats items={[['Deposits', inrCompact(deposits)], ['Loans outstanding', inrCompact(outstanding)], ['Customers', num(d.customers)], ['Transactions', num(d.txns)]]} />
      <Section title="Branch details">
        <DetailGrid items={[['Manager', b.Manager], ['Branch type', b.Branch_Type], ['Employees', b.Employee_Count], ['Region', b.Region]]} />
      </Section>
      <Section title="Performance metrics">
        <DetailGrid
          items={[
            ['Performance score', b.Performance_Score],
            ['Digital adoption', b.Digital_Adoption_Pct != null ? `${b.Digital_Adoption_Pct}%` : null],
            ['Deposit target met', b.Deposit_Target ? pct(share(deposits, b.Deposit_Target)) : null],
            ['Loan target met', b.Loan_Target ? pct(share(outstanding, b.Loan_Target)) : null],
            ['Loan approval rate', pct(stats.approvalRate)],
            ['Loan applications', num(d.loans.length)],
          ]}
        />
        <p className="muted small">Drill-down shows this branch across the full dataset, independent of the global filters.</p>
      </Section>
      <Section title="Top customers by balance">
        {d.top.length ? (
          <ul className="list">
            {d.top.map(([cid, bal]) => (
              <li key={cid}>
                <button type="button" className="link-btn" onClick={() => openCustomer(cid)}>{model.custById.get(cid)?.Customer_Name ?? cid}</button>
                <strong>{inr(bal)}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No active accounts at this branch.</p>}
      </Section>
    </Drawer>
  );
}
