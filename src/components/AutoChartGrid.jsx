import { useMemo } from 'react';
import AutoChart from './AutoChart';
import { recommendCharts } from '../utils/chartRecommendation';

/** Recommends charts from the detected columns and lays them out in the dashboard grid. */
export default function AutoChartGrid({ columns, rows, entity, singular }) {
  const specs = useMemo(() => recommendCharts(columns, { entity, singular }), [columns, entity, singular]);
  if (!specs.length) return <div className="card"><p className="muted">No charts could be generated automatically — this sheet needs at least one numeric, category or date column. The dataset preview below is still available.</p></div>;
  return (
    <section aria-label="Automatic charts">
      <h2 className="section-title">Auto-generated Charts</h2>
      <div className="grid grid--2">
        {specs.map((s) => <AutoChart key={s.id} spec={s} rows={rows} />)}
      </div>
    </section>
  );
}
