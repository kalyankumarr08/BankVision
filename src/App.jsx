import { lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { UploadProvider } from './context/UploadContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Loans = lazy(() => import('./pages/Loans'));
const Branches = lazy(() => import('./pages/Branches'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const ExcelImport = lazy(() => import('./pages/ExcelImport'));

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <UploadProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="loans" element={<Loans />} />
              <Route path="branches" element={<Branches />} />
              <Route path="import" element={<ExcelImport />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
        </UploadProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
