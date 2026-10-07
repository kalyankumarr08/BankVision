import { useMemo } from 'react';
import InsightCard from './InsightCard';
import { generateInsights, NO_INSIGHT } from '../utils/insightGenerator';

export default function InsightsPanel({ rows, columns, entity, singular }) {
  const insights = useMemo(() => generateInsights(rows, columns, { entity, singular }), [rows, columns, entity, singular]);
  return (
    <section aria-label="Key insights">
      <h2 className="section-title">Key Insights</h2>
      {insights.length ? (
        <div className="grid grid--3">{insights.map((i) => <InsightCard key={i.id} title={i.title} text={i.text} />)}</div>
      ) : (
        <div className="card"><p className="muted">{NO_INSIGHT}</p></div>
      )}
    </section>
  );
}
