const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { app } = require('../server');
const { isOriginAllowed } = require('../config/corsConfig');
const { getDatabaseStatus, maskMongoURI } = require('../config/db');

let serverInstance;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    // Start server on an ephemeral port (0) for testing
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    serverInstance.close(resolve);
  });
  await mongoose.disconnect();
});

test('GET / - Returns API directory with status 200', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.system.includes('Dynamic Token and Queue Management System'));
  assert.ok(data.endpoints.health);
  assert.ok(data.endpoints.auth);
  assert.ok(data.endpoints.tokens);
});

test('GET /api - Returns API index with status 200', async () => {
  const res = await fetch(`${baseUrl}/api`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.endpoints.staff);
  assert.ok(data.endpoints.admin);
});

test('GET /health - Accurately reflects database connection state', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  
  const dbStatus = getDatabaseStatus();
  if (dbStatus.connected) {
    assert.equal(res.status, 200);
    assert.equal(data.status, 'healthy');
    assert.equal(data.database.connected, true);
  } else {
    // Correctly returns 503 degraded when DB is disconnected
    assert.equal(res.status, 503);
    assert.equal(data.status, 'degraded');
    assert.equal(data.database.connected, false);
  }

  assert.equal(data.server, 'online');
  assert.ok(typeof data.uptimeSeconds === 'number');
  assert.ok(data.timestamp);
});

test('GET /api/health - Alternate endpoint matches /health', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  assert.ok(data.server === 'online');
  assert.ok(data.database);
});

test('GET /unknown-random-route - Returns HTTP 404 with JSON error', async () => {
  const res = await fetch(`${baseUrl}/api/nonexistent-route-404`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Route not found');
});

test('POST /api/auth/register - Rejects missing fields with 400', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'incomplete@test.com' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.includes('name, email, and password'));
});

test('POST /api/auth/login - Rejects missing credentials with 400', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.includes('email and password'));
});

test('GET /api/auth/me - Rejects unauthenticated request with 401', async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.includes('no token provided'));
});

test('POST /api/tokens - Validates missing parameters with 400', async () => {
  const res = await fetch(`${baseUrl}/api/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.includes('required'));
});

test('GET /api/tokens/:id - Validates malformed ObjectId with 400', async () => {
  const res = await fetch(`${baseUrl}/api/tokens/invalid-id-format`);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.includes('Invalid token ID'));
});

test('CORS - Origin validator allows configured and preview domains', () => {
  // Mobile app requests (no origin) must be permitted
  assert.equal(isOriginAllowed(undefined), true);
  assert.equal(isOriginAllowed(null), true);

  // Localhost origins must be permitted
  assert.equal(isOriginAllowed('http://localhost:5173'), true);
  assert.equal(isOriginAllowed('http://localhost:3000'), true);

  // Vercel and Render deployments must be permitted
  assert.equal(isOriginAllowed('https://dynamic-queue.vercel.app'), true);
  assert.equal(isOriginAllowed('https://dynamic-queue-r6bt.onrender.com'), true);
});

test('Dual Route Mounting - Handles requests both with and without /api prefix', async () => {
  // Test POST without /api
  const resWithout = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  // Must NOT return 404 Route not found
  assert.notEqual(resWithout.status, 404);
  assert.equal(resWithout.status, 400);

  // Test POST with /api
  const resWith = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.notEqual(resWith.status, 404);
  assert.equal(resWith.status, 400);

  // Test GET without /api
  const resAdminWithout = await fetch(`${baseUrl}/admin/service-centres`);
  assert.equal(resAdminWithout.status, 200);

  // Test GET with /api
  const resAdminWith = await fetch(`${baseUrl}/api/admin/service-centres`);
  assert.equal(resAdminWith.status, 200);
});

test('POST /api/admin/seed-demo - Requires ADMIN authorization', async () => {
  const res = await fetch(`${baseUrl}/api/admin/seed-demo`, {
    method: 'POST'
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});
