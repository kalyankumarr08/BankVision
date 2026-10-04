export default function Sparkline({ data, tone = 'primary', width = 96, height = 32 }) {
  if (!data?.length || data.every((v) => v === data[0])) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`);
  return (
    <svg className={`spark spark--${tone}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={`0,${height} ${pts.join(' ')} ${width},${height}`} className="spark__fill" />
      <polyline points={pts.join(' ')} className="spark__line" fill="none" />
    </svg>
  );
}
