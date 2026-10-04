import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { NAV_ITEMS } from '../data/navigation';

const MAIN = ['/', '/customers', '/transactions', '/loans'];

export default function BottomNav({ onMenu }) {
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {NAV_ITEMS.filter((n) => MAIN.includes(n.path)).map(({ path, label, icon: Icon }) => (
        <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
      <button type="button" className="bottom-nav__item" onClick={onMenu}>
        <Menu size={20} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
