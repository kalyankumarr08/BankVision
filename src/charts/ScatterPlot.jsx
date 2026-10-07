import { memo } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import ChartTooltip from './ChartTooltip';

/** Numeric-vs-numeric scatter. data: [{ x, y }] */
function ScatterPlot({ data, xName, yName, xAxisFormat, yAxisFormat, xFormat, yFormat, height = 280 }) {
  const { palette } = useTheme();
  const tick = { fill: palette.axis, fontSize: 12 };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name={xName} tick={tick} tickLine={false} axisLine={{ stroke: palette.grid }} tickFormatter={xAxisFormat} />
        <YAxis type="number" dataKey="y" name={yName} tick={tick} tickLine={false} axisLine={false} width={60} tickFormatter={yAxisFormat} />
        <Tooltip cursor={{ strokeDasharray: '3 3', stroke: palette.axis }} content={({ active, payload }) => (active && payload?.length ? <ChartTooltip active rows={[[xName, xFormat(payload[0].payload.x)], [yName, yFormat(payload[0].payload.y)]]} /> : null)} />
        <Scatter data={data} fill={palette.series[0]} fillOpacity={0.5} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default memo(ScatterPlot);
