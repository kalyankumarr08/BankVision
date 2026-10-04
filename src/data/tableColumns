import StatusBadge from '../components/StatusBadge';
import { fmtDate, inr, num } from '../utils/format';

const Link = ({ onClick, children }) => (
  <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
    {children}
  </button>
);

export const customerColumns = ({ balances, openCustomer }) => [
  { key: 'id', label: 'Customer ID', accessor: (r) => r.Customer_ID },
  { key: 'name', label: 'Customer Name', accessor: (r) => r.Customer_Name, render: (r) => <Link onClick={() => openCustomer?.(r.Customer_ID)}>{r.Customer_Name}</Link> },
  { key: 'age', label: 'Age', accessor: (r) => r.Age, align: 'right' },
  { key: 'city', label: 'City', accessor: (r) => r.City },
  { key: 'income', label: 'Income', accessor: (r) => r.Income, render: (r) => inr(r.Income), align: 'right' },
  { key: 'segment', label: 'Segment', accessor: (r) => r.Customer_Segment },
  { key: 'balance', label: 'Account Balance', accessor: (r) => Math.round(balances?.get(r.Customer_ID) ?? 0), render: (r) => inr(balances?.get(r.Customer_ID) ?? 0), align: 'right' },
];

export const accountColumns = ({ openCustomer, openBranch } = {}) => [
  { key: 'id', label: 'Account ID', accessor: (r) => r.Account_ID },
  { key: 'cust', label: 'Customer', accessor: (r) => r.Customer_Name ?? r.Customer_ID, render: (r) => <Link onClick={() => openCustomer?.(r.Customer_ID)}>{r.Customer_Name ?? r.Customer_ID}</Link> },
  { key: 'type', label: 'Type', accessor: (r) => r.Account_Type },
  { key: 'branch', label: 'Branch', accessor: (r) => r.Branch_Name, render: (r) => <Link onClick={() => openBranch?.(r.Branch_ID)}>{r.Branch_Name}</Link> },
  { key: 'balance', label: 'Balance', accessor: (r) => r.Balance, render: (r) => inr(r.Balance), align: 'right' },
  { key: 'rate', label: 'Interest %', accessor: (r) => r.Interest_Rate, align: 'right' },
  { key: 'opened', label: 'Opened', accessor: (r) => r.Open_Date, render: (r) => fmtDate(r.Open_Date) },
  { key: 'status', label: 'Status', accessor: (r) => r.Account_Status, render: (r) => <StatusBadge status={r.Account_Status} /> },
];

export const transactionColumns = ({ openCustomer } = {}) => [
  { key: 'id', label: 'Transaction ID', accessor: (r) => r.Transaction_ID },
  { key: 'date', label: 'Date', accessor: (r) => r.Transaction_Date, render: (r) => fmtDate(r.Transaction_Date) },
  { key: 'cust', label: 'Customer', accessor: (r) => r.Customer_Name ?? '—', render: (r) => (r.Customer_ID ? <Link onClick={() => openCustomer?.(r.Customer_ID)}>{r.Customer_Name}</Link> : '—') },
  { key: 'type', label: 'Type', accessor: (r) => r.Transaction_Type },
  { key: 'amount', label: 'Amount', accessor: (r) => r.Amount, render: (r) => inr(r.Amount), align: 'right' },
  { key: 'mode', label: 'Payment Mode', accessor: (r) => r.Channel },
  { key: 'status', label: 'Status', accessor: (r) => r.Transaction_Status, render: (r) => <StatusBadge status={r.Transaction_Status} /> },
];

export const loanColumns = ({ openLoan, openCustomer } = {}) => [
  { key: 'id', label: 'Loan ID', accessor: (r) => r.Loan_ID, render: (r) => <Link onClick={() => openLoan?.(r.Loan_ID)}>{r.Loan_ID}</Link> },
  { key: 'cust', label: 'Customer', accessor: (r) => r.Customer_Name ?? r.Customer_ID, render: (r) => <Link onClick={() => openCustomer?.(r.Customer_ID)}>{r.Customer_Name ?? r.Customer_ID}</Link> },
  { key: 'type', label: 'Loan Type', accessor: (r) => r.Loan_Type },
  { key: 'amount', label: 'Amount', accessor: (r) => r.Loan_Amount, render: (r) => inr(r.Loan_Amount), align: 'right' },
  { key: 'rate', label: 'Interest Rate', accessor: (r) => r.Interest_Rate, render: (r) => `${r.Interest_Rate}%`, align: 'right' },
  { key: 'tenure', label: 'Tenure', accessor: (r) => r.Loan_Tenure_Months, render: (r) => (r.Loan_Tenure_Months ? `${r.Loan_Tenure_Months} mo` : '—'), align: 'right' },
  { key: 'status', label: 'Status', accessor: (r) => r.Loan_Status, render: (r) => <StatusBadge status={r.Loan_Status} /> },
];

export const branchColumns = ({ openBranch } = {}) => [
  { key: 'name', label: 'Branch', accessor: (r) => r.Branch_Name, render: (r) => <Link onClick={() => openBranch?.(r.Branch_ID)}>{r.Branch_Name}</Link> },
  { key: 'city', label: 'City', accessor: (r) => r.City },
  { key: 'state', label: 'State', accessor: (r) => r.State },
  { key: 'region', label: 'Region', accessor: (r) => r.Region },
  { key: 'manager', label: 'Manager', accessor: (r) => r.Manager },
  { key: 'emp', label: 'Employees', accessor: (r) => r.Employee_Count, align: 'right' },
  { key: 'cust', label: 'Customers', accessor: (r) => r.customers, render: (r) => num(r.customers), align: 'right' },
  { key: 'dep', label: 'Deposits', accessor: (r) => Math.round(r.deposits), render: (r) => inr(r.deposits), align: 'right' },
  { key: 'loans', label: 'Loans Outstanding', accessor: (r) => Math.round(r.loans), render: (r) => inr(r.loans), align: 'right' },
  { key: 'txns', label: 'Transactions', accessor: (r) => r.transactions, render: (r) => num(r.transactions), align: 'right' },
];
