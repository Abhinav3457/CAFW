const { queryOne } = require('../database');
const { scanRequest, getActivePatterns } = require('./detector');
const { logAttack, logRequest } = require('./logger');

/**
 * Whitelisted paths that bypass firewall inspection.
 */
const WHITELIST_PATHS = [
  '/api/dashboard',
  '/api/logs',
  '/api/rules',
  '/',
  '/health',
];

/**
 * Extract client IP from request.
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

/**
 * Express middleware that intercepts all requests and inspects them for attacks.
 */
function firewallMiddleware(req, res, next) {
  // Skip whitelisted paths
  const isWhitelisted = WHITELIST_PATHS.some(path =>
    req.path === path || req.path.startsWith(path + '/')
  );

  if (isWhitelisted) {
    return next();
  }

  const ip = getClientIP(req);

  try {
    // Step 1: Check if IP is blocked
    const blockedIp = queryOne(
      'SELECT * FROM blocked_ips WHERE ip_address = ? AND is_active = 1',
      [ip]
    );

    if (blockedIp) {
      logAttack({
        ip,
        method: req.method,
        endpoint: req.path,
        category: 'Blocked IP',
        payload: '',
        ruleMatched: `IP ${ip} is blocked: ${blockedIp.reason}`,
      });
      logRequest({ ip, method: req.method, endpoint: req.path, blocked: true, category: 'Blocked IP' });
      return res.status(403).json({
        error: 'Blocked by firewall',
        reason: 'Your IP address has been blocked',
        blocked: true,
      });
    }

    // Load active patterns from database (respects rule toggling)
    const activePatterns = getActivePatterns();

    // Step 2: Scan request path
    const pathResult = scanRequest(req.path, activePatterns);
    if (pathResult) {
      logAttack({
        ip,
        method: req.method,
        endpoint: req.path,
        category: pathResult.category,
        payload: pathResult.payload,
        ruleMatched: pathResult.matchedPattern,
      });
      logRequest({ ip, method: req.method, endpoint: req.path, blocked: true, category: pathResult.category });
      return res.status(403).json({
        error: 'Blocked by firewall',
        reason: `Malicious input detected in request path: ${pathResult.category}`,
        blocked: true,
        category: pathResult.category,
      });
    }

    // Step 3: Scan query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      const queryResult = scanRequest(req.query, activePatterns);
      if (queryResult) {
        logAttack({
          ip,
          method: req.method,
          endpoint: req.path,
          category: queryResult.category,
          payload: queryResult.payload,
          ruleMatched: queryResult.matchedPattern,
        });
        logRequest({ ip, method: req.method, endpoint: req.path, blocked: true, category: queryResult.category });
        return res.status(403).json({
          error: 'Blocked by firewall',
          reason: `Malicious input detected in query parameters: ${queryResult.category}`,
          blocked: true,
          category: queryResult.category,
        });
      }
    }

    // Step 4: Scan request body
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      const bodyResult = scanRequest(req.body, activePatterns);
      if (bodyResult) {
        logAttack({
          ip,
          method: req.method,
          endpoint: req.path,
          category: bodyResult.category,
          payload: bodyResult.payload,
          ruleMatched: bodyResult.matchedPattern,
        });
        logRequest({ ip, method: req.method, endpoint: req.path, blocked: true, category: bodyResult.category });
        return res.status(403).json({
          error: 'Blocked by firewall',
          reason: `Malicious input detected in request body: ${bodyResult.category}`,
          blocked: true,
          category: bodyResult.category,
        });
      }
    }

    // Request is clean - log and pass through
    logRequest({ ip, method: req.method, endpoint: req.path, blocked: false, category: null });
    next();
  } catch (err) {
    console.error('Firewall middleware error:', err.message);
    next();
  }
}

module.exports = { firewallMiddleware, getClientIP };
