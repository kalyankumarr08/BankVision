import { useMemo } from 'react';
import Drawer from '../Drawer';
import StatusBadge from '../StatusBadge';
import { DetailGrid, MiniStats, Section } from '../DetailBits';
import { useData } from '../../context/DataContext';
import { useDrill } from '../../context/DrillContext';
import { isActiveAccount, isLiveLoan } from '../../data/schema';
import { sum } from '../../utils/aggregate';
import { fmtDate, inr, num } from '../../utils/format';

export default function CustomerDrawer({ id, onClose }) {
  const { model } = useData();
  const { openLoan, openBranch } = useDrill();
  const c = model.custById.get(id);

  const d = useMemo(() => {
    const accounts = model.acctsByCust.get(id) ?? [];
    const loans = model.loansByCust.get(id) ?? [];
    const txns = accounts.flatMap((a) => model.txnsByAcct.get(a.Account_ID) ?? []).sort((a, b) => (a.Transaction_Date < b.Transaction_Date ? 1 : -1));
    return { accounts, loans, txns };
  }, [model, id]);

  if (!c) return null;
  const balance = sum(d.accounts.filter(isActiveAccount), (a) => a.Balance);
  const outstanding = sum(d.loans.filter(isLiveLoan), (l) => l.Outstanding_Amount);

  return (
    <Drawer title={c.Customer_Name} subtitle={`${c.Customer_ID} · ${c.City}, ${c.State}`} onClose={onClose}>
      <MiniStats items={[['Total balance', inr(balance)], ['Accounts', num(d.accounts.length)], ['Loans outstanding', inr(outstanding)], ['Transactions', num(d.txns.length)]]} />
      <Section title="Customer information">
        <DetailGrid items={[['Age', c.Age], ['Gender', c.Gender], ['Occupation', c.Occupation], ['Income', inr(c.Income)], ['Segment', c.Customer_Segment], ['Customer type', c.Customer_Type], ['Credit score', c.Credit_Score], ['Joined', fmtDate(c.Join_Date)], ['Last activity', fmtDate(c.Last_Activity_Date)]]} />
      </Section>
      <Section title="Account summary">
        {d.accounts.length ? (
          <ul className="list">
            {d.accounts.map((a) => (
              <li key={a.Account_ID}>
                <div>
                  <strong>{a.Account_Type}</strong> <span className="muted">{a.Account_ID}</span>
                  <br />
                  <button type="button" className="link-btn" onClick={() => openBranch(a.Branch_ID)}>{a.Branch_Name}</button>
                </div>
                <div className="list__end">
                  <strong>{inr(a.Balance)}</strong>
                  <StatusBadge status={a.Account_Status} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No accounts on record.</p>}
      </Section>
      <Section title="Loan information">
        {d.loans.length ? (
          <ul className="list">
            {d.loans.map((l) => (
              <li key={l.Loan_ID}>
                <button type="button" className="link-btn" onClick={() => openLoan(l.Loan_ID)}>{l.Loan_Type} · {l.Loan_ID}</button>
                <div className="list__end">
                  <strong>{inr(l.Loan_Amount)}</strong>
                  <StatusBadge status={l.Loan_Status} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No loans on record.</p>}
      </Section>
      <Section title={`Recent activity (latest ${Math.min(8, d.txns.length)} of ${num(d.txns.length)})`}>
        {d.txns.length ? (
          <ul className="list">
            {d.txns.slice(0, 8).map((t) => (
              <li key={t.Transaction_ID}>
                <div>
                  <strong>{t.Transaction_Type}</strong> <span className="muted">via {t.Channel}</span>
                  <br />
                  <span className="muted">{fmtDate(t.Transaction_Date)} · {t.Transaction_ID}</span>
                </div>
                <div className="list__end">
                  <strong>{inr(t.Amount)}</strong>
                  <StatusBadge status={t.Transaction_Status} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No transactions on record.</p>}
      </Section>
    </Drawer>
  );
}
