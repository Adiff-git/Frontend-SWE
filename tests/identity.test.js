import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createMockApiMiddleware, resetMockDb } from '../dev/mockApiPlugin.js';
import { register, confirmRegistration, login, getCurrentUser } from '../src/api/auth.js';
import { api, refreshSession, setSessionExpiredHandler } from '../src/api/client.js';
import { tokens } from '../src/api/tokenStore.js';
import { createEmailChallenge, confirmEmailChallenge, reauthenticate, exchangeGoogleCode, startGoogleAttempt } from '../src/api/identity.js';
import { uploadImageBytes } from '../src/api/media.js';
import { createPkce } from '../src/features/customer/auth/googleFlow.js';

const storage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
};
function resetSession() {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  tokens.clear();
  setSessionExpiredHandler(null);
}

test('shared API completes signup, keeps official email until proof confirmation and preserves a session after bad reauth', async () => {
  resetSession(); resetMockDb();
  const middleware = createMockApiMiddleware();
  const server = http.createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const original = globalThis.fetch;
  globalThis.fetch = (url, options) => original(new URL(new URL(url).pathname, base), options);
  try {
    const pending = await register('flow@example.com', 'initial password');
    assert.equal(tokens.hasSession(), false);
    const session = await confirmRegistration(pending, '000123', 'chosen password');
    assert.equal(session.committed, true);
    assert.equal(tokens.hasSession(), true);
    assert.ok(tokens.getSessionMarker());
    const profile = await getCurrentUser();
    assert.equal(profile.emailVerified, true);
    const challenge = await createEmailChallenge('EMAIL_CHANGE', 'next@example.com');
    assert.equal((await api.get('/api/me')).email, 'flow@example.com');
    const access = tokens.getAccess();
    await assert.rejects(reauthenticate('EMAIL_CHANGE', 'wrong'), { status: 401 });
    assert.equal(tokens.getAccess(), access);
    const proof = await reauthenticate('EMAIL_CHANGE', 'chosen password');
    await confirmEmailChallenge(challenge.id, '000123', proof.recentAuthProof);
    assert.equal((await api.get('/api/me')).email, 'next@example.com');
    await assert.rejects(api.put('/api/me', { email: null }), { status: 400, code: 'EMAIL_VERIFICATION_REQUIRED' });
    const refresh = tokens.getRefresh();
    await api.put('/api/auth/password', { currentPassword: 'chosen password', newPassword: 'replacement password' }, { autoRefresh: false });
    const response = await original(`${base}/api/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) });
    assert.equal(response.status, 401);
  } finally {
    globalThis.fetch = original;
    tokens.clear();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('old authenticated requests cannot refresh or retry under a replacement account', async () => {
  resetSession();
  tokens.setAccess('old-access'); tokens.setRefresh('old-refresh', false);
  const original = globalThis.fetch;
  let release;
  let count = 0;
  globalThis.fetch = () => { count += 1; return new Promise((resolve) => { release = resolve; }); };
  try {
    const pending = api.put('/api/me', { displayName: 'Old account' });
    tokens.clear(); tokens.setAccess('new-access'); tokens.setRefresh('new-refresh', false);
    release(new Response('{}', { status: 401 }));
    await assert.rejects(pending, { code: 'SESSION_CHANGED' });
    assert.equal(count, 1);
    assert.equal(tokens.getAccess(), 'new-access');
  } finally { globalThis.fetch = original; tokens.clear(); }
});

test('ambiguous refresh is suspended until a new session instead of replaying a consumed secret', async () => {
  resetSession(); tokens.setRefresh('refresh', false);
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () => { count += 1; throw new TypeError('Disconnected'); };
  try {
    await assert.rejects(refreshSession(), { code: 'SESSION_RECOVERY_REQUIRED' });
    await assert.rejects(refreshSession(), { code: 'SESSION_RECOVERY_REQUIRED' });
    assert.equal(count, 1);
  } finally { globalThis.fetch = original; tokens.clear(); }
});

test('a replacement session does not inherit the previous refresh flight', async () => {
  resetSession(); tokens.setRefresh('old-secret', false);
  const original = globalThis.fetch;
  let release;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Promise((resolve) => { release = resolve; });
    return new Response(JSON.stringify({ tokenType: 'Bearer', accessTokenExpiresIn: 900,
      refreshToken: 'A'.repeat(43), refreshTokenExpiresAt: new Date(Date.now() + 60000).toISOString() }),
    { status: 200, headers: { Authorization: 'Bearer new-access' } });
  };
  try {
    const first = refreshSession();
    tokens.clear(); tokens.setRefresh('new-secret', false);
    const replacement = refreshSession();
    assert.notEqual(replacement, first);
    const oldFailure = assert.rejects(first, { status: 401 });
    release(new Response('{}', { status: 401 }));
    await oldFailure;
    await replacement;
    assert.equal(calls, 2);
    assert.equal(tokens.getAccess(), 'new-access');
    assert.equal(tokens.getRefresh(), 'A'.repeat(43));
  } finally { globalThis.fetch = original; tokens.clear(); }
});

test('a stale successful login cannot commit session tokens', async () => {
  resetSession();
  const original = globalThis.fetch;
  let release;
  globalThis.fetch = () => new Promise((resolve) => { release = resolve; });
  try {
    const pending = login('old', 'password');
    tokens.clear(); tokens.setRefresh('current', false); tokens.setAccess('current-access');
    release(new Response(JSON.stringify({ refreshToken: 'stale' }), { status: 200, headers: { Authorization: 'Bearer stale-access' } }));
    await assert.rejects(pending, { code: 'SESSION_CHANGED' });
    assert.equal(tokens.getAccess(), 'current-access');
  } finally { globalThis.fetch = original; tokens.clear(); }
});

test('Google LINK/REAUTH exchanges attach bearer without creating a session; initiation includes credentials', async () => {
  resetSession(); tokens.setAccess('active'); tokens.setRefresh('unchanged', false);
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), ...options });
    return new Response(JSON.stringify({ connected: true, linkedAt: null }), { status: 200 });
  };
  try {
    await startGoogleAttempt('LOGIN', { codeChallenge: 'test', codeChallengeMethod: 'S256' });
    assert.equal(requests[0].credentials, 'include');
    assert.equal(requests[0].headers.Authorization, undefined);
    await exchangeGoogleCode('code', 'verifier', 'LINK');
    await exchangeGoogleCode('code', 'verifier', 'REAUTH');
    assert.equal(requests[1].headers.Authorization, 'Bearer active');
    assert.equal(tokens.getRefresh(), 'unchanged');
  } finally { globalThis.fetch = original; tokens.clear(); }
});

test('signed image transport sends untouched URL and raw bytes without application credentials', async () => {
  resetSession(); tokens.setAccess('private-access');
  const original = globalThis.fetch;
  const file = new Blob(['image'], { type: 'image/png' });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://storage.example.test/asset?signature=synthetic');
    assert.equal(options.body, file);
    assert.deepEqual(options.headers, { 'Content-Type': 'image/png' });
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    return new Response(null, { status: 200 });
  };
  try { await uploadImageBytes('https://storage.example.test/asset?signature=synthetic', file); }
  finally { globalThis.fetch = original; tokens.clear(); }
});

test('PKCE creates an S256 challenge from its random verifier', async () => {
  const { verifier, challenge } = await createPkce();
  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const expected = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assert.equal(challenge, expected);
});
