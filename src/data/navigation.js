import { LayoutDashboard, Users, Landmark, ArrowLeftRight, HandCoins, Building2, FileBarChart, FileUp } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', title: 'Executive Dashboard', subtitle: 'Banking performance at a glance', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', title: 'Customer Analytics', subtitle: 'Who our customers are and what they hold', icon: Users },
  { path: '/accounts', label: 'Accounts', title: 'Account Analytics', subtitle: 'Deposit base, account mix and status', icon: Landmark },
  { path: '/transactions', label: 'Transactions', title: 'Transaction Analytics', subtitle: 'Volumes, channels and success rates', icon: ArrowLeftRight },
  { path: '/loans', label: 'Loans', title: 'Loan Analytics', subtitle: 'Portfolio growth, demand and approvals', icon: HandCoins },
  { path: '/branches', label: 'Branch Analytics', title: 'Branch Analytics', subtitle: 'Compare branch performance', icon: Building2 },
  { path: '/import', label: 'Excel Import', title: 'Excel Import', subtitle: 'Upload any workbook and visualize it automatically', icon: FileUp },
  { path: '/reports', label: 'Reports', title: 'Reports & Exports', subtitle: 'Filtered analytics, CSV exports and printable reports', icon: FileBarChart },
];
export const SETTINGS_ITEM = { path: '/settings', label: 'Settings', title: 'Settings', subtitle: 'Appearance and data source' };
