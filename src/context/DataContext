import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DATA_URL } from '../data/schema';
import { parseWorkbook } from '../utils/dataLoader';

const DataContext = createContext(null);
const DEFAULT_SOURCE = 'banking_data.xlsx (bundled demo dataset)';

export function DataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', model: null, error: null, source: DEFAULT_SOURCE });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Dataset request failed (HTTP ${res.status})`);
      const model = parseWorkbook(await res.arrayBuffer());
      setState({ status: 'ready', model, error: null, source: DEFAULT_SOURCE });
    } catch (e) {
      setState((s) => ({ ...s, status: 'error', error: e.message || String(e) }));
    }
  }, []);

  /** Load a user-supplied workbook. Keeps the current data if the file is invalid. */
  const loadFile = useCallback(async (file) => {
    try {
      const model = parseWorkbook(await file.arrayBuffer());
      setState({ status: 'ready', model, error: null, source: file.name });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => ({ ...state, reload: load, loadFile }), [state, load, loadFile]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
