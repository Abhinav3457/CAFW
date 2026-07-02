const express = require('express');
const router = express.Router();
const { queryAll, queryOne } = require('../database');

/**
 * GET /api/logs
 * Returns all attack logs with optional filtering and pagination.
 * Query params: category, ip_address, limit (default 50), offset (default 0)
 */
router.get('/', (req, res) => {
  try {
    const { category, ip_address, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT id, ip_address, method, endpoint, category, payload, rule_matched, action, timestamp FROM attack_logs WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (ip_address) {
      sql += ' AND ip_address = ?';
      params.push(ip_address);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const logs = queryAll(sql, params);
    res.json(logs);
  } catch (err) {
    console.error('Logs fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/logs/count
 * Returns total count of attack logs.
 */
router.get('/count', (req, res) => {
  try {
    const { category, ip_address } = req.query;
    let sql = 'SELECT COUNT(*) as count FROM attack_logs WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (ip_address) {
      sql += ' AND ip_address = ?';
      params.push(ip_address);
    }

    const result = queryOne(sql, params);
    res.json({ count: result ? result.count : 0 });
  } catch (err) {
    console.error('Logs count error:', err.message);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

module.exports = router;
