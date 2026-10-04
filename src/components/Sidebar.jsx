import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, Settings } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM } from '../data/navigation';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onNavigate }) {
  const link = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`;
  return (
    <>
      <div className={`scrim${mobileOpen ? ' is-open' : ''}`} onClick={onNavigate} aria-hidden="true" />
      <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`} aria-label="Primary">
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className={link} onClick={onNavigate} title={collapsed ? label : undefined}>
              <Icon size={19} aria-hidden="true" />
              <span className="nav-link__text">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <NavLink to={SETTINGS_ITEM.path} className={link} onClick={onNavigate} title={collapsed ? 'Settings' : undefined}>
            <Settings size={19} aria-hidden="true" />
            <span className="nav-link__text">Settings</span>
          </NavLink>
          <ThemeToggle showLabel />
          <button type="button" className="nav-link nav-link--btn sidebar__collapse" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
            <span className="nav-link__text">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
