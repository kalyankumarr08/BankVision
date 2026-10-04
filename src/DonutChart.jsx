import { memo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import ChartTooltip from './ChartTooltip';
import { pct } from '../utils/format';

/**
 * Donut with a legend that shows both percentage and absolute value.
 * data: [{ name, value, ... }]; formatValue(value) -> string; tooltipRows(datum, share) optional
 */
function DonutChart({ data, formatValue, centerLabel, centerValue, tooltipRows, height = 240 }) {
  const { palette } = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0);
  const sharePct = (v) => (total ? (v / total) * 100 : 0);
  return (
    <div className="donut">
      <div className="donut__plot" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={({ active, payload }) => active && payload?.length ? <ChartTooltip active title={payload[0].payload.name} rows={tooltipRows ? tooltipRows(payload[0].payload, sharePct(payload[0].payload.value)) : [['Value', formatValue(payload[0].payload.value)], ['Share', pct(sharePct(payload[0].payload.value))]]} /> : null} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" animationDuration={500}>
              {data.map((d, i) => <Cell key={d.name} fill={palette.series[i % palette.series.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="donut__center" aria-hidden="true">
            <b>{centerValue}</b>
            <span>{centerLabel}</span>
          </div>
        )}
      </div>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={d.name}>
            <i style={{ background: palette.series[i % palette.series.length] }} />
            <span className="legend__name">{d.name}</span>
            <span className="legend__val">{formatValue(d.value)}</span>
            <span className="legend__pct">{pct(sharePct(d.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(DonutChart);
