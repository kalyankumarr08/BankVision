import { byType, rankedNumeric, measureTitle, groupAgg, timeSeries, histogram, scatterPoints, axisFormatter } from './dataAnalysis';


/**
 * Chart recommendation engine. Looks only at column metadata (types + roles) and returns
 * chart specs: { id, type: 'line'|'area'|'bar'|'donut'|'scatter', title, subtitle, ... }.
 * Data for a spec is built separately (buildChartData) so filters can re-run it cheaply.
 */
const CAT_PRIORITY = /state|region|city|segment|type|status|gender|channel|category|branch|class|mode|group/i;
const FLOW_NAME = /deposit|withdraw|credit|debit|inflow|outflow|income|expense/i;
const PAIR_ROLES = { 'money|money': 5, 'age|money': 4, 'money|rate': 4, 'score|money': 3, 'money|number': 2, 'rate|score': 2, 'age|score': 2 };
const pairScore = (a, b) => PAIR_ROLES[`${a.role}|${b.role}`] ?? PAIR_ROLES[`${b.role}|${a.role}`] ?? 1;

const aggFor = (c) => (c.role === 'money' && !/income|salary|limit|price/i.test(c.name) ? 'sum' : 'avg');
const aggWord = (agg) => (agg === 'sum' ? 'Total' : 'Average');

export function rankedCategories(columns) {
  return byType(columns, 'category')
    .filter((c) => c.unique >= 2 && c.unique <= 40)
    .sort((a, b) => Number(CAT_PRIORITY.test(b.name)) - Number(CAT_PRIORITY.test(a.name)) || a.missingPct - b.missingPct || a.unique - b.unique);
}

export function primaryDate(columns) {
  const score = (c) => (/date/i.test(c.name) ? 2 : 0) + (/transaction|txn|order|payment|application|open|join/i.test(c.name) ? 1 : 0) + (/^month$/i.test(c.name) ? -2 : 0);
  return byType(columns, 'date').sort((a, b) => score(b) - score(a) || b.nonNull - a.nonNull)[0] ?? null;
}

export function recommendCharts(columns, { entity, singular }) {
  const dates = byType(columns, 'date');
  const cats = rankedCategories(columns);
  const nums = rankedNumeric(columns);
  const money = nums.filter((c) => c.role === 'money');
  const charts = [];
  const dateCol = primaryDate(columns);

  // 1. Date + numeric -> trend lines/areas
  if (dateCol) {
    const flows = money.filter((c) => FLOW_NAME.test(c.name) && !/income/i.test(c.name));
    if (flows.length >= 2 && flows.length <= 4) {
      charts.push({ id: 'trend-flows', type: 'area', title: `${flows.slice(0, 3).map((c) => c.label).join(' vs ')} Trend`, subtitle: 'Total per period', x: dateCol.key, series: flows.slice(0, 3).map((c) => ({ key: c.key, agg: 'sum', col: c })) });
    } else if (money[0]) {
      const c = money[0];
      const agg = aggFor(c);
      charts.push({ id: `trend-${c.key}`, type: 'line', title: `${measureTitle(c, singular)} Trend`, subtitle: `${aggWord(agg)} per period`, x: dateCol.key, series: [{ key: c.key, agg, col: c }] });
    } else if (nums[0]) {
      const c = nums[0];
      charts.push({ id: `trend-${c.key}`, type: 'line', title: `${measureTitle(c, singular)} Trend`, subtitle: 'Average per period', x: dateCol.key, series: [{ key: c.key, agg: 'avg', col: c }] });
    }
    charts.push({ id: 'trend-count', type: 'area', title: `${entity} Over Time`, subtitle: 'Number of rows per period', x: dateCol.key, series: [{ key: null, agg: 'count', col: { label: entity, role: 'count' } }] });
  }

  // 2. Category distribution -> donut (few categories) or bar
  const donuts = cats.filter((c) => c.unique <= 6).slice(0, 2);
  donuts.forEach((c) => charts.push({ id: `donut-${c.key}`, type: 'donut', title: `${entity} Distribution by ${c.label}`, x: c.key, cat: c, agg: 'count' }));

  // 3. Category comparison -> bar (counts, then category x numeric)
  const countBars = cats.filter((c) => !donuts.includes(c) && c.unique >= 3).slice(0, 2);
  countBars.forEach((c) => charts.push({ id: `bar-${c.key}`, type: 'bar', title: `${entity} by ${c.label}`, x: c.key, cat: c, agg: 'count' }));
  const bestCats = cats.slice(0, 3);
  const measures = (money.length ? money : nums).slice(0, 3);
  bestCats.slice(0, 2).forEach((c, i) => {
    const m = measures[i] ?? measures[0];
    if (!m) return;
    const agg = aggFor(m);
    charts.push({ id: `bar-${c.key}-${m.key}`, type: 'bar', title: `${aggWord(agg)} ${measureTitle(m, singular)} by ${c.label}`, x: c.key, cat: c, y: m, agg });
  });

  // 4. Numeric + numeric -> scatter
  const cand = nums.slice(0, 5);
  const pairs = [];
  for (let i = 0; i < cand.length; i += 1) for (let j = i + 1; j < cand.length; j += 1) pairs.push([cand[i], cand[j], pairScore(cand[i], cand[j])]);
  pairs.sort((a, b) => b[2] - a[2]);
  pairs.slice(0, 2).forEach(([a, b]) => charts.push({ id: `scatter-${a.key}-${b.key}`, type: 'scatter', title: `${a.label} vs ${b.label}`, x: a.key, y: b.key, xCol: a, yCol: b }));

  // 5. Distribution of the most important numeric column
  const ageCol = nums.find((c) => c.role === 'age');
  const dist = ageCol ?? money[0] ?? nums[0];
  if (dist) charts.push({ id: `hist-${dist.key}`, type: 'bar', hist: true, title: `${measureTitle(dist, singular)} Distribution`, subtitle: 'Number of rows per range', x: dist.key, col: dist, agg: 'count' });

  // De-duplicate and cap
  const seen = new Set();
  return charts.filter((c) => (seen.has(c.id) ? false : seen.add(c.id))).slice(0, 10);
}

/** Computes the data behind one chart spec from the (filtered) rows. */
export function buildChartData(spec, rows) {
  switch (spec.type) {
    case 'donut': {
      const { data, total } = groupAgg(rows, spec.x, null, 'count', 6);
      return { data: data.map((d) => ({ name: d.name, value: d.value })), total };
    }
    case 'bar': {
      if (spec.hist) return { data: histogram(rows, spec.x, 10, axisFormatter(spec.col)) };
      const { data, total } = groupAgg(rows, spec.x, spec.y?.key ?? null, spec.agg, 10);
      return { data, total };
    }
    case 'line':
    case 'area': {
      const { data, gran } = timeSeries(rows, spec.x, spec.series.map((s) => ({ key: s.key, agg: s.agg })));
      return { data, gran };
    }
    case 'scatter': {
      const { points, total } = scatterPoints(rows, spec.x, spec.y);
      return { data: points, total };
    }
    default:
      return { data: [] };
  }
}

