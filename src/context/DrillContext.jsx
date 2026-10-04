import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import CustomerDrawer from '../components/drawers/CustomerDrawer';
import BranchDrawer from '../components/drawers/BranchDrawer';
import LoanModal from '../components/drawers/LoanModal';

const DrillContext = createContext(null);

export function DrillProvider({ children }) {
  const [target, setTarget] = useState(null); // { type, id }
  const close = useCallback(() => setTarget(null), []);
  const api = useMemo(
    () => ({
      openCustomer: (id) => setTarget({ type: 'customer', id }),
      openBranch: (id) => setTarget({ type: 'branch', id }),
      openLoan: (id) => setTarget({ type: 'loan', id }),
      close,
    }),
    [close],
  );
  return (
    <DrillContext.Provider value={api}>
      {children}
      {target?.type === 'customer' && <CustomerDrawer id={target.id} onClose={close} />}
      {target?.type === 'branch' && <BranchDrawer id={target.id} onClose={close} />}
      {target?.type === 'loan' && <LoanModal id={target.id} onClose={close} />}
    </DrillContext.Provider>
  );
}

export const useDrill = () => useContext(DrillContext);
