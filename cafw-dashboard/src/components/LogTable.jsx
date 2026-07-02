import { useState } from 'react';

const CAT = {
  'SQL Injection': { bg: 'rgba(239,68,68,0.1)', c: '#ef4444', l: 'SQL Injection', i: '🗃️' },
  XSS:             { bg: 'rgba(245,158,11,0.1)', c: '#f59e0b', l: 'XSS', i: '⚠️' },
  'Command Injection': { bg: 'rgba(239,68,68,0.1)', c: '#ef4444', l: 'Cmd Injection', i: '💻' },
  'Path Traversal':    { bg: 'rgba(139,92,246,0.1)', c: '#8b5cf6', l: 'Path Traversal', i: '📁' },
  'Blocked IP':    { bg: 'rgba(100,116,139,0.1)', c: '#64748b', l: 'Blocked IP', i: '🔒' },
};
const DEF = { bg: 'rgba(100,116,139,0.1)', c: '#64748b', l: 'Unknown', i: '❓' };

export default function LogTable({ logs, showPayload = false }) {
  const [expanded, setExpanded] = useState(null);
  if (!logs?.length) return null;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>IP Address</th>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Category</th>
            {showPayload && <th>Payload</th>}
            <th>Action</th>
            <th style={{ width: 32, textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const b = CAT[log.category] || DEF;
            const isExp = expanded === log.id;
            return (
              <tr key={log.id}>
                <td style={{ fontSize: 12 }}>
                  <span title={new Date(log.timestamp).toLocaleString()}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </td>
                <td><span className="ip-badge">{log.ip_address}</span></td>
                <td>
                  <span className={`method-badge ${(log.method || '').toLowerCase()}`}>
                    {log.method}
                  </span>
                </td>
                <td><span className="endpoint">{log.endpoint}</span></td>
                <td>
                  <span className="badge" style={{ background: b.bg, color: b.c }}>
                    <span style={{ fontSize: 12 }}>{b.i}</span> {b.l}
                  </span>
                </td>
                {showPayload && (
                  <td style={{ fontFamily: "'SF Mono', Consolas, monospace", fontSize: 11, opacity: 0.6 }}>
                    {log.payload ? log.payload.substring(0, 40) + (log.payload.length > 40 ? '…' : '') : '—'}
                  </td>
                )}
                <td>
                  <span className={`action-badge ${log.action || 'blocked'}`}>{log.action}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setExpanded(e => e === log.id ? null : log.id)}
                    style={{
                      background: 'none', border: 'none', color: '#4e5f7e', cursor: 'pointer',
                      fontSize: 12, padding: '2px 6px', borderRadius: 4,
                      transform: isExp ? 'rotate(180deg)' : 'rotate(0)', transition: 'all 0.2s',
                    }}
                  >▼</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
