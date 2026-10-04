// Generic, reusable aggregation helpers (no React, no banking rules).
export const sum = (arr, f) => {
  let s = 0;
  for (const x of arr) s += Number(f(x)) || 0;
  return s;
};

export function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (k == null || k === '') continue;
    const bucket = m.get(k);
    if (bucket) bucket.push(x);
    else m.set(k, [x]);
  }
  return m;
}

/** Mean of valid numeric values only (valid zeros kept; null/blank excluded). */
export function avgValid(arr, f) {
  let s = 0;
  let c = 0;
  for (const x of arr) {
    const v = f(x);
    if (v == null || v === '' || !Number.isFinite(Number(v))) continue;
    s += Number(v);
    c += 1;
  }
  return c ? s / c : 0;
}

export const share = (part, total) => (total ? (part / total) * 100 : 0);
export const pctChange = (cur, prev) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);

export function addMonths(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

export function monthRange(from, to) {
  const out = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function bucketLabel(value, bands) {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  const b = bands.find(([, lo, hi]) => v >= lo && v < hi) ?? bands.find(([, lo, hi]) => v >= lo && v <= hi);
  return b ? b[0] : null;
}
