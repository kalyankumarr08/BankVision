import { useLocation } from 'react-router-dom';
import { Menu, Landmark } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM } from '../data/navigation';
import GlobalSearch from './GlobalSearch';
import Notifications from './Notifications';
import ThemeToggle from './ThemeToggle';
import { useData } from '../context/DataContext';

export default function Header({ onMenu, ready }) {
  const { pathname } = useLocation();
  const { kind } = useData();
  const page = [...NAV_ITEMS, SETTINGS_ITEM].find((n) => n.path === pathname) ?? NAV_ITEMS[0];
  return (
    <header className="header">
      <button type="button" className="icon-btn header__menu" onClick={onMenu} aria-label="Open navigation menu">
        <Menu size={20} />
      </button>
      <div className="brand">
        <span className="brand__mark" aria-hidden="true"><Landmark size={18} /></span>
        <span className="brand__name">Bank<b>Vision</b></span>
      </div>
      <span className="header__page">{page.label}</span>
      <div className="header__spacer" />
      {ready && <GlobalSearch />}
      {ready && <Notifications />}
      <ThemeToggle />
      <div className="profile" title="Analytics workspace">
        <span className="profile__avatar" aria-hidden="true">BV</span>
        <span className="profile__text">
          <strong>Analyst</strong>
          <small>{kind === 'upload' ? 'Uploaded workbook' : 'Demo workspace'}</small>
        </span>
      </div>
    </header>
  );
}
