import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import { inrCompact, num, pct } from '../utils/format';
import Sparkline from './Sparkline';

const FORMATTERS = { number: num, inr: (v) => inrCompact(v), pct: (v) => pct(v) };

function KpiCard({ label, value, format = 'number', delta, deltaUnit = '%', series, hint, icon: Icon }) {
  const animated = useCountUp(value);
  const up = delta != null && delta >= 0;
  return (
    <article className="card kpi" title={hint}>
      <div className="kpi__top">
        <span className="kpi__label">{label}</span>
        {Icon && (
          <span className="kpi__icon" aria-hidden="true">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="kpi__value" aria-label={`${label}: ${FORMATTERS[format](value)}`}>
        {FORMATTERS[format](animated)}
      </div>
      <div className="kpi__bottom">
        {delta != null && Number.isFinite(delta) ? (
          <span className={`delta ${up ? 'delta--up' : 'delta--down'}`}>
            {up ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {up ? '+' : ''}
            {delta.toFixed(1)}
            {deltaUnit === 'pp' ? ' pp' : '%'}
            <span className="muted"> · 3 mo</span>
          </span>
        ) : (
          <span className="muted">—</span>
        )}
        <Sparkline data={series} tone={up ? 'up' : 'down'} />
      </div>
    </article>
  );
}

export default memo(KpiCard);
