import { useState, useEffect } from 'react';
import { getRules, toggleRule } from '../api';

const CATEGORY_COLORS = {
  'SQL Injection': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  'XSS': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'Command Injection': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  'Path Traversal': { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
};

function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(null);

  async function fetchRules() {
    setLoading(true);
    setError(null);
    try {
      const data = await getRules();
      setRules(data);
    } catch (err) {
      setError('Failed to fetch rules. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRules();
  }, []);

  async function handleToggle(rule) {
    setToggling(rule.id);
    try {
      const updated = await toggleRule(rule.id, !rule.is_active);
      setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Rules Management</h1></div>
        <div className="empty-state"><p>Loading rules...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header"><h1>Rules Management</h1></div>
        <div className="error-state"><p>{error}</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rules Management</h1>
          <p className="subtitle">Enable or disable firewall detection rules</p>
        </div>
        <button className="btn-refresh" onClick={fetchRules}>↻ Refresh</button>
      </div>

      <div className="rules-list">
        {rules.map(rule => {
          const colors = CATEGORY_COLORS[rule.category] || { bg: 'rgba(100,116,139,0.15)', color: '#64748b' };
          const isToggling = toggling === rule.id;

          return (
            <div className="rule-card" key={rule.id}>
              <div className="rule-info">
                <h4>{rule.name}</h4>
                <p>{rule.description}</p>
                <span className="rule-category" style={{ background: colors.bg, color: colors.color }}>
                  {rule.category}
                </span>
              </div>
              <div className="rule-status">
                <span style={{ color: rule.is_active ? '#22c55e' : '#64748b' }}>
                  {isToggling ? '...' : rule.is_active ? 'Active' : 'Inactive'}
                </span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={!!rule.is_active}
                    onChange={() => handleToggle(rule)}
                    disabled={isToggling}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          );
        })}

        {rules.length === 0 && (
          <div className="empty-state"><p>No rules found in the database.</p></div>
        )}
      </div>
    </div>
  );
}

export default Rules;
