import { escapeHtml, inr, inrCompact, num, pct } from './format';

/** Self-contained HTML report reflecting the current filters. */
export function buildReportHtml({ filters, kpis, insights, loans, branches }) {
  const fmt = (k) => (k.format === 'inr' ? inrCompact(k.value) : k.format === 'pct' ? pct(k.value) : num(k.value));
  const rows = (arr) => arr.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="n"' : ''}>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
  const table = (head, body) => `<table><thead><tr>${head.map((h, i) => `<th${i ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows(body)}</tbody></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>BankVision report</title><style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#0f172a;max-width:900px;margin:32px auto;padding:0 20px}
h1{color:#1e3a8a;margin-bottom:4px}h2{margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
.sub{color:#64748b;font-size:14px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.k{border:1px solid #e2e8f0;border-radius:10px;padding:12px}.k b{display:block;font-size:20px;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left}
.n{text-align:right}li{margin:6px 0}</style></head><body>
<h1>BankVision — Analytics Report</h1>
<p class="sub">Generated ${new Date().toLocaleString('en-IN')} · Educational / synthetic dataset</p>
<p class="sub"><b>Filters:</b> ${filters.length ? filters.map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(' · ') : 'None (all data)'}</p>
<h2>Key metrics</h2><div class="grid">${kpis.map((k) => `<div class="k">${escapeHtml(k.label)}<b>${escapeHtml(fmt(k))}</b></div>`).join('')}</div>
<h2>Key insights</h2><ul>${insights.map((i) => `<li>${escapeHtml(i.text)}</li>`).join('') || '<li>No data for the selected filters.</li>'}</ul>
<h2>Loan portfolio by type</h2>${table(['Loan type', 'Loans', 'Amount', 'Approval rate'], loans.map((l) => [l.name, num(l.count), inr(l.amount), pct(l.approvalRate)]))}
<h2>Top branches by deposits</h2>${table(['Branch', 'Customers', 'Deposits', 'Loans outstanding'], branches.map((b) => [b.Branch_Name, num(b.customers), inr(b.deposits), inr(b.loans)]))}
</body></html>`;
}
