import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getStats, getCategoryBreakdown, getRecentAttacks,
  getLast7Days, getTopAttackers,
} from '../api';
import StatCard from '../components/StatCard';
import LogTable from '../components/LogTable';
import { RefreshIcon } from '../components/Icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Area,
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#14b8a6'];
const tipStyle = {
  contentStyle: { background: 'rgba(12,20,37,0.95)', border: '1px solid rgba(56,78,120,0.3)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '10px 14px' },
  labelStyle: { color: '#e8edf5', fontWeight: 600, marginBottom: 4, fontSize: 12 },
  itemStyle: { fontSize: 12 },
};

function Skeletons() {
  return (
    <>
      <div className="stats-grid">
        {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 14, animationDelay: `${i*0.1}s` }} />)}
      </div>
      <div className="charts-row">
        <div className="skeleton" style={{ height: 320, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 14 }} />
      </div>
    </>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [days, setDays] = useState([]);
  const [attackers, setAttackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  const fetching = useRef(false);

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setRefreshing(true);
    setError(null);
    try {
      const [s, c, r, d, a] = await Promise.all([
        getStats(), getCategoryBreakdown(), getRecentAttacks(),
        getLast7Days(), getTopAttackers(),
      ]);
      if (!mounted.current) return;
      setStats(s); setCategories(c); setRecent(r); setDays(d); setAttackers(a);
      setLastUpdated(new Date());
    } catch {
      if (mounted.current) setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); fetching.current = false; }
    }
  }, []);

  useEffect(() => { load(); return () => { mounted.current = false; }; }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  if (loading && !stats) return <div><div className="page-header"><div><h1>Security Dashboard</h1><p className="sub">Real-time firewall monitoring</p></div></div><Skeletons /></div>;

  const total = categories.reduce((s, c) => s + c.count, 0);
  const blockPct = stats?.total_requests_today > 0 ? Math.round((stats.attacks_blocked_today / stats.total_requests_today) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Security Dashboard</h1>
          <p className="sub">Real-time firewall monitoring and attack analytics</p>
        </div>
        <div className="toolbar">
          {lastUpdated && <span className="last-updated">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <label className="auto-toggle">
            <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
            Auto-refresh
          </label>
          <button className="btn" onClick={load} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}><RefreshIcon size={14} /></span> Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Status Bar */}
      <div className="status-bar">
        <span className="live-label"><span className="live-dot" /> {autoRefresh ? 'Live' : 'Paused'}</span>
        <span className="divider" />
        {stats?.total_requests_today > 0 && <><span><strong>{stats.total_requests_today.toLocaleString()}</strong> requests</span><span className="divider" /></>}
        {stats?.attacks_blocked_today > 0 && <><span><strong style={{ color: 'var(--accent-red)' }}>{stats.attacks_blocked_today.toLocaleString()}</strong> blocked</span><span className="divider" /></>}
        <span>Block rate: <strong style={{ color: 'var(--accent-green)' }}>{blockPct}%</strong></span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Requests" value={stats?.total_requests_today || 0} color="var(--accent-blue)" delay={0}
          progress={stats?.total_requests_today ? Math.min((stats.total_requests_today / 1000) * 100, 100) : 0} />
        <StatCard label="Attacks Blocked" value={stats?.attacks_blocked_today || 0} color="var(--accent-red)" delay={0.08}
          trend={stats?.attacks_blocked_today > 0 ? 'up' : null} trendLabel={stats?.attacks_blocked_today > 0 ? 'blocked' : ''} progress={blockPct} />
        <StatCard label="Unique Attacker IPs" value={stats?.unique_attacker_ips || 0} color="var(--accent-amber)" delay={0.16}
          progress={stats?.unique_attacker_ips > 0 ? Math.min(stats.unique_attacker_ips * 10, 100) : 0} />
        <StatCard label="Top Attack Type" value={stats?.top_attack_category || 'None'} color="var(--accent-purple)" delay={0.24}
          trend={categories.length > 0 && categories[0].count > 0 ? 'up' : null}
          trendLabel={categories.length > 0 ? `${categories[0].count} hits` : ''}
          progress={total > 0 ? Math.round((categories[0]?.count / total) * 100) : 0} />
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="card" style={{ animationDelay: '0.3s' }}>
          <h3>Attacks — Last 7 Days</h3>
          {days.length === 0 || days.every(d => d.count === 0) ? (
            <div className="empty" style={{ padding: '36px 0' }}><p>No attack data for the last 7 days.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={days} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,78,120,0.15)" vertical={false} />
                <XAxis dataKey="date" stroke="#3a4f7a" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }} />
                <YAxis stroke="#3a4f7a" tick={{ fontSize: 11 }} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip {...tipStyle} formatter={v => [v, 'Attacks']} />
                <Area type="monotone" dataKey="count" fill="url(#lg)" stroke="none" />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2.5}
                  dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ animationDelay: '0.38s' }}>
          <h3>Attack Categories</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categories.length > 0 ? categories : [{ category: 'No Data', count: 1 }]}
                cx="50%" cy="50%" innerRadius={58} outerRadius={90}
                dataKey="count" nameKey="category"
                label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                paddingAngle={3} stroke="none"
              >
                {(categories.length > 0 ? categories : [{ category: 'No Data', count: 1 }]).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(5,10,24,0.5)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip {...tipStyle} formatter={(v, n) => [v, n]} />
              <Legend formatter={v => <span style={{ color: '#8494b2', fontSize: 11 }}>{v}</span>} iconSize={8} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Attacks */}
      <div className="card" style={{ animationDelay: '0.45s' }}>
        <h3>Recent Attacks (Last 10)</h3>
        {recent.length > 0 ? <LogTable logs={recent} /> : (
          <div className="empty"><p>No attacks recorded yet.</p></div>
        )}
      </div>

      {/* Top Attackers */}
      {attackers.length > 0 && (
        <div className="card" style={{ animationDelay: '0.52s' }}>
          <h3>Top Attackers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attackers.slice(0, 5)} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,78,120,0.15)" vertical={false} />
              <XAxis dataKey="ip_address" stroke="#3a4f7a" tick={{ fontSize: 10, fontFamily: 'Consolas, monospace' }} tickLine={false} axisLine={false} />
              <YAxis stroke="#3a4f7a" tick={{ fontSize: 11 }} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip {...tipStyle} formatter={v => [v, 'Attacks']} />
              <Bar dataKey="count" fill="url(#bg)" radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
