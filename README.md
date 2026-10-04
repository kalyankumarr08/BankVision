# BankVision — Banking Analytics Dashboard (React)

An interactive **banking business-intelligence dashboard** built with React and Recharts. It is a **data-visualization project only** — no logins, payments or banking transactions. It upgrades the original HTML/vanilla-JS BankVision and keeps its Excel workbook as the single source of truth.

> The bundled dataset is synthetic and for educational use only.

## 1. Overview
- 7 pages: Dashboard, Customers, Accounts, Transactions, Loans, Branch Analytics, Reports (+ Settings)
- 10 global filters that drive every KPI, chart and table
- Drill-down drawers/modals for customers, branches and loans
- Rule-based **Key Insights** calculated from the filtered data (nothing hard-coded)
- Light/dark theme, responsive layout, Indian currency formatting (₹1,25,000 · ₹1.25 Cr)

## 2. Technologies
React 18 · Vite 5 · React Router (hash routing) · Recharts · Lucide React · SheetJS (`xlsx`) · Inter + Sora fonts (bundled, works offline) · plain modular CSS

## 3. Dataset
`public/data/banking_data.xlsx` is fetched and parsed in the browser. Sheets and key columns:

| Sheet | Rows | Used for |
|---|---|---|
| Customers | 3,000 | Age, Gender, Income, City, State, Customer_Segment, Join_Date |
| Accounts | 4,800 | Account_Type, Balance, Account_Status, Branch_ID, Open_Date |
| Transactions | 25,000 | Transaction_Type, Amount, Channel, Transaction_Status, Transaction_Date |
| Loans | 4,300 | Loan_Type, Loan_Amount, Interest_Rate, Loan_Tenure_Months, Loan_Status, Outstanding_Amount |
| Branches | 35 | Branch_Name, City, State, Region, Manager, Employee_Count |

The data layer adapts to the actual workbook rather than the generic spec: payment modes come from `Channel` (UPI, ATM, Mobile/Internet Banking, Branch), account types are Savings / Current / Salary / Fixed Deposit, and transaction types are Deposit / Withdrawal / Transfer / Interest / Payment. Customer profile fields are joined onto accounts, transactions and loans once at load time (`src/utils/model.js`).

**Business rules** (carried over from the original project)
- Total Deposits = balances of accounts that are not `Closed`
- Loans Outstanding = `Outstanding_Amount` of `Approved` + `Defaulted` loans
- Loan Approval Rate = approved ÷ decided applications (`Pending` excluded)
- Default Rate = defaulted ÷ settled loans (Approved + Closed + Defaulted)
- KPI trend = 3-month change; sparklines cover the last 12 months

**Filter semantics:** state, city, gender and segment use the customer's profile. Branch applies to accounts, transactions and loans. Date range applies to transactions and loan applications (accounts and customers are snapshots).

You can load a different workbook (same sheet/column names) from **Settings** — invalid files are rejected without losing the current data.

## 4. Install
```bash
npm install
```

## 5. Run
```bash
npm run dev       # development server
npm run build     # production build in dist/
npm run preview   # serve the production build
```
The build uses relative paths and hash routing, so `dist/` can be hosted on any static host (Vercel, Netlify, GitHub Pages).

## 6. Features
- **KPI cards** with count-up animation, 3-month change and sparkline
- **Charts:** deposit trend, loan growth, account distribution, transactions (type/channel × count/value), customer demographics (age, gender, segment, income), loan analysis (demand, approval vs rejection), branch ranking (switchable metric, click to drill down), regional comparison
- **Tables:** search, sort, pagination, rows-per-page, quick filters, status badges, CSV export of the filtered rows
- **Drill-down:** customer drawer, branch drawer, loan modal; header search finds customers, branches and loans
- **Reports:** CSV export per dataset, downloadable HTML report, print-friendly dashboard
- **States:** loading skeletons, empty states with *Reset Filters*, friendly error screen
- **Accessibility:** semantic landmarks, skip link, keyboard-operable tables and dialogs with focus trap, visible focus, status badges use icon + text, chart text descriptions, reduced-motion support

## 7. Structure
```
public/data/banking_data.xlsx   Excel source
src/
├── charts/       TrendChart, BarsChart, DonutChart, ChartCards (chart + question + data wiring)
├── components/   Sidebar, Header, KpiCard, FilterBar, DataTable, Dialog/Modal/Drawer, StatusBadge, …
│   └── drawers/  CustomerDrawer, BranchDrawer, LoanModal
├── context/      Theme, Data, Filter, Drill providers
├── data/         schema (sheets/columns/rules), navigation, table column definitions
├── hooks/        useCountUp
├── layouts/      AppLayout
├── pages/        Dashboard, Customers, Accounts, Transactions, Loans, Branches, Reports, Settings
├── styles/       tokens, base, layout, components, table, print
└── utils/        dataLoader, model, filters, aggregate, analytics, insights, format, csv, report
```

## 8. Future improvements
- Branch map (Leaflet) using the Latitude/Longitude columns, as in the original version
- Saved filter presets and shareable URLs
- Virtualised tables for much larger datasets
- Unit tests for `utils/` and end-to-end tests for filters
