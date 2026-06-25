import { useState, useEffect } from 'react';
import { getStats, getCategoryBreakdown, getRecentAttacks, getLast7Days, getTopAttackers } from '../api';
import StatCard from '../components/StatCard';
import LogTable from '../components/LogTable';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [recentAttacks, setRecentAttacks] = useState([]);
  const [last7Days, setLast7Days] = useState([]);
  const [topAttackers, setTopAttackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [s, c, r, l7, ta] = await Promise.all([
        getStats(),
        getCategoryBreakdown(),
        getRecentAttacks(),
        getLast7Days(),
        getTopAttackers(),
      ]);
      setStats(s);
      setCategoryData(c);
      setRecentAttacks(r);
      setLast7Days(l7);
      setTopAttackers(ta);
    } catch (err) {
      setError('Failed to fetch dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="empty-state">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="error-state"><p>{error}</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Security Dashboard</h1>
          <p className="subtitle">Real-time firewall monitoring and attack analytics</p>
        </div>
        <button className="btn-refresh" onClick={fetchData}>
          ↻ Refresh
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Requests Today"
          value={stats?.total_requests_today || 0}
          color="#3b82f6"
          icon="📊"
        />
        <StatCard
          label="Attacks Blocked Today"
          value={stats?.attacks_blocked_today || 0}
          color="#ef4444"
          icon="🛡️"
        />
        <StatCard
          label="Unique Attacker IPs"
          value={stats?.unique_attacker_ips || 0}
          color="#f59e0b"
          icon="👤"
        />
        <StatCard
          label="Top Attack Type"
          value={stats?.top_attack_category || 'None'}
          color="#8b5cf6"
          icon="⚡"
        />
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Attacks - Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Attack Categories</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData.length > 0 ? categoryData : [{ category: 'No Data', count: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="count"
                nameKey="category"
                label={({ category, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {(categoryData.length > 0 ? categoryData : [{ category: 'No Data', count: 1 }]).map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-card">
        <h3>Recent Attacks (Last 10)</h3>
        {recentAttacks.length > 0 ? (
          <LogTable logs={recentAttacks} />
        ) : (
          <div className="empty-state"><p>No attacks recorded yet. Try sending test attacks!</p></div>
        )}
      </div>

      {topAttackers.length > 0 && (
        <div className="section-card">
          <h3>Top Attackers</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topAttackers.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ip_address" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
