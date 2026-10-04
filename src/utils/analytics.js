import { AGE_GROUPS, INCOME_BANDS, isActiveAccount, isLiveLoan, isSanctioned } from '../data/schema';
import { addMonths, groupBy, monthRange, pctChange, share, sum, avgValid } from './aggregate';
import { monthLabel } from './format';

const activeAccounts = (accounts) => accounts.filter(isActiveAccount);

/** Loan approval rate = approved ÷ decided (decided = everything except Pending). */
export function approvalStats(loans) {
  const decided = loans.filter((l) => l.Loan_Status !== 'Pending');
  const rejected = decided.filter((l) => l.Loan_Status === 'Rejected').length;
  const approved = decided.length - rejected;
  return {
    decided: decided.length,
    approved,
    rejected,
    approvalRate: share(approved, decided.length),
    rejectionRate: share(rejected, decided.length),
  };
}

function cumulative(items, monthOf, valOf, months) {
  const byMonth = new Map();
  let base = 0;
  for (const x of items) {
    const mo = monthOf(x);
    if (!mo) continue;
    const v = Number(valOf(x)) || 0;
    if (mo < months[0]) base += v;
    else byMonth.set(mo, (byMonth.get(mo) || 0) + v);
  }
  let run = base;
  return months.map((m) => (run += byMonth.get(m) || 0));
}

function flow(items, monthOf, valOf, months) {
  const byMonth = new Map();
  for (const x of items) {
    const mo = monthOf(x);
    if (mo) byMonth.set(mo, (byMonth.get(mo) || 0) + (Number(valOf(x)) || 0));
  }
  return months.map((m) => byMonth.get(m) || 0);
}

/** Six executive KPIs, each with a 12-month sparkline and a 3-month change. */
export function computeKpis(view, endMonth) {
  const months = monthRange(addMonths(endMonth, -11), endMonth);
  const acc = activeAccounts(view.accounts);
  const live = view.loans.filter(isLiveLoan);
  const stats = approvalStats(view.loans);

  const deposits = sum(acc, (a) => a.Balance);
  const outstanding = sum(live, (l) => l.Outstanding_Amount);
  const avgBalance = avgValid(acc, (a) => a.Balance);

  const levelDelta = (s) => pctChange(s[s.length - 1], s[s.length - 4]);
  const flowDelta = (s) => pctChange(s.slice(-3).reduce((a, b) => a + b, 0), s.slice(-6, -3).reduce((a, b) => a + b, 0));

  const custSeries = cumulative(view.customers, (c) => c.Join_Date?.slice(0, 7), () => 1, months);
  const depSeries = cumulative(acc, (a) => a.Open_Date?.slice(0, 7), (a) => a.Balance, months);
  const loanSeries = cumulative(live, (l) => l.Month, (l) => l.Outstanding_Amount, months);
  const txnSeries = flow(view.transactions, (t) => t.Month, () => 1, months);
  const accCount = cumulative(acc, (a) => a.Open_Date?.slice(0, 7), () => 1, months);
  const avgSeries = depSeries.map((v, i) => (accCount[i] ? v / accCount[i] : 0));
  const decided = cumulative(view.loans.filter((l) => l.Loan_Status !== 'Pending'), (l) => l.Month, () => 1, months);
  const okLoans = cumulative(view.loans.filter((l) => isSanctioned(l)), (l) => l.Month, () => 1, months);
  const rateSeries = decided.map((d, i) => (d ? (okLoans[i] / d) * 100 : 0));

  return [
    { key: 'customers', label: 'Total Customers', value: view.customers.length, format: 'number', series: custSeries, delta: levelDelta(custSeries), hint: 'Customers matching the filters; trend = cumulative joins' },
    { key: 'deposits', label: 'Total Deposits', value: deposits, format: 'inr', series: depSeries, delta: levelDelta(depSeries), hint: 'Balances of non-closed accounts; trend = cumulative by opening month' },
    { key: 'loans', label: 'Total Loans Outstanding', value: outstanding, format: 'inr', series: loanSeries, delta: levelDelta(loanSeries), hint: 'Outstanding amount on Approved and Defaulted loans' },
    { key: 'txns', label: 'Total Transactions', value: view.transactions.length, format: 'number', series: txnSeries, delta: flowDelta(txnSeries), hint: 'All transaction records (any status)' },
    { key: 'avg', label: 'Avg Account Balance', value: avgBalance, format: 'inr', series: avgSeries, delta: levelDelta(avgSeries), hint: 'Mean balance of non-closed accounts' },
    { key: 'approval', label: 'Loan Approval Rate', value: stats.approvalRate, format: 'pct', series: rateSeries, delta: rateSeries[11] - rateSeries[8], deltaUnit: 'pp', hint: 'Approved ÷ decided applications (Pending excluded)' },
  ];
}

