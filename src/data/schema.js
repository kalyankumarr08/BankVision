// Dataset contract: which sheets/columns the app needs, plus shared category definitions.
export const DATA_URL = `${import.meta.env?.BASE_URL ?? "./"}banking_data.xlsx`;
export const REQUIRED_SHEETS = {
  Customers: {
    id: 'Customer_ID',
    required: ['Customer_ID', 'Customer_Name', 'Age', 'Gender', 'Income', 'City', 'State', 'Customer_Segment'],
    dates: ['Join_Date', 'Last_Activity_Date'],
  },
  Accounts: {
    id: 'Account_ID',
    required: ['Account_ID', 'Customer_ID', 'Branch_ID', 'Account_Type', 'Balance', 'Account_Status'],
    dates: ['Open_Date'],
  },
  Transactions: {
    id: 'Transaction_ID',
    required: ['Transaction_ID', 'Account_ID', 'Transaction_Type', 'Amount', 'Channel', 'Transaction_Status'],
    dates: ['Transaction_Date'],
  },
  Loans: {
    id: 'Loan_ID',
    required: ['Loan_ID', 'Customer_ID', 'Branch_ID', 'Loan_Type', 'Loan_Amount', 'Interest_Rate', 'Loan_Status'],
    dates: ['Application_Date'],
  },
  Branches: {
    id: 'Branch_ID',
    required: ['Branch_ID', 'Branch_Name', 'City', 'State', 'Region'],
    dates: [],
  },
};

export const AGE_GROUPS = [
  ['18–25', 18, 25],
  ['26–35', 26, 35],
  ['36–45', 36, 45],
  ['46–55', 46, 55],
  ['56+', 56, 200],
];

export const INCOME_BANDS = [
  ['Below ₹25K', 0, 25000],
  ['₹25K–50K', 25000, 50000],
  ['₹50K–1L', 50000, 100000],
  ['₹1L–1.5L', 100000, 150000],
  ['Above ₹1.5L', 150000, Infinity],
];

// Business rules (kept from the original BankVision project)
export const isActiveAccount = (a) => a.Account_Status !== 'Closed';
export const isLiveLoan = (l) => l.Loan_Status === 'Approved' || l.Loan_Status === 'Defaulted';
export const isSanctioned = (l) => l.Loan_Status !== 'Rejected' && l.Loan_Status !== 'Pending';
