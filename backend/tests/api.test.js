const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.data.status === 'online', 'GET /api/health should return online');

    // 2. Admin Login
    const adminLogin = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'admin@civic.gov', password: 'Password@123' }
    );
    assert(adminLogin.status === 200 && adminLogin.data.token, 'POST /api/auth/login as Admin returns JWT token');
    const adminToken = adminLogin.data?.token;

    // 3. Citizen Login
    const citizenLogin = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'citizen@gmail.com', password: 'Password@123' }
    );
    assert(citizenLogin.status === 200 && citizenLogin.data.token, 'POST /api/auth/login as Citizen returns JWT token');
    const citizenToken = citizenLogin.data?.token;

    // 4. Officer Login
    const officerLogin = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'officer.roads@civic.gov', password: 'Password@123' }
    );
    assert(officerLogin.status === 200 && officerLogin.data.token, 'POST /api/auth/login as Officer returns JWT token');
    const officerToken = officerLogin.data?.token;

    // 5. Auth Me
    const meRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(meRes.status === 200 && meRes.data.user.role === 'citizen', 'GET /api/auth/me returns citizen profile');

    // 6. Public metadata
    const categoriesRes = await request({ host: 'localhost', port: 5000, path: '/api/users/meta/categories', method: 'GET' });
    assert(categoriesRes.status === 200 && Array.isArray(categoriesRes.data.data), 'GET /api/users/meta/categories returns list');

    const wardsRes = await request({ host: 'localhost', port: 5000, path: '/api/users/meta/wards', method: 'GET' });
    assert(wardsRes.status === 200 && Array.isArray(wardsRes.data.data), 'GET /api/users/meta/wards returns list');

    // 7. Dashboard stats
    const statsRes = await request({ host: 'localhost', port: 5000, path: '/api/dashboard/stats', method: 'GET' });
    assert(statsRes.status === 200 && statsRes.data.data.total >= 0, 'GET /api/dashboard/stats returns real counts');

    // 8. GIS markers
    const gisRes = await request({ host: 'localhost', port: 5000, path: '/api/gis/issues', method: 'GET' });
    assert(gisRes.status === 200 && gisRes.data.geoJson.type === 'FeatureCollection', 'GET /api/gis/issues returns GeoJSON');

    // 9. Heatmap data
    const heatRes = await request({ host: 'localhost', port: 5000, path: '/api/gis/heatmap', method: 'GET' });
    assert(heatRes.status === 200 && Array.isArray(heatRes.data.data), 'GET /api/gis/heatmap returns coordinate weights');

    // 10. Create Issue (JSON simulated)
    const newIssuePayload = {
      title: 'Automated Test: Broken Pavement Slab',
      description: 'Pedestrian concrete slab is severely cracked near bus stand.',
      category_id: 1,
      latitude: 13.0604,
      longitude: 80.2496,
      location_type: 'gps',
      address: 'Anna Salai (Mount Road) Metro Corridor, Chennai, Tamil Nadu',
      priority: 'high'
    };
    const createIssueRes = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/issues',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${citizenToken}`
        }
      },
      newIssuePayload
    );
    assert(createIssueRes.status === 201 && createIssueRes.data.issue.ticket_id, 'POST /api/issues creates ticket successfully');
    const testIssueId = createIssueRes.data?.issue?.id;

    // 11. Assign Issue by Admin
    if (testIssueId) {
      const assignRes = await request(
        {
          host: 'localhost',
          port: 5000,
          path: `/api/issues/${testIssueId}/assign`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          }
        },
        { officer_id: 2, department_id: 1, priority: 'urgent' }
      );
      assert(assignRes.status === 200 && assignRes.data.success, 'POST /api/issues/:id/assign assigns work order');

      // 12. Officer updates status to in_progress
      const statusRes = await request(
        {
          host: 'localhost',
          port: 5000,
          path: `/api/issues/${testIssueId}/status`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${officerToken}`
          }
        },
        { status: 'in_progress', remarks: 'Team deployed on site.' }
      );
      assert(statusRes.status === 200 && statusRes.data.success, 'PUT /api/issues/:id/status updates to in_progress');

      // 13. Get Issue History
      const histRes = await request({
        host: 'localhost',
        port: 5000,
        path: `/api/issues/${testIssueId}/history`,
        method: 'GET',
        headers: { Authorization: `Bearer ${citizenToken}` }
      });
      assert(histRes.status === 200 && histRes.data.data.length >= 2, 'GET /api/issues/:id/history returns transition logs');
    }

    // 14. Notifications check
    const notifRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(notifRes.status === 200 && Array.isArray(notifRes.data.data), 'GET /api/notifications returns user alerts');

    // 15. CSV Export check
    const csvRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/reports/issues.csv',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(csvRes.status === 200 && csvRes.headers['content-type'].includes('text/csv'), 'GET /api/reports/issues.csv generates RFC4180 CSV');

    // 16. Audit logs
    const auditRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/audit-logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(auditRes.status === 200 && Array.isArray(auditRes.data.data), 'GET /api/audit-logs returns admin audit trail');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
