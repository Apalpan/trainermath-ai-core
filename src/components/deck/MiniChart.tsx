import type { ChartDatum } from '../../deck/slides';

type MiniChartProps = {
  type: 'line' | 'bars' | 'stack' | 'steps';
  data: ChartDatum[];
  caption?: string;
};

export default function MiniChart({ type, data, caption }: MiniChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (type === 'line') {
    const points = data
      .map((item, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * 100;
        const y = 100 - (item.value / max) * 88;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <figure className="mini-chart mini-chart--line">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={points} />
          {data.map((item, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * 100;
            const y = 100 - (item.value / max) * 88;
            return <circle key={item.label} cx={x} cy={y} r="1.8" />;
          })}
        </svg>
        <div className="mini-chart__labels">
          {data.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  if (type === 'stack') {
    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
    return (
      <figure className="mini-chart mini-chart--stack">
        <div className="stack-bars">
          {data.map((item) => (
            <div key={item.label} style={{ height: `${(item.value / total) * 100}%` }}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className={`mini-chart mini-chart--${type}`}>
      <div className="bar-grid">
        {data.map((item, index) => (
          <div className="bar-item" key={item.label}>
            <div className="bar-track">
              <div style={{ height: `${(item.value / max) * 100}%`, transitionDelay: `${index * 60}ms` }} />
            </div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
