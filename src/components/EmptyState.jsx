import { SearchX, RotateCcw } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

export default function EmptyState({ message = 'No data available for the selected filters.', compact = false, showReset = true }) {
  const { reset, activeCount } = useFilters();
  return (
    <div className={`empty${compact ? ' empty--compact' : ''}`} role="status">
      <SearchX size={compact ? 22 : 30} aria-hidden="true" />
      <p>{message}</p>
      {showReset && activeCount > 0 && (
        <button type="button" className="btn btn--ghost" onClick={reset}>
          <RotateCcw size={15} aria-hidden="true" /> Reset Filters
        </button>
      )}
    </div>
  );
}
