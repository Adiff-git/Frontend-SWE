import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createMockApiMiddleware, resetMockDb } from '../dev/mockApiPlugin.js';

async function withServer(fn) {
  resetMockDb();
  const middleware = createMockApiMiddleware();
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end('PASSED_TO_NEXT');
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('registration is pending until confirmation, rotates resend authority and issues tokens once', async () => {
  await withServer(async (url) => {
    const post = (path, body) => fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const start = await post('/api/auth/register', { email: 'newuser1@example.com', password: 'password123' });
    assert.equal(start.status, 202);
    assert.equal(start.headers.get('Authorization'), null);
    const first = await start.json();
    const before = await post('/api/auth/login', { identifier: 'newuser1@example.com', password: 'password123' });
    assert.equal(before.status, 401);
    const resent = await post('/api/auth/registration-verifications/resend', { registrationCredential: first.registrationCredential, challengeId: first.challengeId });
    assert.equal(resent.status, 202);
    const pending = await resent.json();
    assert.notEqual(pending.registrationCredential, first.registrationCredential);
    const confirm = (proof, code = '000123') => post('/api/auth/registration-verifications/confirm', { registrationCredential: proof.registrationCredential, challengeId: proof.challengeId, code, password: 'chosen password' });
    assert.equal((await confirm(first)).status, 400);
    assert.equal((await confirm(pending, '111111')).status, 400);
    const result = await confirm(pending);
    assert.equal(result.status, 201);
    assert.match(result.headers.get('Authorization'), /^Bearer /);
    const body = await result.json();
    assert.match(body.refreshToken, /^[A-Za-z0-9_-]{43}$/);
    assert.deepEqual(Object.keys(body).sort(), ['accessTokenExpiresIn', 'refreshToken', 'refreshTokenExpiresAt', 'tokenType']);
    assert.equal((await confirm(pending)).status, 400);
    assert.equal((await post('/api/auth/login', { identifier: 'newuser1@example.com', password: 'chosen password' })).status, 200);
  });
});

test('POST /api/auth/register checks case-insensitive username/email duplicates with 409', async () => {
  await withServer(async (url) => {
    // chamtech_user / tuananh@chamtech.vn is already seeded
    const res = await fetch(`${url}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'TUANANH@CHAMTECH.VN', password: 'password123' }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.status, 409);
    assert.match(body.message, /exists/);
  });
});

test('POST /api/auth/login accepts username and email, rejecting invalid credentials with generic 401', async () => {
  await withServer(async (url) => {
    // 1. Login with username
    const resUser = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo_user', password: 'password123' }),
    });
    assert.equal(resUser.status, 200);
    assert.match(resUser.headers.get('Authorization') || '', /^Bearer /);

    // 2. Login with email
    const resEmail = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'DEMO@CHAMTECH.VN', password: 'password123' }),
    });
    assert.equal(resEmail.status, 200);

    // 3. Bad credentials
    const resBad = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo_user', password: 'wrongpassword' }),
    });
    assert.equal(resBad.status, 401);
    const body = await resBad.json();
    assert.equal(body.status, 401);
    assert.equal(body.message, 'Invalid credentials.');
  });
});

test('POST /api/auth/login preserves password whitespace and rejects trimmed mismatch', async () => {
  await withServer(async (url) => {
    // Register user with password containing surrounding whitespace
    const pendingResponse = await fetch(`${url}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'spaces@example.com', password: '  secret123  ' }),
    });
    const pending = await pendingResponse.json();
    const confirmed = await fetch(`${url}/api/auth/registration-verifications/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pending, expiresAt: undefined, code: '000123', password: '  secret123  ' }),
    });
    assert.equal(confirmed.status, 201);

    // Login with exact whitespace matches
    const resOk = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'spaces@example.com', password: '  secret123  ' }),
    });
    assert.equal(resOk.status, 200);

    // Login with trimmed password fails
    const resFail = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'spaces@example.com', password: 'secret123' }),
    });
    assert.equal(resFail.status, 401);
  });
});

test('GET /api/me returns full profile for valid token and 401 for missing/invalid token', async () => {
  await withServer(async (url) => {
    // Login to obtain valid access token
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'chamtech_user', password: 'password123' }),
    });
    const accessHeader = loginRes.headers.get('Authorization');

    // Valid token
    const resProfile = await fetch(`${url}/api/me`, {
      headers: { Authorization: accessHeader },
    });
    assert.equal(resProfile.status, 200);
    const profile = await resProfile.json();
    assert.equal(profile.username, 'chamtech_user');
    assert.equal(profile.displayName, 'Nguyễn Tuấn Anh');
    assert.equal(profile.email, 'tuananh@chamtech.vn');
    assert.equal(profile.accountStatus, 'ACTIVE');

    // Missing token
    const resMissing = await fetch(`${url}/api/me`);
    assert.equal(resMissing.status, 401);

    // Invalid token
    const resInvalid = await fetch(`${url}/api/me`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    assert.equal(resInvalid.status, 401);
  });
});

test('PUT /api/me updates displayName and enforces validation with fieldErrors', async () => {
  await withServer(async (url) => {
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo_user', password: 'password123' }),
    });
    const accessHeader = loginRes.headers.get('Authorization');

    // Valid update
    const resUpdate = await fetch(`${url}/api/me`, {
      method: 'PUT',
      headers: {
        Authorization: accessHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: 'Tên Mới' }),
    });
    assert.equal(resUpdate.status, 200);
    const updated = await resUpdate.json();
    assert.equal(updated.displayName, 'Tên Mới');

    // Verify GET reflects update
    const resGet = await fetch(`${url}/api/me`, { headers: { Authorization: accessHeader } });
    const profile = await resGet.json();
    assert.equal(profile.displayName, 'Tên Mới');

    // Blank displayName error
    const resBlank = await fetch(`${url}/api/me`, {
      method: 'PUT',
      headers: {
        Authorization: accessHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: '   ' }),
    });
    assert.equal(resBlank.status, 400);
    const blankBody = await resBlank.json();
    assert.ok(blankBody.fieldErrors?.displayName);
  });
});

test('POST /api/auth/refresh rotates token and single-use invalidates consumed token', async () => {
  await withServer(async (url) => {
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo_user', password: 'password123' }),
    });
    const { refreshToken: firstRefresh, refreshTokenExpiresAt: deadline } = await loginRes.json();

    // First refresh: succeeds
    const refreshRes1 = await fetch(`${url}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: firstRefresh }),
    });
    assert.equal(refreshRes1.status, 200);
    const { refreshToken: secondRefresh, refreshTokenExpiresAt: rotatedDeadline } = await refreshRes1.json();
    assert.notEqual(firstRefresh, secondRefresh);
    assert.equal(rotatedDeadline, deadline);

    // Reuse consumed refresh token: fails with 401
    const refreshResReuse = await fetch(`${url}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: firstRefresh }),
    });
    assert.equal(refreshResReuse.status, 401);
    const descendant = await fetch(`${url}/api/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: secondRefresh }),
    });
    assert.equal(descendant.status, 401);
  });
});

