import { AGE_GROUPS, INCOME_BANDS } from '../data/schema';
import { bucketLabel } from './aggregate';

const uniq = (arr) => [...new Set(arr.filter((x) => x != null && x !== ''))].sort();

/**
 * Joins the five sheets once so every filter/chart can read denormalised fields
 * (customer geo/demographics are copied onto accounts, transactions and loans).
 */
export function buildModel(raw) {
  const customers = raw.Customers.map((c) => ({
    ...c,
    AgeGroup: bucketLabel(c.Age, AGE_GROUPS),
    IncomeBand: bucketLabel(c.Income, INCOME_BANDS),
  }));
  const custById = new Map(customers.map((c) => [c.Customer_ID, c]));
  const branches = raw.Branches;
  const branchById = new Map(branches.map((b) => [b.Branch_ID, b]));

  const cust = (id) => custById.get(id) ?? {};
  const geo = (c) => ({
    State: c.State,
    City: c.City,
    Gender: c.Gender,
    Customer_Segment: c.Customer_Segment,
    Customer_Name: c.Customer_Name,
  });
  const branchName = (id) => branchById.get(id)?.Branch_Name ?? id;

  const accounts = raw.Accounts.map((a) => ({
    ...a,
    ...geo(cust(a.Customer_ID)),
    Branch_Name: branchName(a.Branch_ID),
  }));
  const accById = new Map(accounts.map((a) => [a.Account_ID, a]));

  const transactions = raw.Transactions.map((t) => {
    const a = accById.get(t.Account_ID) ?? {};
    return {
      ...t,
      Txn_City: t.City,
      Txn_State: t.State,
      Customer_ID: a.Customer_ID,
      Branch_ID: a.Branch_ID,
      Account_Type: a.Account_Type,
      State: a.State,
      City: a.City,
      Gender: a.Gender,
      Customer_Segment: a.Customer_Segment,
      Customer_Name: a.Customer_Name,
      Month: t.Month || t.Transaction_Date?.slice(0, 7) || null,
    };
  });

  const loans = raw.Loans.map((l) => ({
    ...l,
    ...geo(cust(l.Customer_ID)),
    Branch_Name: branchName(l.Branch_ID),
    Month: l.Application_Date?.slice(0, 7) ?? null,
  }));

  const group = (arr, key) => {
    const m = new Map();
    for (const x of arr) {
      const k = x[key];
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  };

  const months = [
    ...transactions.map((t) => t.Month),
    ...loans.map((l) => l.Month),
    ...accounts.map((a) => a.Open_Date?.slice(0, 7)),
  ].filter(Boolean);
  const endMonth = months.reduce((a, b) => (b > a ? b : a), '0000-00');

  const dates = [...transactions.map((t) => t.Transaction_Date), ...loans.map((l) => l.Application_Date)].filter(Boolean);
  const cityByState = new Map();
  for (const c of customers) {
    if (!cityByState.has(c.State)) cityByState.set(c.State, new Set());
    cityByState.get(c.State).add(c.City);
  }

  return {
    customers,
    accounts,
    transactions,
    loans,
    branches,
    custById,
    accById,
    branchById,
    loanById: new Map(loans.map((l) => [l.Loan_ID, l])),
    acctsByCust: group(accounts, 'Customer_ID'),
    loansByCust: group(loans, 'Customer_ID'),
    txnsByAcct: group(transactions, 'Account_ID'),
    endMonth,
    options: {
      states: uniq(customers.map((c) => c.State)),
      cityByState: Object.fromEntries([...cityByState].map(([s, set]) => [s, [...set].sort()])),
      cities: uniq(customers.map((c) => c.City)),
      accountTypes: uniq(accounts.map((a) => a.Account_Type)),
      segments: uniq(customers.map((c) => c.Customer_Segment)),
      genders: uniq(customers.map((c) => c.Gender)),
      loanTypes: uniq(loans.map((l) => l.Loan_Type)),
      txnTypes: uniq(transactions.map((t) => t.Transaction_Type)),
      dateMin: dates.reduce((a, b) => (b < a ? b : a), '9999-12-31'),
      dateMax: dates.reduce((a, b) => (b > a ? b : a), '0000-01-01'),
    },
    counts: {
      Customers: customers.length,
      Accounts: accounts.length,
      Transactions: transactions.length,
      Loans: loans.length,
      Branches: branches.length,
    },
  };
}
