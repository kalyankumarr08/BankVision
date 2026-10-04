const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** ₹1,25,000 — full Indian digit grouping */
export const inr = (v) => `${n(v) < 0 ? '-' : ''}₹${Math.round(Math.abs(n(v))).toLocaleString('en-IN')}`;

/** ₹1.25 Cr / ₹4.50 L / ₹25,000 — compact Indian notation */
export function inrCompact(v, digits = 2) {
  const x = n(v);
  const a = Math.abs(x);
  const sign = x < 0 ? '-' : '';
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(digits)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(digits)} L`;
  return inr(x);
}

export const num = (v) => Math.round(n(v)).toLocaleString('en-IN');
export const pct = (v, d = 1) => `${n(v).toFixed(d)}%`;
export const signedPct = (v, d = 1) => `${n(v) > 0 ? '+' : ''}${n(v).toFixed(d)}%`;

export function fmtDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = String(ymd).split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** '2025-03' -> "Mar ’25" */
export function monthLabel(ym) {
  const [y, m] = String(ym).split('-');
  return `${MONTHS[Number(m) - 1]} ’${y.slice(2)}`;
}

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
