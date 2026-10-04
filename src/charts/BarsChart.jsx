import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import ChartTooltip from './ChartTooltip';

/**
 * Vertical or horizontal bar chart.
 * bars: [{ key, name, color? }]; tooltipRows(datum) -> [[label, value, color?]]
 * colorByPoint → each bar gets its own palette colour (single-series only)
 */
function BarsChart({ data, bars, xKey = 'name', layout = 'vertical', axisFormat, tooltipRows, onBarClick, height = 280, colorByPoint = false, yWidth = 120 }) {
  const { palette } = useTheme();
  const horizontal = layout === 'horizontal';
  const tick = { fill: palette.axis, fontSize: 12 };
  const clickable = Boolean(onBarClick);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap={horizontal ? '24%' : '28%'}>
        <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={tick} tickLine={false} axisLine={false} tickFormatter={axisFormat} />
            <YAxis type="category" dataKey={xKey} tick={tick} tickLine={false} axisLine={false} width={yWidth} interval={0} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={{ stroke: palette.grid }} interval={0} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={56} tickFormatter={axisFormat} />
          </>
        )}
        <Tooltip cursor={{ fill: palette.grid, opacity: 0.45 }} content={({ active, payload }) => <ChartTooltip active={active} title={payload?.[0]?.payload[xKey]} rows={payload?.length ? tooltipRows(payload[0].payload) : []} />} />
        {bars.map((b, bi) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color ?? palette.series[bi]} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} animationDuration={500} cursor={clickable ? 'pointer' : undefined} onClick={clickable ? (d) => onBarClick(d.payload ?? d) : undefined}>
            {colorByPoint && data.map((d, i) => <Cell key={d[xKey]} fill={palette.series[i % palette.series.length]} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(BarsChart);
