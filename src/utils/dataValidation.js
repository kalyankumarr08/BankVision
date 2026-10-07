import { num } from './format';

/** Friendly data-quality messages for a prepared sheet. level: error | warning | info */
export function validateDataset({ columns, rowCount, headerIssues = [], truncated = 0 }) {
  const issues = [];
  if (rowCount === 0) {
    issues.push({ level: 'error', title: 'Empty worksheet', message: 'This sheet has a header row but no data rows, so there is nothing to visualize.' });
    return issues;
  }
  for (const h of headerIssues) issues.push({ level: 'warning', title: h.title, message: h.message });
  if (truncated) issues.push({ level: 'warning', title: 'Very large sheet', message: `Only the first ${num(rowCount)} rows were loaded to keep the dashboard responsive (${num(truncated)} additional rows were skipped).` });

  for (const c of columns) {
    if (c.type === 'empty') {
      issues.push({ level: 'warning', title: 'Empty column', column: c.name, message: `${c.name} has no values and is ignored.` });
      continue;
    }
    if (c.missingPct >= 40) {
      issues.push({ level: 'warning', title: 'Excessive missing values', column: c.name, message: `${c.name} is missing in ${c.missingPct.toFixed(1)}% of rows. Charts using this column will ignore empty values.` });
    } else if (c.missingPct >= 5) {
      issues.push({ level: 'warning', title: 'Missing values', column: c.name, message: `${c.name} contains ${c.missingPct.toFixed(1)}% missing values. Charts using this column will ignore empty values.` });
    }
    if (c.type === 'numeric' && c.invalid > 0) {
      issues.push({ level: 'warning', title: 'Non-numeric values', column: c.name, message: `${c.name} has ${num(c.invalid)} non-numeric value${c.invalid === 1 ? '' : 's'} (they are ignored in calculations).` });
    }
    if (c.type === 'date' && c.invalid > 0) {
      issues.push({ level: 'warning', title: 'Invalid dates', column: c.name, message: `${c.name} has ${num(c.invalid)} value${c.invalid === 1 ? '' : 's'} that could not be read as a date (they are ignored in date filters and trends).` });
    }
  }
  const usable = columns.filter((c) => c.type !== 'empty');
  if (!usable.some((c) => c.type === 'numeric' || c.type === 'category' || c.type === 'date')) {
    issues.push({ level: 'info', title: 'Limited chart options', message: 'No numeric, category or date columns were found, so only the dataset preview is available.' });
  }
  return issues;
}
