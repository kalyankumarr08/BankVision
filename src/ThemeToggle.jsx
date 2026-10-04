import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = false }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className={showLabel ? 'nav-link nav-link--btn' : 'icon-btn'} onClick={toggle} aria-pressed={dark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      {showLabel && <span className="nav-link__text">{dark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
