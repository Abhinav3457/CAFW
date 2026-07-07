export default function StatCard({ label, value, color, trend, trendLabel, progress, delay = 0 }) {
  const isUp = trend === 'up';
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}s` }}>
      <div className="accent-bar" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="header">
        <span className="label">{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="value" style={{ color }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span className={`trend ${isUp ? 'up' : 'down'}`}>
            {isUp ? '↑' : '↓'} {trendLabel}
          </span>
        )}
      </div>
      {progress !== undefined && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }} />
        </div>
      )}
    </div>
  );
}
