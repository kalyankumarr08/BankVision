import * as XLSX from 'xlsx';
import { REQUIRED_SHEETS } from '../data/schema';
import { buildModel } from './model';

/** Excel serial number (or date string) -> 'YYYY-MM-DD' without timezone drift. */
function toYMD(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400) * 1000).toISOString().slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Parse an .xlsx ArrayBuffer into the analytics model. Throws readable errors. */
export function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const raw = {};
  for (const [sheet, spec] of Object.entries(REQUIRED_SHEETS)) {
    const ws = wb.Sheets[sheet];
    if (!ws) throw new Error(`Missing required sheet: ${sheet}`);
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    if (!rows.length) throw new Error(`Sheet "${sheet}" has no rows`);
    const missing = spec.required.filter((c) => !(c in rows[0]));
    if (missing.length) throw new Error(`Sheet "${sheet}" is missing column(s): ${missing.join(', ')}`);
    const seen = new Set();
    raw[sheet] = rows.filter((r) => {
      const id = r[spec.id];
      if (id == null || id === '' || seen.has(id)) return false; // drop blank / duplicate IDs
      seen.add(id);
      return true;
    });
    for (const r of raw[sheet]) for (const c of spec.dates) r[c] = toYMD(r[c]);
  }
  return buildModel(raw);
}
