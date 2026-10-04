import { ChevronLeft, ChevronRight } from 'lucide-react';
import { num } from '../utils/format';

function pages(current, total) {
  const set = new Set([1, total, current - 1, current, current + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i && p - list[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [10, 25, 50, 100] }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="pager" aria-label="Table pagination">
      <span className="muted">
        {num(from)}–{num(to)} of {num(total)}
      </span>
      <label className="pager__size">
        <span className="muted">Rows</span>
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Rows per page">
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="pager__pages">
        <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {pages(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pager__gap" aria-hidden="true">…</span>
          ) : (
            <button key={p} type="button" className={`pager__num${p === page ? ' is-active' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)}>
              {p}
            </button>
          ),
        )}
        <button type="button" className="icon-btn" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
