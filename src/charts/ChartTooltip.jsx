export default function ChartTooltip({ active, title, rows }) {
  if (!active || !rows?.length) return null;
  return (
    <div className="chart-tooltip" role="tooltip">
      {title && <div className="chart-tooltip__title">{title}</div>}
      {rows.map(([label, value, color]) => (
        <div key={label} className="chart-tooltip__row">
          <span>
            {color && <i style={{ background: color }} />}
            {label}
          </span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
