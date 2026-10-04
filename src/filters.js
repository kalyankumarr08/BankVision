export const DEFAULT_FILTERS = {
  from: '',
  to: '',
  state: '',
  city: '',
  branch: '',
  accountType: '',
  segment: '',
  gender: '',
  loanType: '',
  txnType: '',
};

/**
 * Applies the global filter set and returns the filtered slice of every entity.
 *  - state / city / gender / segment use the customer's profile (copied onto every record)
 *  - branch applies to accounts, transactions (via account) and loans
 *  - accountType applies to accounts and transactions; loanType to loans
 *  - date range applies to transactions and loan applications (accounts/customers are snapshots)
 *  - `transactionsAnyType` ignores the transaction-type filter (used for the deposit trend)
 */
export function applyFilters(model, f) {
  const profileOK = (x) =>
    (!f.state || x.State === f.state) &&
    (!f.city || x.City === f.city) &&
    (!f.gender || x.Gender === f.gender) &&
    (!f.segment || x.Customer_Segment === f.segment);
  const inRange = (d) => d && (!f.from || d >= f.from) && (!f.to || d <= f.to);
  const dated = f.from || f.to;

  const accounts = model.accounts.filter(
    (a) => profileOK(a) && (!f.branch || a.Branch_ID === f.branch) && (!f.accountType || a.Account_Type === f.accountType),
  );
  const accountLevel = Boolean(f.branch || f.accountType);
  const custWithAccount = accountLevel ? new Set(accounts.map((a) => a.Customer_ID)) : null;
  const customers = model.customers.filter((c) => profileOK(c) && (!custWithAccount || custWithAccount.has(c.Customer_ID)));

  const transactionsAnyType = model.transactions.filter(
    (t) =>
      profileOK(t) &&
      (!f.branch || t.Branch_ID === f.branch) &&
      (!f.accountType || t.Account_Type === f.accountType) &&
      (!dated || inRange(t.Transaction_Date)),
  );
  const transactions = f.txnType ? transactionsAnyType.filter((t) => t.Transaction_Type === f.txnType) : transactionsAnyType;

  const loans = model.loans.filter(
    (l) =>
      profileOK(l) &&
      (!f.branch || l.Branch_ID === f.branch) &&
      (!f.loanType || l.Loan_Type === f.loanType) &&
      (!dated || inRange(l.Application_Date)),
  );

  const branches = model.branches.filter(
    (b) => (!f.state || b.State === f.state) && (!f.city || b.City === f.city) && (!f.branch || b.Branch_ID === f.branch),
  );

  return { customers, accounts, transactions, transactionsAnyType, loans, branches };
}

const LABELS = {
  from: 'From',
  to: 'To',
  state: 'State',
  city: 'City',
  branch: 'Branch',
  accountType: 'Account type',
  segment: 'Segment',
  gender: 'Gender',
  loanType: 'Loan type',
  txnType: 'Transaction type',
};

/** Human-readable list of active filters (used in reports and exports). */
export function describeFilters(f, model) {
  const out = [];
  for (const [k, v] of Object.entries(f)) {
    if (!v) continue;
    out.push([LABELS[k], k === 'branch' ? model.branchById.get(v)?.Branch_Name ?? v : v]);
  }
  return out;
}
