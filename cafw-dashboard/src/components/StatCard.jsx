function StatCard({ label, value, color, icon }) {
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '22px',
        transition: 'all 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: color || '#f1f5f9',
            lineHeight: 1,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
}

export default StatCard;