export function depositTrend(txns) {
  const dep = txns.filter((t) => t.Transaction_Type === 'Deposit' && t.Transaction_Status === 'Success' && t.Month);
  if (!dep.length) return [];
  const by = groupBy(dep, (t) => t.Month);
  const keys = [...by.keys()].sort();
  let prev = null;
  return monthRange(keys[0], keys[keys.length - 1]).map((m) => {
    const rows = by.get(m) || [];
    const amount = sum(rows, (t) => t.Amount);
    const row = { month: m, label: monthLabel(m), amount, count: rows.length, change: pctChange(amount, prev) };
    prev = amount;
    return row;
  });
}

export function loanGrowth(loans) {
  const ok = loans.filter((l) => isSanctioned(l) && l.Month);
  if (!ok.length) return [];
  const by = groupBy(ok, (l) => l.Month);
  const keys = [...by.keys()].sort();
  let prev = null;
  return monthRange(keys[0], keys[keys.length - 1]).map((m) => {
    const rows = by.get(m) || [];
    const amount = sum(rows, (l) => l.Loan_Amount);
    const row = { month: m, label: monthLabel(m), amount, count: rows.length, change: pctChange(amount, prev) };
    prev = amount;
    return row;
  });
}

export function accountMix(accounts) {
  const acc = activeAccounts(accounts);
  const total = sum(acc, (a) => a.Balance);
  return [...groupBy(acc, (a) => a.Account_Type)]
    .map(([name, rows]) => {
      const value = sum(rows, (a) => a.Balance);
      return { name, value, count: rows.length, share: share(value, total) };
    })
    .sort((a, b) => b.value - a.value);
}

export function accountStatus(accounts) {
  return [...groupBy(accounts, (a) => a.Account_Status)].map(([name, rows]) => ({ name, value: rows.length }));
}

export function transactionMix(txns, field) {
  return [...groupBy(txns, (t) => t[field])]
    .map(([name, rows]) => ({ name, count: rows.length, amount: sum(rows, (t) => t.Amount) }))
    .sort((a, b) => b.count - a.count);
}

const countBy = (arr, fn) => [...groupBy(arr, fn)].map(([name, rows]) => ({ name, value: rows.length }));

export function demographics(customers) {
  const ordered = (rows, bands) => bands.map(([name]) => ({ name, value: rows.find((r) => r.name === name)?.value ?? 0 }));
  return {
    age: ordered(countBy(customers, (c) => c.AgeGroup), AGE_GROUPS),
    income: ordered(countBy(customers, (c) => c.IncomeBand), INCOME_BANDS),
    gender: countBy(customers, (c) => c.Gender).sort((a, b) => b.value - a.value),
    segment: countBy(customers, (c) => c.Customer_Segment).sort((a, b) => b.value - a.value),
  };
}

export function loanAnalysis(loans) {
  return [...groupBy(loans, (l) => l.Loan_Type)]
    .map(([name, rows]) => {
      const s = approvalStats(rows);
      return {
        name,
        count: rows.length,
        amount: sum(rows, (l) => l.Loan_Amount),
        outstanding: sum(rows.filter(isLiveLoan), (l) => l.Outstanding_Amount),
        approvalRate: s.approvalRate,
        rejectionRate: s.rejectionRate,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function loanStatusMix(loans) {
  return countBy(loans, (l) => l.Loan_Status).sort((a, b) => b.value - a.value);
}

/** Per-branch metrics from the already-filtered view. */
export function branchStats(view) {
  const accBy = groupBy(activeAccounts(view.accounts), (a) => a.Branch_ID);
  const loanBy = groupBy(view.loans.filter(isLiveLoan), (l) => l.Branch_ID);
  const txnBy = groupBy(view.transactions, (t) => t.Branch_ID);
  return view.branches.map((b) => {
    const acc = accBy.get(b.Branch_ID) || [];
    const loans = loanBy.get(b.Branch_ID) || [];
    const txns = txnBy.get(b.Branch_ID) || [];
    return {
      ...b,
      deposits: sum(acc, (a) => a.Balance),
      customers: new Set(acc.map((a) => a.Customer_ID)).size,
      loans: sum(loans, (l) => l.Outstanding_Amount),
      loanCount: loans.length,
      transactions: txns.length,
    };
  });
}

export function regionStats(stats) {
  return [...groupBy(stats, (b) => b.Region)]
    .map(([name, rows]) => ({ name, deposits: sum(rows, (b) => b.deposits), loans: sum(rows, (b) => b.loans) }))
    .sort((a, b) => b.deposits - a.deposits);
}

export function customerBalances(accounts) {
  const m = new Map();
  for (const a of activeAccounts(accounts)) m.set(a.Customer_ID, (m.get(a.Customer_ID) || 0) + (Number(a.Balance) || 0));
  return m;
}
