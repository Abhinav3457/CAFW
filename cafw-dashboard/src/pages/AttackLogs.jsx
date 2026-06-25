import { useState, useEffect } from 'react';
import { getLogs } from '../api';
import LogTable from '../components/LogTable';

const CATEGORIES = ['All', 'SQL Injection', 'XSS', 'Command Injection', 'Path Traversal'];

function AttackLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: pageSize, offset: page * pageSize };
      if (activeCategory !== 'All') {
        params.category = activeCategory;
      }
      const data = await getLogs(params);
      setLogs(data);
    } catch (err) {
      setError('Failed to fetch attack logs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [activeCategory, page]);

  function handleCategoryClick(category) {
    setActiveCategory(category);
    setPage(0);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attack Logs</h1>
          <p className="subtitle">Detailed view of all blocked attacks</p>
        </div>
        <button className="btn-refresh" onClick={fetchLogs}>↻ Refresh</button>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && <div className="error-state"><p>{error}</p></div>}

      {loading ? (
        <div className="empty-state"><p>Loading logs...</p></div>
      ) : logs.length === 0 ? (
        <div className="empty-state"><p>No attack logs found for this filter.</p></div>
      ) : (
        <>
          <LogTable logs={logs} showPayload={true} />
          <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            <button
              className="filter-btn"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{ opacity: page === 0 ? 0.5 : 1 }}
            >
              ← Previous
            </button>
            <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '14px' }}>
              Page {page + 1}
            </span>
            <button
              className="filter-btn"
              disabled={logs.length < pageSize}
              onClick={() => setPage(p => p + 1)}
              style={{ opacity: logs.length < pageSize ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AttackLogs;
