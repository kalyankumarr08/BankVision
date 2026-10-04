import { memo } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import ChartTooltip from './ChartTooltip';

/**
 * Responsive area/line chart.
 * series: [{ key, name, type: 'area'|'line', axis: 'left'|'right', color, format }]
 * tooltipRows(point) -> [[label, value, color?]]
 */
function TrendChart({ data, series, axisFormat, rightAxisFormat, tooltipRows, height = 280 }) {
  const { palette } = useTheme();
  const hasRight = series.some((s) => s.axis === 'right');
  const tick = { fill: palette.axis, fontSize: 12 };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 4 : 12, left: 0, bottom: 0 }}>
        <defs>
          {series.filter((s) => s.type === 'area').map((s, i) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? palette.series[i]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color ?? palette.series[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: palette.grid }} minTickGap={24} />
        <YAxis yAxisId="left" tick={tick} tickLine={false} axisLine={false} width={64} tickFormatter={axisFormat} />
        {hasRight && <YAxis yAxisId="right" orientation="right" tick={tick} tickLine={false} axisLine={false} width={40} tickFormatter={rightAxisFormat} />}
        <Tooltip content={({ active, payload }) => <ChartTooltip active={active} title={payload?.[0]?.payload.label} rows={payload?.length ? tooltipRows(payload[0].payload) : []} />} cursor={{ stroke: palette.axis, strokeDasharray: '3 3' }} />
        {series.map((s, i) => {
          const color = s.color ?? palette.series[i];
          return s.type === 'area' ? (
            <Area key={s.key} yAxisId={s.axis ?? 'left'} type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2.2} fill={`url(#fill-${s.key})`} dot={false} activeDot={{ r: 5 }} animationDuration={500} />
          ) : (
            <Line key={s.key} yAxisId={s.axis ?? 'left'} type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={500} />
          );
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default memo(TrendChart);
