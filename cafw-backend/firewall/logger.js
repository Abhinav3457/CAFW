const { execute } = require('../database');

/**
 * Log an attack to the database.
 * @param {object} params
 * @param {string} params.ip - Client IP
 * @param {string} params.method - HTTP method
 * @param {string} params.endpoint - Requested endpoint
 * @param {string} params.category - Attack category (SQL Injection, XSS, etc.)
 * @param {string} params.payload - The malicious payload
 * @param {string} params.ruleMatched - The regex pattern that matched
 */
function logAttack({ ip, method, endpoint, category, payload, ruleMatched }) {
  try {
    execute(
      `INSERT INTO attack_logs (ip_address, method, endpoint, category, payload, rule_matched, action)
       VALUES (?, ?, ?, ?, ?, ?, 'blocked')`,
      [ip, method, endpoint, category || 'Unknown', payload || '', ruleMatched || '']
    );
  } catch (err) {
    console.error('Failed to log attack:', err.message);
  }
}

/**
 * Log a request (blocked or allowed) to request_logs.
 */
function logRequest({ ip, method, endpoint, blocked, category }) {
  try {
    execute(
      `INSERT INTO request_logs (ip_address, method, endpoint, blocked, category)
       VALUES (?, ?, ?, ?, ?)`,
      [ip, method, endpoint, blocked ? 1 : 0, category || null]
    );
  } catch (err) {
    console.error('Failed to log request:', err.message);
  }
}

module.exports = { logAttack, logRequest };
