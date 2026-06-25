const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'waf.db');

let db = null;
let SQL = null;
let persistTimer = null;

async function initDatabase() {
  SQL = await initSqlJs();

  // Load existing database or create new one
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  } catch (e) {
    db = new SQL.Database();
  }

  initializeTables();
  seedDefaultRules();
  persistDatabase();

  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Persist database to disk with debouncing.
 * Writes are batched - saves at most once every 500ms.
 */
function persistDatabase() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    try {
      if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
      }
    } catch (e) {
      console.error('Failed to persist database:', e.message);
    }
    persistTimer = null;
  }, 500);
}

/**
 * Force an immediate database write (used on shutdown or critical operations).
 */
function persistDatabaseNow() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    }
  } catch (e) {
    console.error('Failed to persist database:', e.message);
  }
}

function initializeTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS attack_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT,
      method TEXT,
      endpoint TEXT,
      category TEXT,
      payload TEXT,
      rule_matched TEXT,
      action TEXT DEFAULT 'blocked',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      pattern TEXT,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT UNIQUE,
      reason TEXT,
      blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT,
      method TEXT,
      endpoint TEXT,
      blocked INTEGER DEFAULT 0,
      category TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function seedDefaultRules() {
  const result = db.exec("SELECT COUNT(*) as cnt FROM rules");
  if (result.length > 0 && result[0].values.length > 0 && result[0].values[0][0] > 0) {
    return;
  }

  const defaultRules = [
    ['SQL Injection - Basic Auth Bypass', 'Detects basic SQL injection attempts like OR 1=1', "('\\sOR\\s+.*\\d+\\s*=\\s*\\d|UNION\\s+SELECT|DROP\\s+TABLE|INSERT\\s+INTO|SELECT\\s+.*\\s+FROM|SLEEP\\s*\\(|BENCHMARK\\s*\\(|WAITFOR\\s+DELAY|'\\s*OR\\s*'[^']*'\\s*=\\s*'|1\\s*=\\s*1)", 'SQL Injection'],
    ['SQL Injection - Statements', 'Detects SQL statements and time-based injection', "(\\bSELECT\\b.*\\bFROM\\b|\\bINSERT\\b.*\\bINTO\\b|\\bDROP\\b.*\\bTABLE\\b|\\bDELETE\\b.*\\bFROM\\b|\\bUPDATE\\b.*\\bSET\\b|\\bALTER\\b.*\\bTABLE\\b|\\bCREATE\\b.*\\bTABLE\\b)", 'SQL Injection'],
    ['Cross-Site Scripting (XSS)', 'Detects script tags and JavaScript event handlers', "(<\\s*script[^>]*>|javascript\\s*:|onerror\\s*=|onload\\s*=|onclick\\s*=|onmouseover\\s*=|alert\\s*\\(|document\\.cookie|eval\\s*\\(|expression\\s*\\(|<\\s*iframe|<\\s*img\\s+[^>]*src\\s*=\\s*['\"]?x[^>]*>)", 'XSS'],
    ['Command Injection', 'Detects shell command injection attempts', "(;\\s*whoami|&&\\s*ls|\\|\\s*cat|;\\s*pwd|rm\\s+-rf|wget\\s+http|curl\\s+http|/etc/passwd|/etc/shadow|cmd\\.exe|powershell|\\|\\s*dir|\\|\\s*type|`[^`]+`|\\$\\([^)]+\\))", 'Command Injection'],
    ['Path Traversal', 'Detects directory traversal and file path attacks', "(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e\\\\|/etc/passwd|/etc/shadow|boot\\.ini|win\\.ini|/proc/self|/proc/\\d+/environ)", 'Path Traversal'],
  ];

  const insertStmt = db.prepare(`
    INSERT INTO rules (name, description, pattern, category, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (const rule of defaultRules) {
    insertStmt.bind(rule);
    insertStmt.step();
    insertStmt.reset();
  }

  insertStmt.free();
}

// --- Query helpers (sql.js doesn't have .all() / .get() like better-sqlite3) ---

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function execute(sql, params = []) {
  if (params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  persistDatabase();
}

module.exports = { initDatabase, getDatabase, queryAll, queryOne, execute, persistDatabaseNow };
