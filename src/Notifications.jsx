import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useData } from '../context/DataContext';
import { num } from '../utils/format';

/** Data-derived alerts (no fake notifications): counts that an analyst would want to look at. */
export default function Notifications() {
  const { model } = useData();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const away = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const items = useMemo(() => {
    if (!model) return [];
    const c = (arr, fn) => arr.filter(fn).length;
    return [
      [c(model.loans, (l) => l.Loan_Status === 'Pending'), 'loan applications are pending a decision'],
      [c(model.loans, (l) => l.Loan_Status === 'Defaulted'), 'loans are in default'],
      [c(model.transactions, (t) => t.Transaction_Status === 'Failed'), 'transactions failed'],
      [c(model.accounts, (a) => a.Account_Status === 'Dormant'), 'accounts are dormant'],
    ].filter(([n]) => n > 0);
  }, [model]);

  return (
    <div className="gsearch gsearch--bell" ref={box}>
      <button type="button" className="icon-btn" aria-label={`Notifications (${items.length})`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Bell size={18} />
        {items.length > 0 && <span className="dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="gsearch__menu gsearch__menu--right" role="region" aria-label="Notifications">
          <p className="menu-title">Portfolio alerts</p>
          {items.length === 0 ? <p className="muted gsearch__none">Nothing needs attention.</p> : (
            <ul className="notes">
              {items.map(([n, text]) => <li key={text}><strong>{num(n)}</strong> {text}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
