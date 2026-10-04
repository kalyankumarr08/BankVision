export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function KpiSkeleton() {
  return (
    <div className="card kpi-skel" aria-hidden="true">
      <Skeleton style={{ width: '55%', height: 12 }} />
      <Skeleton style={{ width: '70%', height: 28, marginTop: 14 }} />
      <Skeleton style={{ width: '40%', height: 12, marginTop: 14 }} />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }) {
  return (
    <div className="card" aria-hidden="true">
      <Skeleton style={{ width: '40%', height: 16 }} />
      <Skeleton style={{ width: '25%', height: 12, marginTop: 8 }} />
      <Skeleton style={{ width: '100%', height, marginTop: 16 }} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="card" aria-hidden="true">
      <Skeleton style={{ width: '30%', height: 16 }} />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} style={{ width: '100%', height: 34, marginTop: 10 }} />
      ))}
    </div>
  );
}

export default function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading banking data">
      <div className="kpi-grid">
        {Array.from({ length: 6 }, (_, i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid grid--2-1">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
