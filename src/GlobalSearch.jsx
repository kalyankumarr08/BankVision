import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useDrill } from '../context/DrillContext';

/** Header search: finds customers, branches and loans by name or ID and opens the drill-down. */
export default function GlobalSearch() {
  const { model } = useData();
  const { openCustomer, openBranch, openLoan } = useDrill();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const deferred = useDeferredValue(q.trim().toLowerCase());
  const box = useRef(null);

  useEffect(() => {
    const away = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const results = useMemo(() => {
    if (!model || deferred.length < 2) return [];
    const hit = (...vals) => vals.some((v) => String(v ?? '').toLowerCase().includes(deferred));
    const out = [];
    for (const c of model.customers) if (out.length < 5 && hit(c.Customer_Name, c.Customer_ID)) out.push({ k: c.Customer_ID, type: 'Customer', label: c.Customer_Name, meta: c.Customer_ID, go: () => openCustomer(c.Customer_ID) });
    let n = 0;
    for (const b of model.branches) if (n < 3 && hit(b.Branch_Name, b.Branch_ID)) (n += 1, out.push({ k: b.Branch_ID, type: 'Branch', label: b.Branch_Name, meta: b.City, go: () => openBranch(b.Branch_ID) }));
    n = 0;
    for (const l of model.loans) if (n < 3 && hit(l.Loan_ID)) (n += 1, out.push({ k: l.Loan_ID, type: 'Loan', label: l.Loan_ID, meta: l.Loan_Type, go: () => openLoan(l.Loan_ID) }));
    return out;
  }, [model, deferred, openCustomer, openBranch, openLoan]);

  return (
    <div className="gsearch" ref={box}>
      <label className="search">
        <Search size={16} aria-hidden="true" />
        <input type="search" value={q} placeholder="Search customer, branch, loan…" aria-label="Search customers, branches and loans" onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
      </label>
      {open && deferred.length >= 2 && (
        <ul className="gsearch__menu" role="listbox" aria-label="Search results">
          {results.length === 0 && <li className="muted gsearch__none">No matches found.</li>}
          {results.map((r) => (
            <li key={`${r.type}-${r.k}`}>
              <button type="button" role="option" onClick={() => { r.go(); setOpen(false); setQ(''); }}>
                <span className="pill">{r.type}</span>
                <span>{r.label}</span>
                <span className="muted">{r.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
