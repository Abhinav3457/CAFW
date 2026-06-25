const CATEGORY_STYLES = {
  'SQL Injection': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'SQL Injection' },
  'XSS': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'XSS' },
  'Command Injection': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Cmd Injection' },
  'Path Traversal': { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: 'Path Traversal' },
  'Blocked IP': { bg: 'rgba(100,116,139,0.15)', color: '#64748b', label: 'Blocked IP' },
};

const DEFAULT_STYLE = { bg: 'rgba(100,116,139,0.15)', color: '#64748b', label: 'Unknown' };

const tableStyles = {
  wrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #334155',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #1e293b',
    color: '#cbd5e1',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tr: {
    transition: 'background 0.15s',
  },
};

function LogTable({ logs, showPayload = false }) {
  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <div style={tableStyles.wrapper}>
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th style={tableStyles.th}>Timestamp</th>
            <th style={tableStyles.th}>IP Address</th>
            <th style={tableStyles.th}>Method</th>
            <th style={tableStyles.th}>Endpoint</th>
            <th style={tableStyles.th}>Category</th>
            {showPayload && <th style={tableStyles.th}>Payload</th>}
            <th style={tableStyles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const badge = CATEGORY_STYLES[log.category] || DEFAULT_STYLE;
            return (
              <tr
                key={log.id}
                style={tableStyles.tr}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={tableStyles.td}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={tableStyles.td}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ip_address}</span>
                </td>
                <td style={tableStyles.td}>{log.method}</td>
                <td style={{ ...tableStyles.td, fontFamily: 'monospace', fontSize: '12px' }}>
                  {log.endpoint}
                </td>
                <td style={tableStyles.td}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </td>
                {showPayload && (
                  <td style={{ ...tableStyles.td, maxWidth: '250px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {log.payload ? log.payload.substring(0, 80) : '-'}
                  </td>
                )}
                <td style={tableStyles.td}>
                  <span style={{ color: log.action === 'blocked' ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                    {log.action}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LogTable;
