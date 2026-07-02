import { useState, useEffect, useCallback, useRef } from 'react';
import { getLogs, getLogsCount } from '../api';
import LogTable from '../components/LogTable';

const CATS = ['All', 'SQL Injection', 'XSS', 'Command Injection', 'Path Traversal'];

export default function AttackLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cat, setCat] = useState('All');
  const [page, setPage] = useState(0);
  const [searchIP, setSearchIP] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const PAGE_SIZE = 15;
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const p = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
      if (cat !== 'All') p.category = cat;
      if (searchIP) p.ip_address = searchIP;
      const [data, countData] = await Promise.all([getLogs(p), getLogsCount(p)]);
      if (!mounted.current) return;
      setLogs(data); setTotal(countData.count);
    } catch {
      if (mounted.current) setError('Failed to fetch logs. Is the backend running?');
    } finally { if (mounted.current) setLoading(false); }
  }, [cat, page, searchIP]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { mounted.current = false; }, []);

  const setCatAndReset = (c) => { setCat(c); setPage(0); };
  const handleSearch = (e) => { e.preventDefault(); setSearchIP(searchInput.trim()); setPage(0); };
  const clearSearch = () => { setSearchInput(''); setSearchIP(''); setPage(0); };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attack Logs</h1>
          <p className="sub">Detailed view of all blocked attacks</p>
        </div>
        <div className="toolbar">
          <span className="badge" style={{ background: 'rgba(56,78,120,0.12)', color: 'var(--text-secondary)' }}>
            Total: <strong style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}</strong>
          </span>
          <button className="btn" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="filter-bar">
        {CATS.map(c => (
          <button key={c} className={`filter-btn ${cat === c ? 'active' : ''}`} onClick={() => setCatAndReset(c)}>{c}</button>
        ))}
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <span className="icon">🔍</span>
          <input className="search-input" placeholder="Search by IP address..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Search</button>
        {searchIP && <button type="button" className="btn" onClick={clearSearch}>✕ Clear</button>}
      </form>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 700 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty">
          <div className="icon">📋</div>
          <p>No attack logs found{searchIP ? ` for "${searchIP}"` : cat !== 'All' ? ` in "${cat}"` : ''}.</p>
          {(searchIP || cat !== 'All') && <button className="btn" style={{ marginTop: 12 }} onClick={clearSearch}>Clear filters</button>}
        </div>
      ) : (
        <>
          <LogTable logs={logs} showPayload />
          <div className="pagination">
            <button className="filter-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Prev</button>
            <span className="info">Page {page + 1} / {pages} ({total.toLocaleString()} total)</span>
            <button className="filter-btn" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
