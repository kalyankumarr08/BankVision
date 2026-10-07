import { useState } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const ICON = { error: CircleAlert, warning: TriangleAlert, info: Info };

export default function DataQuality({ issues }) {
  const [all, setAll] = useState(false);
  const order = { error: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort((a, b) => order[a.level] - order[b.level]);
  const shown = all ? sorted : sorted.slice(0, 4);
  return (
    <section className="card quality" aria-label="Data quality">
      <h3>Data Quality</h3>
      {!issues.length ? (
        <p className="ok-inline"><CircleCheck size={16} aria-hidden="true" /> No data quality problems detected.</p>
      ) : (
        <>
          <ul className="quality__list">
            {shown.map((i, n) => {
              const Icon = ICON[i.level];
              return (
                <li key={`${i.title}-${i.column ?? n}`} className={`quality__item quality__item--${i.level}`}>
                  <Icon size={17} aria-hidden="true" />
                  <div><strong>{i.title}</strong><p>{i.message}</p></div>
                </li>
              );
            })}
          </ul>
          {sorted.length > 4 && <button type="button" className="link-btn" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `Show all ${sorted.length} messages`}</button>}
        </>
      )}
    </section>
  );
}
