// Column type detection: uses BOTH the column name and the actual cell values.
// Types: id | text | numeric | category | date | empty
export const isMissing = (v) => v == null || (typeof v === 'string' && v.trim() === '');

const ACRONYMS = new Set(['id', 'emi', 'npa', 'upi', 'ifsc', 'atm', 'kyc', 'dpd', 'pan', 'neft', 'imps', 'rtgs', 'roi', 'pct', 'ltv']);

/** "Customer_ID" -> "Customer ID", "loan_amount" -> "Loan Amount" */
export function prettyName(name) {
  return String(name)
    .replace(/[_\-.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

const ID_NAME = /(^|[_\s-])(id|uuid|code|ref|reference|key)$|^id$|(^|[_\s-])(no|num|number)$/i;
const TEXT_NAME = /name|email|phone|mobile|address|description|comment|remark|note|ifsc|pincode|pin_code|zip|postal/i;
const DATE_NAME = /date|(^|[_\s])dob($|[_\s])|timestamp|(^|[_\s])(dt|day)($|[_\s])|opened|joined|(^|[_\s])month($|[_\s])/i;
const CATEGORY_HINT = /flag|status|type|class|grade|tier|level|category|segment|rating|gender|region|channel|mode|group/i;
const GEO_NAME = /^(lat|lon|lng|latitude|longitude)$|latitude|longitude/i;

// Semantic role of a numeric column (drives formatting, aggregation and chart choice).
const ROLE_RULES = [
  ['geo', GEO_NAME],
  ['age', /(^|[_\s])age($|[_\s])/i],
  ['rate', /rate|percent|pct|ratio|%|interest|yield/i],
  ['score', /score|rating|rank/i],
  ['duration', /tenure|months|years|days|dpd|duration|term/i],
  ['count', /count|quantity|qty|employees|(^|[_\s])num(ber)?[_\s]of/i],
  ['money', /amount|balance|income|salary|deposit|withdraw|fee|price|revenue|emi|spend|outstanding|target|limit|payment|charge|cost|value|credit|debit|profit|loss|sales|premium|turnover|expense|inflow|outflow/i],
];
export const roleOf = (name) => ROLE_RULES.find(([, re]) => re.test(name))?.[0] ?? 'number';

/** Number from a cell: handles "₹1,25,000", "12.5%", "(500)". Returns null if not numeric. */
export function parseNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean' || v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[₹$€£\s,]/g, '').replace(/%$/, '');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

const pad = (n) => String(n).padStart(2, '0');
const validYMD = (y, m, d) => {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
};
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const MONTH_RE = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i;

/** Date | text -> 'YYYY-MM-DD' (or null). Day-first for dd/mm/yyyy (Indian convention). */
export function parseDate(v) {
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    // Excel date serials are read by SheetJS as local wall-clock times that can drift by a few minutes
    // (historic time-zone offsets). Take the local wall time, nudge 20 min forward, and read its calendar day.
    const wall = v.getTime() - v.getTimezoneOffset() * 60000 + 20 * 60000;
    const d = new Date(Math.floor(wall / 86400000) * 86400000);
    const out = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
    return validYMD(...out) ? ymd(...out) : null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (m) return validYMD(+m[1], +m[2], +m[3]) ? ymd(+m[1], +m[2], +m[3]) : null;
  m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return validYMD(+m[1], +m[2], 1) ? ymd(+m[1], +m[2], 1) : null;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return validYMD(+m[3], +m[2], +m[1]) ? ymd(+m[3], +m[2], +m[1]) : null;
  if (MONTH_RE.test(s) && /\d{4}/.test(s) && s.length <= 24) {
    const t = Date.parse(`${s} UTC`);
    if (!Number.isNaN(t)) {
      const d = new Date(t);
      return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
  }
  return null;
}

/** Excel serial -> 'YYYY-MM-DD' */
export const serialToYMD = (n) => new Date(Math.round((n - 25569) * 86400) * 1000).toISOString().slice(0, 10);
const isSerial = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 20000 && n <= 80000;

export function toDateValue(v, allowSerial) {
  if (allowSerial && isSerial(v)) return serialToYMD(v);
  return parseDate(v);
}

const BOOL_WORDS = new Set(['yes', 'no', 'y', 'n', 'true', 'false', 't', 'f']);

/**
 * Detects the type of one column from its header and every value.
 * Returns a metadata object; does not modify the values.
 */
export function detectColumn(name, values, index) {
  const total = values.length;
  const nonEmpty = [];
  for (const v of values) if (!isMissing(v)) nonEmpty.push(v);
  const base = { key: name, name, label: prettyName(name), index, nonNull: nonEmpty.length, missing: total - nonEmpty.length };
  base.missingPct = total ? (base.missing / total) * 100 : 0;
  if (!nonEmpty.length) return { ...base, type: 'empty', role: null, unique: 0, invalid: 0 };

  // Evenly spread sample keeps detection fast on big sheets
  const step = Math.max(1, Math.floor(nonEmpty.length / 1500));
  const sample = [];
  for (let i = 0; i < nonEmpty.length; i += step) sample.push(nonEmpty[i]);

  const dateHint = DATE_NAME.test(name);
  const dateRatio = sample.filter((v) => toDateValue(v, dateHint) != null).length / sample.length;
  const numRatio = sample.filter((v) => parseNumber(v) != null).length / sample.length;

  const finish = (type, extra = {}) => {
    const role = type === 'numeric' ? roleOf(name) : null;
    let invalid = 0;
    if (type === 'numeric') invalid = nonEmpty.reduce((c, v) => c + (parseNumber(v) == null ? 1 : 0), 0);
    else if (type === 'date') invalid = nonEmpty.reduce((c, v) => c + (toDateValue(v, dateHint) == null ? 1 : 0), 0);
    return { ...base, type, role, invalid, ...extra };
  };

  const distinct = new Set();
  for (const v of nonEmpty) {
    distinct.add(typeof v === 'string' ? v.trim() : v instanceof Date ? v.getTime() : v);
    if (distinct.size > 300000) break;
  }
  const unique = distinct.size;
  const uniqueRatio = unique / nonEmpty.length;

  // 1. Dates (only if the values are not mostly plain numbers, unless the name says "date")
  if (dateRatio >= 0.8 && (dateHint || numRatio < 0.5 || sample.some((v) => v instanceof Date))) return finish('date', { unique, serial: sample.some(isSerial) && sample.every((v) => typeof v === 'number') });

  // 2. Numbers
  if (numRatio >= 0.85) {
    if (ID_NAME.test(name)) return finish('id', { unique });
    if (TEXT_NAME.test(name)) return finish('text', { unique });
    const allInt = sample.every((v) => Number.isInteger(parseNumber(v)));
    if (allInt && unique <= 6 && nonEmpty.length >= 30 && CATEGORY_HINT.test(name)) return finish('category', { unique });
    return finish('numeric', { unique });
  }

  // 3. Text-like columns
  const strings = sample.map((v) => String(v).trim());
  if (ID_NAME.test(name)) return finish('id', { unique });
  const lowered = new Set(strings.map((s) => s.toLowerCase()));
  if (lowered.size <= 3 && [...lowered].every((s) => BOOL_WORDS.has(s))) return finish('category', { unique, boolean: true });
  if (TEXT_NAME.test(name) && unique > 12) return finish('text', { unique });
  if (unique >= 2 && unique <= 50 && (uniqueRatio <= 0.5 || unique <= 8)) return finish('category', { unique });
  if (unique === 1) return finish('category', { unique });
  if (uniqueRatio >= 0.98 && nonEmpty.length > 5) {
    const codeLike = strings.filter((s) => /^[A-Za-z]{0,8}[-_]?\d+$/.test(s)).length / strings.length >= 0.8;
    return finish(codeLike ? 'id' : 'text', { unique });
  }
  return finish('text', { unique });
}
