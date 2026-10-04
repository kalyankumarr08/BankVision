const safe = (v) => {
  if (v == null) return '';
  let s = String(v);
  // Neutralise spreadsheet formula injection for text cells
  if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows, columns) {
  const head = columns.map((c) => safe(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => safe(c.accessor(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const stamp = () => new Date().toISOString().slice(0, 10);
