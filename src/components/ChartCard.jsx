import EmptyState from './EmptyState';

export default function ChartCard({ title, subtitle, actions, empty, description, className = '', children }) {
  return (
    <section className={`card chart-card ${className}`} aria-label={title}>
      <header className="card__head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions && <div className="card__actions">{actions}</div>}
      </header>
      {empty ? (
        <EmptyState compact />
      ) : (
        <div className="chart-card__body" role="img" aria-label={description || title}>
          {children}
        </div>
      )}
    </section>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([val, text]) => (
        <button key={val} type="button" className={value === val ? 'is-active' : ''} aria-pressed={value === val} onClick={() => onChange(val)}>
          {text}
        </button>
      ))}
    </div>
  );
}
