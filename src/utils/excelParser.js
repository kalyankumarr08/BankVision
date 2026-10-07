import * as XLSX from 'xlsx';
import { detectColumn, isMissing, parseNumber, toDateValue, prettyName } from './columnDetector';
import { validateDataset } from './dataValidation';

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // hard limit
export const RECOMMENDED_BYTES = 25 * 1024 * 1024;
export const MAX_ROWS = 200000; // rows kept per sheet
const SKIP_SHEET = /dictionary|readme|notes?$|instructions?|about|cover|legend/i;

export class UploadError extends Error {
  constructor(message, title = 'Unable to read this Excel file.') {
    super(message);
    this.title = title;
  }
}
const UNREADABLE = 'Please upload a valid .xlsx or .xls file.';

export const formatBytes = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const tick = () => new Promise((r) => setTimeout(r, 30)); // lets React paint progress between heavy steps

export function checkFile(file) {
  if (!file) throw new UploadError('Please choose an .xlsx or .xls file.', 'No file selected');
  if (!/\.(xlsx|xls)$/i.test(file.name)) throw new UploadError(UNREADABLE, 'Unsupported file type');
  if (file.size === 0) throw new UploadError(UNREADABLE, 'This file is empty');
  if (file.size > MAX_FILE_BYTES) throw new UploadError(`This file is ${formatBytes(file.size)}. Please upload a file under ${formatBytes(MAX_FILE_BYTES)} so it can be analyzed in your browser.`, 'File is too large');
}

/** Reads a workbook entirely in the browser. Resolves to raw sheets (header + rows as arrays). */
export function readWorkbook(buffer) {
  // Real workbooks are ZIP archives (.xlsx, starts "PK") or OLE2 files (.xls, starts D0 CF 11 E0).
  const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  const isOle = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
  if (!isZip && !isOle) throw new UploadError(UNREADABLE);
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  } catch {
    throw new UploadError(UNREADABLE);
  }
  if (!wb?.SheetNames?.length) throw new UploadError('The workbook does not contain any worksheets.', 'This workbook is empty');

  const sheets = wb.SheetNames.map((name) => {
    let aoa = [];
    try {
      aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
    } catch {
      aoa = [];
    }
    const headerRow = aoa[0] ?? [];
    let width = headerRow.length;
    for (const r of aoa) width = Math.max(width, r.length);

    const headerIssues = [];
    const seen = new Map();
    const headers = [];
    for (let i = 0; i < width; i += 1) {
      let h = isMissing(headerRow[i]) ? '' : String(headerRow[i]).trim();
      if (!h) {
        h = `Column ${i + 1}`;
        headerIssues.push({ title: 'Missing header', message: `Column ${i + 1} has no header, so it was named “${h}”.` });
      }
      const k = h.toLowerCase();
      if (seen.has(k)) {
        const n = seen.get(k) + 1;
        seen.set(k, n);
        const renamed = `${h}_${n}`;
        headerIssues.push({ title: 'Duplicate column name', message: `The column name “${h}” appears more than once; the extra copy was renamed “${renamed}”.` });
        h = renamed;
      } else seen.set(k, 1);
      headers.push(h);
    }
    let dataRows = aoa.slice(1);
    const truncated = Math.max(0, dataRows.length - MAX_ROWS);
    if (truncated) dataRows = dataRows.slice(0, MAX_ROWS);
    return { name, headers, dataRows, rowCount: dataRows.length, colCount: headers.length, headerIssues, truncated };
  });

  return sheets;
}

/** Most relevant sheet: skips dictionary-style sheets, prefers the richest data. */
export function pickDefaultSheet(sheets) {
  const usable = sheets.filter((s) => s.rowCount > 0 && s.colCount > 0);
  const pool = usable.filter((s) => !SKIP_SHEET.test(s.name));
  const list = pool.length ? pool : usable;
  if (!list.length) return null;
  return [...list].sort((a, b) => b.rowCount * Math.min(b.colCount, 12) - a.rowCount * Math.min(a.colCount, 12))[0].name;
}

const SHEET_PLACEHOLDER = /^(sheet|table|data|worksheet)\s*\d*$/i;

/** "Customers" -> { entity: 'Customers', singular: 'Customer' }; generic sheet names -> Records */
export function entityFromSheet(sheetName) {
  const clean = prettyName(sheetName);
  if (!clean || SHEET_PLACEHOLDER.test(clean) || !/s$/i.test(clean)) return { entity: 'Records', singular: 'Record' };
  return { entity: clean, singular: clean.replace(/ies$/i, 'y').replace(/(sses|ches|xes)$/i, (m) => m.slice(0, -2)).replace(/s$/i, '') };
}

/**
 * Builds the typed dataset for one sheet: detects every column, converts cells to
 * their detected type (numbers, 'YYYY-MM-DD' dates, text categories) and validates.
 */
export function buildDataset(sheet) {
  const { headers, dataRows } = sheet;
  const cols = headers.map((h, i) => detectColumn(h, dataRows.map((r) => r[i]), i));
  const rows = dataRows.map((r, ri) => {
    const o = { __i: ri };
    for (const c of cols) {
      const v = r[c.index];
      if (c.type === 'numeric') o[c.key] = parseNumber(v);
      else if (c.type === 'date') o[c.key] = toDateValue(v, c.serial || /date/i.test(c.name));
      else if (isMissing(v)) o[c.key] = null;
      else if (c.type === 'category') o[c.key] = v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim();
      else o[c.key] = v instanceof Date ? toDateValue(v) : typeof v === 'string' ? v.trim() : v;
    }
    return o;
  });
  const issues = validateDataset({ columns: cols, rowCount: rows.length, headerIssues: sheet.headerIssues, truncated: sheet.truncated });
  return { sheetName: sheet.name, ...entityFromSheet(sheet.name), columns: cols, rows, issues, rowCount: rows.length };
}
