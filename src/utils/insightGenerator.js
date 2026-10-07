import { groupAgg, numericStats, pearson, timeSeries, fmtValue, measureTitle, rankedNumeric } from './dataAnalysis';
import { rankedCategories, primaryDate } from './chartRecommendation';
import { num, pct } from './format';

const AGE_BANDS = [['Under 25', 0, 24], ['25–34', 25, 34], ['35–44', 35, 44], ['45–54', 45, 54], ['55 and above', 55, 200]];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const NO_INSIGHT = 'Not enough data available to generate this insight.';

/** Every sentence is computed from the rows passed in — nothing is hard-coded. */
export function generateInsights(rows, columns, { entity, singular }) {
  const out = [];
  if (!rows.length) return out;
  const total = rows.length;
  const cats = rankedCategories(columns);
  const nums = rankedNumeric(columns);
  const money = nums.find((c) => c.role === 'money');
  const lower = entity.toLowerCase();

  // Largest category by number of rows
  cats.slice(0, 3).forEach((c) => {
    const { data } = groupAgg(rows, c.key, null, 'count', 3);
    if (!data.length || data[0].count === total) return;
    const top = data[0];
    const share = (top.count / rows.filter((r) => r[c.key] != null).length) * 100;
    out.push({ id: `cat-${c.key}`, title: `Top ${c.label}`, text: `${top.name} has the highest number of ${lower} by ${c.label.toLowerCase()} — ${num(top.count)} rows (${pct(share)} of those with a value).` });
  });

  // Category with the largest total of the main money measure
  if (money && cats[0]) {
    const c = cats[0];
    const { data } = groupAgg(rows, c.key, money.key, /income|salary/i.test(money.name) ? 'avg' : 'sum', 3);
    if (data.length > 1 && data[0].value > 0) {
      const avg = /income|salary/i.test(money.name);
      out.push({ id: `money-${c.key}`, title: `${measureTitle(money, singular)} leader`, text: `${data[0].name} ranks first for ${avg ? 'average' : 'total'} ${measureTitle(money, singular).toLowerCase()} at ${fmtValue(money, data[0].value)}, ahead of ${data[1].name} (${fmtValue(money, data[1].value)}).` });
    }
  }

  // Averages of key numeric columns
  nums.filter((c) => c.role === 'money' || c.role === 'rate').slice(0, 2).forEach((c) => {
    const s = numericStats(rows, c.key);
    if (s && s.count >= 3) out.push({ id: `avg-${c.key}`, title: `Average ${c.label}`, text: `Average ${measureTitle(c, singular).toLowerCase()} is ${fmtValue(c, s.avg)} (median ${fmtValue(c, s.median)}, range ${fmtValue(c, s.min)} to ${fmtValue(c, s.max)}).` });
  });

  // Peak period
  const dateCol = primaryDate(columns);
  if (dateCol) {
    const flow = money && !/income|salary|limit|price/i.test(money.name) ? money : null;
    const { data, gran } = timeSeries(rows, dateCol.key, [{ key: flow?.key ?? null, agg: flow ? 'sum' : 'count' }]);
    if (data.length >= 3) {
      const peak = data.reduce((a, b) => (b.s0 > a.s0 ? b : a));
      const when = gran === 'month' ? `${MONTHS[Number(peak.bucket.slice(5, 7)) - 1]} ${peak.bucket.slice(0, 4)}` : gran === 'year' ? peak.bucket : peak.label;
      out.push({ id: 'peak', title: 'Peak period', text: flow ? `Total ${measureTitle(flow, singular).toLowerCase()} is highest in ${when} at ${fmtValue(flow, peak.s0)}.` : `${entity} activity is highest in ${when} with ${num(peak.s0)} rows.` });
    }
  }

  // Age group
  const age = nums.find((c) => c.role === 'age');
  if (age) {
    const counts = AGE_BANDS.map(([label, lo, hi]) => [label, rows.filter((r) => typeof r[age.key] === 'number' && r[age.key] >= lo && r[age.key] <= hi).length]);
    const best = counts.reduce((a, b) => (b[1] > a[1] ? b : a));
    const known = counts.reduce((s, c) => s + c[1], 0);
    if (known >= 10 && best[1] > 0) out.push({ id: 'age', title: 'Largest age group', text: `${best[0] === 'Under 25' || best[0] === '55 and above' ? best[0] : `Ages ${best[0]}`} represent the largest ${lower === 'records' ? 'group' : `${lower} group`}: ${pct((best[1] / known) * 100)} of rows with an age.` });
  }

  // Strongest correlation
  const cand = nums.filter((c) => c.role !== 'age' || nums.length < 3).slice(0, 5);
  let best = null;
  for (let i = 0; i < cand.length; i += 1) for (let j = i + 1; j < cand.length; j += 1) {
    const r = pearson(rows, cand[i].key, cand[j].key);
    if (r != null && (!best || Math.abs(r) > Math.abs(best.r))) best = { r, a: cand[i], b: cand[j] };
  }
  if (best && Math.abs(best.r) >= 0.5) out.push({ id: 'corr', title: 'Relationship found', text: `${best.a.label} and ${best.b.label} show a ${Math.abs(best.r) >= 0.75 ? 'strong' : 'moderate'} ${best.r > 0 ? 'positive' : 'negative'} relationship (correlation ${best.r.toFixed(2)}).` });

  // Data completeness
  const worst = columns.filter((c) => c.type !== 'empty' && c.missingPct >= 5).sort((a, b) => b.missingPct - a.missingPct)[0];
  if (worst) out.push({ id: 'missing', title: 'Data completeness', text: `${worst.label} is the most incomplete column, missing in ${pct(worst.missingPct)} of rows.` });

  return out.slice(0, 9);
}

