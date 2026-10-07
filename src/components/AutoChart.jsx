import { memo, useMemo } from 'react';
import ChartCard from './ChartCard';
import BarsChart from '../charts/BarsChart';
import DonutChart from '../charts/DonutChart';
import TrendChart from '../charts/TrendChart';
import ScatterPlot from '../charts/ScatterPlot';
import { useTheme } from '../context/ThemeContext';
import { buildChartData } from '../utils/chartRecommendation';
import { axisFormatter, fmtValue } from '../utils/dataAnalysis';
import { num } from '../utils/format';

const fmtOf = (spec) => (spec.y ? (v) => fmtValue(spec.y, v) : (v) => num(v));

function ChartBody({ spec, built, palette }) {
  const { data } = built;
  switch (spec.type) {
    case 'donut':
      return <DonutChart data={data} formatValue={num} centerLabel={spec.cat.label} centerValue={num(data.reduce((s, d) => s + d.value, 0))} />;
    case 'scatter':
      return (
        <ScatterPlot data={data} xName={spec.xCol.label} yName={spec.yCol.label} xAxisFormat={axisFormatter(spec.xCol)} yAxisFormat={axisFormatter(spec.yCol)} xFormat={(v) => fmtValue(spec.xCol, v)} yFormat={(v) => fmtValue(spec.yCol, v)} />
      );
    case 'line':
    case 'area': {
      const series = spec.series.map((s, i) => ({ key: `s${i}`, name: s.col.label, type: spec.type === 'area' ? 'area' : 'line', color: palette.series[i] }));
      const col = spec.series[0].col;
      return (
        <TrendChart
          data={data}
          series={series}
          axisFormat={spec.series[0].agg === 'count' ? axisFormatter({ role: 'count' }) : axisFormatter(col)}
          tooltipRows={(p) => [...spec.series.map((s, i) => [s.col.label, s.agg === 'count' ? num(p[`s${i}`]) : fmtValue(s.col, p[`s${i}`]), palette.series[i]]), ['Rows', num(p.count)]]}
        />
      );
    }
    default: {
      const fmt = fmtOf(spec);
      const longest = data.reduce((m, d) => Math.max(m, String(d.name).length), 0);
      const horizontal = !spec.hist && (data.length > 5 || (data.length > 3 && longest > 9));
      return (
        <BarsChart
          data={data}
          bars={[{ key: 'value', name: spec.y?.label ?? 'Rows' }]}
          layout={horizontal ? 'horizontal' : 'vertical'}
          colorByPoint={!spec.hist && data.length <= 6}
          axisFormat={spec.y ? axisFormatter(spec.y) : axisFormatter({ role: 'count' })}
          yWidth={Math.min(150, Math.max(60, longest * 7))}
          height={horizontal ? Math.max(280, data.length * 30 + 30) : 280}
          tooltipRows={(d) => spec.hist ? [['Range', d.range], ['Rows', num(d.value)]] : [[spec.y ? `${spec.agg === 'sum' ? 'Total' : 'Average'} ${spec.y.label}` : 'Rows', spec.y ? fmt(d.value) : num(d.value)], ...(spec.y ? [['Rows', num(d.count)]] : [])]}
        />
      );
    }
  }
}

function AutoChart({ spec, rows }) {
  const { palette } = useTheme();
  const built = useMemo(() => buildChartData(spec, rows), [spec, rows]);
  const empty = !built.data.length;
  let subtitle = spec.subtitle;
  if (spec.type === 'bar' && !spec.hist && built.total > 10) subtitle = `Top 10 of ${num(built.total)}`;
  if (spec.type === 'donut' && built.total > 6) subtitle = `Top 6 of ${num(built.total)}`;
  if (spec.type === 'scatter') subtitle = built.total > built.data.length ? `Sample of ${num(built.data.length)} of ${num(built.total)} points` : `${num(built.total)} points`;
  if (spec.type === 'scatter' || spec.type === 'line' || spec.type === 'area') subtitle = [subtitle, spec.type !== 'scatter' && built.gran ? `by ${built.gran}` : null].filter(Boolean).join(' · ');
  return (
    <ChartCard title={spec.title} subtitle={subtitle} description={`${spec.title}${subtitle ? `, ${subtitle}` : ''}`}>
      {empty ? <p className="muted chart-empty">Not enough data available to draw this chart for the current selection.</p> : <ChartBody spec={spec} built={built} palette={palette} />}
    </ChartCard>
  );
}

export default memo(AutoChart);
