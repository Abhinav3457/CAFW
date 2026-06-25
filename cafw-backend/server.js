require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const { firewallMiddleware } = require('./firewall/middleware');

// Import routes
const dashboardRoutes = require('./routes/dashboard');
const logsRoutes = require('./routes/logs');
const rulesRoutes = require('./routes/rules');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount firewall middleware BEFORE routes (intercepts all requests)
app.use(firewallMiddleware);

// Mount routes (behind firewall)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/rules', rulesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CAFW Backend', timestamp: new Date().toISOString() });
});

// --- Test endpoints (behind firewall) ---

// Safe test endpoint
app.get('/test/safe', (req, res) => {
  res.json({ message: 'Safe request passed through firewall', safe: true });
});

// Login test endpoint (accepts username/password)
app.post('/test/login', (req, res) => {
  const { username, password } = req.body;
  res.json({
    message: 'Login attempt received',
    username: username || '(not provided)',
    loggedIn: false,
    note: 'This is a test endpoint',
  });
});

// Search test endpoint (with query parameter)
app.get('/test/search', (req, res) => {
  const query = req.query.q || '';
  res.json({
    message: `Search received`,
    query: query.substring(0, 50),
    results: [],
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CAFW - Centralized Application-Context Aware Firewall',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dashboard: '/api/dashboard/stats',
      logs: '/api/logs',
      rules: '/api/rules',
      test_safe: '/test/safe',
      test_login: '/test/login',
      test_search: '/test/search',
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database then start server
async function start() {
  try {
    await initDatabase();
    console.log('  📦 SQLite database initialized');

    app.listen(PORT, () => {
      console.log(`\n  🔥 CAFW Backend running at http://localhost:${PORT}`);
      console.log(`  📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
      console.log(`  🛡️  Firewall active on all /test/* endpoints\n`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
