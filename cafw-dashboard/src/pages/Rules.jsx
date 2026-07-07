import { useState, useEffect, useCallback, useRef } from 'react';
import { getRules, toggleRule } from '../api';
import { SearchIcon, RefreshIcon } from '../components/Icons';

const COLORS = {
  'SQL Injection':     { bg: 'rgba(239,68,68,0.1)', c: '#ef4444' },
  XSS:                 { bg: 'rgba(245,158,11,0.1)', c: '#f59e0b' },
  'Command Injection':  { bg: 'rgba(239,68,68,0.1)', c: '#ef4444' },
  'Path Traversal':     { bg: 'rgba(139,92,246,0.1)', c: '#8b5cf6' },
};
const DEF = { bg: 'rgba(100,116,139,0.1)', c: '#64748b' };

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState('');
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getRules();
      if (mounted.current) setRules(data);
    } catch {
      if (mounted.current) setError('Failed to fetch rules. Is the backend running?');
    } finally { if (mounted.current) setLoading(false); }
  }, []);

  useEffect(() => { load(); return () => { mounted.current = false; }; }, [load]);

  const handleToggle = async (rule) => {
    setToggling(rule.id);
    try {
      const updated = await toggleRule(rule.id, !rule.is_active);
      setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
    } catch (err) { console.error('Toggle failed:', err); }
    finally { setToggling(null); }
  };

  const counts = {};
  rules.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });

  const filtered = search.trim()
    ? rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()))
    : rules;

  const activeN = rules.filter(r => r.is_active).length;

  if (loading) return (
    <div>
      <div className="page-header"><div><h1>Rules Management</h1><p className="sub">Enable or disable firewall detection rules</p></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 800 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />)}
      </div>
    </div>
  );

  if (error) return (
    <div>
      <div className="page-header"><div><h1>Rules Management</h1><p className="sub">Enable or disable firewall detection rules</p></div></div>
      <div className="error-box">{error}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rules Management</h1>
          <p className="sub">Enable or disable firewall detection rules</p>
        </div>
        <div className="toolbar">
          <span className="badge" style={{ background: 'rgba(56,78,120,0.12)', color: 'var(--text-secondary)', gap: 10 }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{activeN} active</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>{rules.length - activeN} inactive</span>
          </span>
          <button className="btn" onClick={load}><RefreshIcon size={14} /> Refresh</button>
        </div>
      </div>

      {/* Category Chips */}
      {Object.keys(counts).length > 0 && (
        <div className="chips">
          {Object.entries(counts).map(([cat, n]) => {
            const cl = COLORS[cat] || DEF;
            return <span key={cat} className="badge" style={{ background: cl.bg, color: cl.c }}>{cat} ({n})</span>;
          })}
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <SearchIcon size={14} strokeWidth={2.5} />
          <input className="search-input" placeholder="Search rules..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <button className="btn" onClick={() => setSearch('')}>Clear</button>}
      </div>

      {/* Rules List */}
      <div className="rules-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <p>{search ? `No rules match "${search}"` : 'No rules found.'}</p>
            {search && <button className="btn" style={{ marginTop: 12 }} onClick={() => setSearch('')}>Clear search</button>}
          </div>
        ) : filtered.map((rule, i) => {
          const cl = COLORS[rule.category] || DEF;
          const busy = toggling === rule.id;
          return (
            <div className="rule-card" key={rule.id} style={{ animationDelay: `${i * 0.03}s`, borderLeftColor: cl.c }}>
              <div className="info">
                <h4>{rule.name}</h4>
                <p>{rule.description}</p>
                <span className="badge" style={{ background: cl.bg, color: cl.c }}>{rule.category}</span>
              </div>
              <div className="status">
                <span style={{ color: rule.is_active ? 'var(--accent-green)' : 'var(--text-muted)', transition: 'color 0.3s' }}>
                  {busy ? '⋯' : rule.is_active ? 'Active' : 'Inactive'}
                </span>
                <label className="toggle">
                  <input type="checkbox" checked={rule.is_active} onChange={() => handleToggle(rule)} disabled={busy} />
                  <span className="toggle-track" />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
