import { useMemo } from 'react';
import { Hash, Landmark, Percent, Wallet } from 'lucide-react';
import KpiCard from './KpiCard';
import { buildKpis, fmtValue } from '../utils/dataAnalysis';
import { num } from '../utils/format';

const iconFor = (k) => (k.kind === 'entity' ? Hash : k.kind === 'sum' ? Landmark : k.format === 'pct' ? Percent : Wallet);

export default function DynamicKPI({ rows, columns, entity, singular }) {
  const { cards, stats, numericColumns } = useMemo(() => buildKpis(rows, columns, { entity, singular }), [rows, columns, entity, singular]);
  const withStats = numericColumns.filter((c) => stats[c.key]);
  return (
    <section aria-label="Key performance indicators">
      <div className="kpi-grid kpi-grid--4">
        {cards.map((k) => <KpiCard key={k.key} label={k.label} value={k.value} format={k.format} hint={k.hint} sub={k.kind === 'entity' ? 'In the selected data' : k.kind === 'sum' ? 'Sum of all values' : 'Mean of all values'} icon={iconFor(k)} />)}
      </div>
      {withStats.length > 0 && (
        <details className="card stats">
          <summary>Numeric column statistics ({withStats.length})</summary>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Numeric column statistics, scrollable">
            <table className="table">
              <thead><tr>{['Column', 'Count', 'Total', 'Average', 'Median', 'Min', 'Max'].map((h, i) => <th key={h} scope="col" className={i ? 'num' : ''}><span className="th-btn">{h}</span></th>)}</tr></thead>
              <tbody>
                {withStats.map((c) => {
                  const s = stats[c.key];
                  return (
                    <tr key={c.key}>
                      <td>{c.label}</td>
                      <td className="num">{num(s.count)}</td>
                      <td className="num">{fmtValue(c, s.total)}</td>
                      <td className="num">{fmtValue(c, s.avg)}</td>
                      <td className="num">{fmtValue(c, s.median)}</td>
                      <td className="num">{fmtValue(c, s.min)}</td>
                      <td className="num">{fmtValue(c, s.max)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
