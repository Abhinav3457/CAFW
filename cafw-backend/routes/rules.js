const express = require('express');
const router = express.Router();
const { queryAll, queryOne, execute } = require('../database');

/**
 * Convert a raw rule row (SQLite returns is_active as 0/1) to a proper boolean.
 */
function normalizeRule(rule) {
  if (!rule) return rule;
  return { ...rule, is_active: !!rule.is_active };
}

/**
 * GET /api/rules
 * Returns all detection rules.
 */
router.get('/', (req, res) => {
  try {
    const rules = queryAll('SELECT * FROM rules ORDER BY category, name');
    res.json(rules.map(normalizeRule));
  } catch (err) {
    console.error('Rules fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

/**
 * PATCH /api/rules/:id
 * Updates the is_active status of a rule.
 * Body: { is_active: true/false }
 */
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    execute('UPDATE rules SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

    const updated = queryOne('SELECT * FROM rules WHERE id = ?', [id]);
    if (!updated) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(normalizeRule(updated));
  } catch (err) {
    console.error('Rule update error:', err.message);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

module.exports = router;
