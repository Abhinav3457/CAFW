/**
 * Attack detector - scans values for malicious patterns
 * Supports both hardcoded and database-backed patterns for rule toggling.
 */

const { getDatabase } = require('../database');

// Pre-compiled regex patterns by category (fallback when no DB rules)
const DEFAULT_PATTERNS = {
  'SQL Injection': [
    /('?\s*OR\s+.*\d+\s*=\s*\d|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|SELECT\s+.*\s+FROM|SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY|'\s*OR\s*'[^']*'\s*=\s*'|1\s*=\s*1)/i,
    /(\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bDROP\b.*\bTABLE\b|\bDELETE\b.*\bFROM\b|\bUPDATE\b.*\bSET\b|\bALTER\b.*\bTABLE\b|\bCREATE\b.*\bTABLE\b|\bTRUNCATE\b)/i,
    /('|--|;.*\bexec\b|@@version|db_name\s*\(|xp_cmdshell)/i,
  ],
  'XSS': [
    /<\s*script[^>]*>[\s\S]*?<\s*\/script\s*>/i,
    /<\s*script[^>]*>/i,
    /javascript\s*:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /onfocus\s*=/i,
    /onblur\s*=/i,
    /onchange\s*=/i,
    /onsubmit\s*=/i,
    /alert\s*\([^)]*\)/i,
    /document\.cookie/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<\s*iframe[\s>]/i,
    /<\s*img\s+[^>]*src\s*=\s*['"]?x[^>]*>/i,
    /<\s*svg[\s>]/i,
    /<\s*body[\s>]/i,
    /<\s*input[\s>]/i,
    /<\s*link[\s>]/i,
    /<\s*embed[\s>]/i,
    /<\s*object[\s>]/i,
    /<\s*style[\s>]/i,
    /prompt\s*\(/i,
    /confirm\s*\(/i,
  ],
  'Command Injection': [
    /;\s*whoami/i,
    /&&\s*ls/i,
    /\|\s*cat\b/i,
    /;\s*pwd/i,
    /rm\s+(-rf|-\/|\/)/i,
    /wget\s+http/i,
    /curl\s+http/i,
    /\|\s*dir\b/i,
    /\|\s*type\b/i,
    /`[^`]+`/,
    /\$\([^)]+\)/,
    /cmd\.exe/i,
    /powershell/i,
    /\/etc\/passwd/i,
    /\/etc\/shadow/i,
    /\/etc\/hosts/i,
    /\/etc\/group/i,
    /\|\s*more\b/i,
    /\|\s*less\b/i,
    /\|\s*grep\b/i,
    /\|\s*sort\b/i,
    /\|\s*findstr\b/i,
  ],
  'Path Traversal': [
    /\.\.[/\\]/,
    /\.\.\\/,
    /%2e%2e%2[fF]/,
    /%2e%2e%5[cC]/,
    /%252e%252e%252[fF]/,
    /%252e%252e%255[cC]/,
    /\.\.%2[fF]/,
    /\.\.%5[cC]/,
    /%2e%2e\//,
    /\/etc\/passwd/i,
    /\/etc\/shadow/i,
    /\/etc\/hosts/i,
    /boot\.ini/i,
    /win\.ini/i,
    /\/proc\/self\//i,
    /\/proc\/\d+\/environ/i,
    /\/windows\/system32/i,
    /\/\.git\/config/i,
    /\/\.env/i,
  ],
};

/**
 * Build active patterns from database rules.
 * Only includes rules where is_active = 1.
 * Falls back to DEFAULT_PATTERNS if DB is not available or has no active rules.
 */
function getActivePatterns() {
  try {
    const db = getDatabase();
    const rules = db.exec(
      "SELECT category, pattern FROM rules WHERE is_active = 1"
    );

    if (!rules || rules.length === 0 || rules[0].values.length === 0) {
      return DEFAULT_PATTERNS;
    }

    const activePatterns = {};
    for (const row of rules[0].values) {
      const category = row[0];
      const pattern = row[1];
      if (!activePatterns[category]) {
        activePatterns[category] = [];
      }
      try {
        activePatterns[category].push(new RegExp(pattern, 'i'));
      } catch (e) {
        // Skip invalid regex patterns
      }
    }

    return Object.keys(activePatterns).length > 0 ? activePatterns : DEFAULT_PATTERNS;
  } catch (e) {
    return DEFAULT_PATTERNS;
  }
}

/**
 * Scan a single value for attack patterns.
 * @param {string} value - The value to scan
 * @param {object} [patterns] - Optional patterns map (defaults to DEFAULT_PATTERNS)
 * @returns {object|null} - { category, matchedPattern, payload } or null
 */
function detectAttack(value, patterns = DEFAULT_PATTERNS) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const str = String(value);

  for (const [category, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      if (regex.test(str)) {
        return {
          category,
          matchedPattern: regex.source.substring(0, 100),
          payload: str.substring(0, 500),
        };
      }
    }
  }

  return null;
}

/**
 * Recursively scan all values in an object for attack patterns.
 * @param {object} obj - The object to scan (query, body, etc.)
 * @param {object} [patterns] - Optional patterns map (defaults to DEFAULT_PATTERNS)
 * @returns {object|null} - First detected attack or null
 */
function scanRequest(obj, patterns = DEFAULT_PATTERNS) {
  if (!obj || typeof obj !== 'object') {
    return detectAttack(obj, patterns);
  }

  const values = [];

  function collectValues(value) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' || typeof value === 'number') {
      values.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(v => collectValues(v));
    } else if (typeof value === 'object') {
      Object.values(value).forEach(v => collectValues(v));
    }
  }

  collectValues(obj);

  for (const val of values) {
    const result = detectAttack(val, patterns);
    if (result) return result;
  }

  return null;
}

module.exports = { detectAttack, scanRequest, DEFAULT_PATTERNS, getActivePatterns };
