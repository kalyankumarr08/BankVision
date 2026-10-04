import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useData } from './DataContext';
import { DEFAULT_FILTERS, applyFilters } from '../utils/filters';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const { model } = useData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => setFilters(DEFAULT_FILTERS), [model]); // new workbook → clean slate

  const setFilter = useCallback(
    (key, value) =>
      setFilters((f) => {
        const next = { ...f, [key]: value };
        if (key === 'state' && next.city && model?.options.cityByState[value] && !model.options.cityByState[value].includes(next.city)) next.city = '';
        const b = model?.branchById.get(next.branch);
        if (b && ((next.state && b.State !== next.state) || (next.city && b.City !== next.city))) next.branch = '';
        return next;
      }),
    [model],
  );
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const view = useMemo(() => (model ? applyFilters(model, filters) : null), [model, filters]);
  const activeCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const value = useMemo(() => ({ filters, setFilter, reset, view, activeCount }), [filters, setFilter, reset, view, activeCount]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export const useFilters = () => useContext(FilterContext);
