const express = require('express');
const router = express.Router();
const { queryAll, queryOne } = require('../database');

/**
 * GET /api/dashboard/stats
 * Returns aggregate statistics for the dashboard.
 */
router.get('/stats', (req, res) => {
  try {
    const totalAttacksToday = queryOne(`
      SELECT COUNT(*) as count FROM attack_logs
      WHERE date(timestamp) = date('now')
    `);

    const blockedToday = queryOne(`
      SELECT COUNT(*) as count FROM attack_logs
      WHERE date(timestamp) = date('now') AND action = 'blocked'
    `);

    const uniqueIPs = queryOne(`
      SELECT COUNT(DISTINCT ip_address) as count FROM attack_logs
      WHERE date(timestamp) = date('now')
    `);

    const topCategory = queryOne(`
      SELECT category, COUNT(*) as count FROM attack_logs
      WHERE date(timestamp) = date('now')
      GROUP BY category ORDER BY count DESC LIMIT 1
    `);

    const totalRequests = queryOne(`
      SELECT COUNT(*) as count FROM request_logs
      WHERE date(timestamp) = date('now')
    `);

    res.json({
      total_attacks_today: totalAttacksToday ? totalAttacksToday.count : 0,
      attacks_blocked_today: blockedToday ? blockedToday.count : 0,
      unique_attacker_ips: uniqueIPs ? uniqueIPs.count : 0,
      top_attack_category: topCategory ? topCategory.category : 'None',
      total_requests_today: totalRequests ? totalRequests.count : 0,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/dashboard/recent-attacks
 * Returns the last 10 attack logs.
 */
router.get('/recent-attacks', (req, res) => {
  try {
    const logs = queryAll(`
      SELECT id, ip_address, method, endpoint, category, payload, rule_matched, action, timestamp
      FROM attack_logs
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    res.json(logs);
  } catch (err) {
    console.error('Recent attacks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recent attacks' });
  }
});

/**
 * GET /api/dashboard/category-breakdown
 * Returns attack count grouped by category.
 */
router.get('/category-breakdown', (req, res) => {
  try {
    const breakdown = queryAll(`
      SELECT category, COUNT(*) as count
      FROM attack_logs
      GROUP BY category
      ORDER BY count DESC
    `);
    res.json(breakdown);
  } catch (err) {
    console.error('Category breakdown error:', err.message);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

/**
 * GET /api/dashboard/top-attackers
 * Returns top 10 IPs by attack count.
 */
router.get('/top-attackers', (req, res) => {
  try {
    const attackers = queryAll(`
      SELECT ip_address, COUNT(*) as count, MAX(timestamp) as last_attack
      FROM attack_logs
      GROUP BY ip_address
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json(attackers);
  } catch (err) {
    console.error('Top attackers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch top attackers' });
  }
});

/**
 * GET /api/dashboard/last-7-days
 * Returns attack counts per day for the last 7 days (for line chart).
 */
router.get('/last-7-days', (req, res) => {
  try {
    const data = queryAll(`
      SELECT date(timestamp) as date, COUNT(*) as count
      FROM attack_logs
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY date(timestamp)
      ORDER BY date ASC
    `);

    // Fill in missing days with zero
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const found = data.find(d => d.date === dateStr);
      result.push({
        date: dateStr,
        count: found ? found.count : 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Last 7 days error:', err.message);
    res.status(500).json({ error: 'Failed to fetch last 7 days data' });
  }
});

module.exports = router;