test('POST /api/auth/logout returns 204 and invalidates session', async () => {
  await withServer(async (url) => {
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo_user', password: 'password123' }),
    });
    const accessHeader = loginRes.headers.get('Authorization');
    const { refreshToken } = await loginRes.json();

    // Logout
    const logoutRes = await fetch(`${url}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    assert.equal(logoutRes.status, 204);

    // Subsequent refresh with that token fails
    const refreshRes = await fetch(`${url}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    assert.equal(refreshRes.status, 401);

    // Subsequent access with that access token fails
    const meRes = await fetch(`${url}/api/me`, {
      headers: { Authorization: accessHeader },
    });
    assert.equal(meRes.status, 401);
  });
});

test('Unknown routes call next() without intercepting', async () => {
  await withServer(async (url) => {
    const res = await fetch(`${url}/api/products`);
    assert.equal(res.status, 404);
    const text = await res.text();
    assert.equal(text, 'PASSED_TO_NEXT');
  });
});

test('Malformed and oversized JSON payloads fail safely with 400', async () => {
  await withServer(async (url) => {
    // Malformed JSON
    const resMalformed = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json }',
    });
    assert.equal(resMalformed.status, 400);

    // Oversized body (> 64KB)
    const bigPayload = JSON.stringify({ identifier: 'x', password: 'y'.repeat(70 * 1024) });
    const resBig = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bigPayload,
    });
    assert.equal(resBig.status, 400);
  });
});

