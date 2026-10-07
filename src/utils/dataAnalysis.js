import { inrCompact, num, monthLabel, fmtDate } from './format';
import { prettyName } from './columnDetector';

export const usableColumns = (columns) => columns.filter((c) => c.type !== 'empty');
export const byType = (columns, type) => columns.filter((c) => c.type === type);

/* ---------- formatting by column role ---------- */
const dec = (v) => Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export function fmtValue(col, v) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (col?.role === 'money') return inrCompact(v);
  if (col?.role === 'rate') return `${dec(v)}%`;
  return Number.isInteger(v) ? num(v) : dec(v);
}
const compact = (v, digits = 1) => {
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  if (a >= 1e7) return `${s}${(a / 1e7).toFixed(digits).replace(/\.0+$/, '')}Cr`;
  if (a >= 1e5) return `${s}${(a / 1e5).toFixed(digits).replace(/\.0+$/, '')}L`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(digits).replace(/\.0+$/, '')}K`;
  return `${s}${Number(a.toFixed(a >= 100 ? 0 : a >= 10 ? 1 : 2))}`;
};
export const axisFormatter = (col) => (v) => {
  if (col?.role === 'age' || col?.role === 'count') return compact(Math.round(v));
  return col?.role === 'money' ? `₹${compact(v)}` : col?.role === 'rate' ? `${compact(v)}%` : compact(v);
};

/** Generic measure names ("Amount") get the entity prefix: "Transaction Amount". */
export function measureTitle(col, singular) {
  const generic = /^(amount|value|total|balance)$/i.test(col.label);
  return generic && singular && singular !== 'Record' && !/balance/i.test(col.label) ? `${singular} ${col.label}` : col.label;
}

/* ---------- filtering ---------- */
export function applyFilters(rows, { cats = {}, dateKey, from, to }) {
  const entries = Object.entries(cats).filter(([, v]) => v);
  const useDate = dateKey && (from || to);
  if (!entries.length && !useDate) return rows;
  return rows.filter((r) => {
    for (const [k, v] of entries) if (r[k] !== v) return false;
    if (useDate) {
      const d = r[dateKey];
      if (!d || (from && d < from) || (to && d > to)) return false;
    }
    return true;
  });
}

/* ---------- statistics ---------- */
export function numericStats(rows, key) {
  const vals = [];
  for (const r of rows) {
    const v = r[key];
    if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
  }
  if (!vals.length) return null;
  let total = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of vals) {
    total += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { count: vals.length, total, avg: total / vals.length, min, max, median };
}

export function pearson(rows, xKey, yKey) {
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  const step = Math.max(1, Math.floor(rows.length / 5000));
  for (let i = 0; i < rows.length; i += step) {
    const x = rows[i][xKey];
    const y = rows[i][yKey];
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    n += 1; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
  }
  if (n < 20) return null;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return den ? (n * sxy - sx * sy) / den : null;
}

/* ---------- aggregation for charts ---------- */
/** Group by category. agg: 'count' | 'sum' | 'avg'. Returns top `limit` groups sorted desc. */
export function groupAgg(rows, catKey, valKey, agg, limit = 10) {
  const map = new Map();
  for (const r of rows) {
    const c = r[catKey];
    if (c == null) continue;
    let g = map.get(c);
    if (!g) map.set(c, (g = { name: c, count: 0, sum: 0, n: 0 }));
    g.count += 1;
    const v = valKey ? r[valKey] : null;
    if (typeof v === 'number') { g.sum += v; g.n += 1; }
  }
  const out = [...map.values()].map((g) => ({
    name: g.name,
    count: g.count,
    value: agg === 'count' ? g.count : agg === 'sum' ? g.sum : g.n ? g.sum / g.n : 0,
  }));
  out.sort((a, b) => b.value - a.value);
  return { data: out.slice(0, limit), total: out.length };
}

export function pickGranularity(rows, dateKey) {
  let min = '9999';
  let max = '0000';
  for (const r of rows) {
    const d = r[dateKey];
    if (!d) continue;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  if (max < min) return { gran: 'month', min: null, max: null };
  const days = (Date.parse(max) - Date.parse(min)) / 86400000;
  return { gran: days <= 90 ? 'day' : days <= 365 * 6 ? 'month' : 'year', min, max };
}

const bucketLabel = (key, gran) => (gran === 'month' ? monthLabel(key) : gran === 'day' ? fmtDate(key) : key);

/** series: [{ key, agg }] -> [{ bucket, label, s0, s1.. , count }] sorted by time */
export function timeSeries(rows, dateKey, series) {
  const { gran } = pickGranularity(rows, dateKey);
  const cut = gran === 'month' ? 7 : gran === 'year' ? 4 : 10;
  const map = new Map();
  for (const r of rows) {
    const d = r[dateKey];
    if (!d) continue;
    const b = d.slice(0, cut);
    let g = map.get(b);
    if (!g) map.set(b, (g = { bucket: b, count: 0, sums: series.map(() => 0), ns: series.map(() => 0) }));
    g.count += 1;
    series.forEach((s, i) => {
      const v = s.key ? r[s.key] : null;
      if (typeof v === 'number') { g.sums[i] += v; g.ns[i] += 1; }
    });
  }
  const out = [...map.values()].sort((a, b) => (a.bucket < b.bucket ? -1 : 1)).map((g) => {
    const p = { bucket: g.bucket, label: bucketLabel(g.bucket, gran), count: g.count };
    series.forEach((s, i) => {
      p[`s${i}`] = s.agg === 'count' ? g.count : s.agg === 'avg' ? (g.ns[i] ? g.sums[i] / g.ns[i] : 0) : g.sums[i];
    });
    return p;
  });
  return { data: out, gran };
}

export function histogram(rows, key, bins = 10, format = (v) => compact(v)) {
  const vals = [];
  for (const r of rows) if (typeof r[key] === 'number') vals.push(r[key]);
  if (vals.length < 5) return [];
  let min = Infinity, max = -Infinity;
  for (const v of vals) { if (v < min) min = v; if (v > max) max = v; }
  if (min === max) return [];
  const size = (max - min) / bins;
  const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * size);
  const ranges = edges.slice(0, -1).map((e, i) => `${format(e)}–${format(edges[i + 1])}`);
  const short = ranges.some((r) => r.length > 9);
  const out = ranges.map((range, i) => ({ name: short ? format(edges[i]) : range, range, value: 0 }));
  for (const v of vals) out[Math.min(bins - 1, Math.floor((v - min) / size))].value += 1;
  return out;
}

export function scatterPoints(rows, xKey, yKey, max = 700) {
  const pts = [];
  for (const r of rows) if (typeof r[xKey] === 'number' && typeof r[yKey] === 'number') pts.push({ x: r[xKey], y: r[yKey] });
  const step = Math.max(1, Math.ceil(pts.length / max));
  return { points: step === 1 ? pts : pts.filter((_, i) => i % step === 0), total: pts.length };
}

/* ---------- KPIs ---------- */
const ENTITY_ID = /(customer|account|transaction|txn|loan|branch|employee|order|user|client|policy|member)/i;
const AVG_ONLY = /income|salary|limit|price|rate|score|age/i;
const plural = (w) => (/(s|x|ch|sh)$/i.test(w) ? `${w}es` : /[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);
const PRIORITY = { money: 0, rate: 1, score: 2, age: 3, count: 4, number: 5, duration: 6 };

export function rankedNumeric(columns) {
  return byType(columns, 'numeric')
    .filter((c) => c.role !== 'geo')
    .sort((a, b) => (PRIORITY[a.role] ?? 9) - (PRIORITY[b.role] ?? 9) || b.nonNull - a.nonNull);
}

export function buildKpis(rows, columns, { entity, singular }, maxCards = 8) {
  const kpis = [];
  const distinct = (key) => { const s = new Set(); for (const r of rows) if (r[key] != null) s.add(r[key]); return s.size; };

  const idCols = byType(columns, 'id').filter((c) => ENTITY_ID.test(c.name)).slice(0, 2);
  idCols.forEach((c) => {
    const noun = prettyName(c.name).replace(/\s*(ID|Code|No|Number|Ref)$/i, '').trim() || singular;
    const primary = c.unique >= c.nonNull * 0.98;
    kpis.push({ key: `id-${c.key}`, kind: 'entity', label: `${primary ? 'Total' : 'Unique'} ${plural(noun)}`, value: distinct(c.key), format: 'number', hint: `Distinct values of ${c.name}` });
  });
  if (!kpis.length) kpis.push({ key: 'rows', kind: 'entity', label: `Total ${entity}`, value: rows.length, format: 'number', hint: 'Rows in the selected sheet (after filters)' });

  const nums = rankedNumeric(columns);
  const stats = Object.fromEntries(nums.map((c) => [c.key, numericStats(rows, c.key)]));
  const fmtOf = (c) => (c.role === 'money' ? 'inr' : c.role === 'rate' ? 'pct' : Number.isInteger(stats[c.key]?.avg) ? 'number' : 'dec');
  const totalLabel = (c) => (/^balance$|deposit/i.test(c.name) ? 'Total Deposits' : `Total ${measureTitle(c, singular)}`);
  const avgLabel = (c) => (/balance/i.test(c.name) && !/monthly|avg/i.test(c.name) ? 'Average Account Balance' : `Average ${measureTitle(c, singular)}`);

  const money = nums.filter((c) => c.role === 'money' && stats[c.key]);
  const sums = money.filter((c) => !AVG_ONLY.test(c.name)).slice(0, 3);
  sums.forEach((c) => kpis.push({ key: `sum-${c.key}`, kind: 'sum', label: totalLabel(c), value: stats[c.key].total, format: 'inr', hint: `Sum of ${c.name} (${stats[c.key].count.toLocaleString('en-IN')} values; empty cells ignored)` }));
  money.slice(0, 3).forEach((c) => kpis.push({ key: `avg-${c.key}`, kind: 'avg', label: avgLabel(c), value: stats[c.key].avg, format: 'inr', hint: `Average ${c.name} across ${stats[c.key].count.toLocaleString('en-IN')} values` }));
  nums.filter((c) => c.role !== 'money' && c.role !== 'duration' && stats[c.key]).forEach((c) => kpis.push({ key: `avg-${c.key}`, kind: 'avg', label: `Average ${measureTitle(c, singular)}`, value: stats[c.key].avg, format: fmtOf(c), hint: `Average ${c.name}` }));
  nums.filter((c) => c.role === 'duration' && stats[c.key]).forEach((c) => kpis.push({ key: `avg-${c.key}`, kind: 'avg', label: `Average ${measureTitle(c, singular)}`, value: stats[c.key].avg, format: fmtOf(c), hint: `Average ${c.name}` }));
  return { cards: kpis.slice(0, maxCards), stats, numericColumns: nums };
}

