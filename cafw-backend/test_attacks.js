const axios = require('axios');

const BASE = 'http://localhost:8000';

const tests = [
  { name: 'Safe Request',          method: 'GET',  url: `${BASE}/test/safe` },
  { name: 'SQL Injection',         method: 'POST', url: `${BASE}/test/login`, data: { username: "' OR 1=1 --", password: "x" } },
  { name: 'XSS Attack',            method: 'POST', url: `${BASE}/test/login`, data: { username: "<script>alert(1)</script>", password: "x" } },
  { name: 'Command Injection',     method: 'POST', url: `${BASE}/test/login`, data: { username: "; whoami", password: "x" } },
  { name: 'Path Traversal',        method: 'GET',  url: `${BASE}/test/search?q=../../../etc/passwd` },
  { name: 'SQL in Query',          method: 'GET',  url: `${BASE}/test/search?q=UNION+SELECT+*+FROM+users` },
  { name: 'XSS in Query',          method: 'GET',  url: `${BASE}/test/search?q=<img+src=x+onerror=alert(1)>` },
  { name: 'Safe Search',           method: 'GET',  url: `${BASE}/test/search?q=hello+world` },
  { name: 'Path Traversal in Path',method: 'GET',  url: `${BASE}/../../../etc/passwd` },
];

async function runTests() {
  console.log('\n  ╔══════════════════════════════════════════════╗');
  console.log('  ║        CAFW Firewall Test Suite              ║');
  console.log('  ╚══════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: test.url,
        ...(test.data ? { data: test.data } : {}),
      };

      const res = await axios(config);

      const isAttackTest = test.name !== 'Safe Request' && test.name !== 'Safe Search';
      const shouldBeBlocked = isAttackTest;
      const status = res.status;

      if (shouldBeBlocked && status === 200) {
        console.log(`  ⚠️  ${test.name.padEnd(25)} → ${status} (NOT BLOCKED - potential issue)`);
        failed++;
      } else if (!shouldBeBlocked && status === 403) {
        console.log(`  ⚠️  ${test.name.padEnd(25)} → ${status} (FALSE POSITIVE - safe request blocked)`);
        failed++;
      } else {
        console.log(`  ✅ ${test.name.padEnd(25)} → ${status} (allowed)`);
        passed++;
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data || {};
        const isAttackTest = test.name !== 'Safe Request' && test.name !== 'Safe Search';

        if (isAttackTest) {
          console.log(`  🔴 BLOCKED  ${test.name.padEnd(17)} → ${status} (${data.category || data.reason || 'Attack detected'})`);
          passed++;
        } else {
          console.log(`  ⚠️  ${test.name.padEnd(25)} → ${status} (FALSE POSITIVE - safe request blocked)`);
          failed++;
        }
      } else {
        console.log(`  ❌ ${test.name.padEnd(25)} → CONNECTION ERROR (${err.message})`);
        failed++;
      }
    }
  }

  console.log(`\n  ──────────────────────────────────────────────`);
  console.log(`  Results: ${passed} passed, ${failed} failed, ${tests.length} total\n`);

  if (failed === 0) {
    console.log('  🎉 All tests passed! Firewall is working correctly.\n');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed. Review firewall configuration.\n`);
  }
}

runTests();
