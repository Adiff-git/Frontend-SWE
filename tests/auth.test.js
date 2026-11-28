import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAuth, authErrorMessage, googleAuthErrorMessage } from '../src/features/customer/auth/authValidation.js'
import { tokens } from '../src/api/tokenStore.js'
import { refreshSession, setSessionExpiredHandler } from '../src/api/client.js'

const form = { email: 'user@example.com', password: 'password123', confirmPassword: 'password123', displayName: '' }

test('registration validates confirmation, email and Unicode password limits', () => {
  assert.deepEqual(validateAuth(form, true), {})
  assert.match(validateAuth({ ...form, email: 'invalid-email' }, true).email, /hợp lệ/)
  assert.match(validateAuth({ ...form, email: '' }, true).email, /nhập email/)
  assert.match(validateAuth({ ...form, confirmPassword: 'different' }, true).confirmPassword, /khớp/)
  const tooManyBytes = '😀'.repeat(19)
  assert.match(validateAuth({ ...form, password: tooManyBytes, confirmPassword: tooManyBytes }, true).password, /72/)
  const eightCodePoints = '😀'.repeat(8)
  assert.deepEqual(validateAuth({ ...form, password: eightCodePoints, confirmPassword: eightCodePoints }, true), {})
  assert.match(validateAuth({ ...form, displayName: 'x'.repeat(101) }, true).displayName, /100/)
})

test('login allows existing short passwords and email without changing password whitespace', () => {
  assert.deepEqual(validateAuth({ ...form, email: 'user@example.com', password: ' x ' }, false), {})
  assert.match(validateAuth({ ...form, email: '  ' }, false).email, /nhập/)
  assert.deepEqual(validateAuth({ ...form, email: 'legacy_username' }, false), {})
})

test('authErrorMessage returns localized friendly error messages', () => {
  assert.match(authErrorMessage({ status: 401 }, false), /Email hoặc mật khẩu không đúng/)
  assert.match(authErrorMessage({ status: 409 }, true), /Email đã được sử dụng/)
  assert.match(authErrorMessage({ status: 429 }, false), /quá nhiều lần/)
})

test('Google initiation failures do not blame password credentials and preserve actionable errors', () => {
  for (const status of [400, 401, 403, 404, 503]) {
    assert.match(googleAuthErrorMessage({ status }), /Chưa thể đăng nhập bằng Google/)
    assert.doesNotMatch(googleAuthErrorMessage({ status }), /mật khẩu không đúng/)
  }
  assert.match(googleAuthErrorMessage({ status: 409, code: 'ACCOUNT_CONNECTION_REQUIRED' }), /liên kết Google/)
  assert.match(googleAuthErrorMessage({ status: 409, code: 'SESSION_CHANGED' }), /Phiên đăng nhập/)
  assert.match(googleAuthErrorMessage({ status: 0 }), /Không thể kết nối/)
  assert.match(googleAuthErrorMessage({ status: 0 }), /Chưa thể đăng nhập bằng Google/)
  assert.match(authErrorMessage({ status: 401 }, false), /Email hoặc mật khẩu không đúng/)
})

test('remember preference survives refresh rotation and logout clears both stores', () => {
  const storage = () => {
    const entries = new Map()
    return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) }
  }
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()
  tokens.setRefresh('tab-token', false)
  tokens.setRefresh('tab-rotation')
  assert.equal(sessionStorage.getItem('refreshToken'), 'tab-rotation')
  assert.equal(localStorage.getItem('refreshToken'), null)
  tokens.setRefresh('persistent-token', true)
  tokens.setRefresh('persistent-rotation')
  assert.equal(localStorage.getItem('refreshToken'), 'persistent-rotation')
  assert.equal(sessionStorage.getItem('refreshToken'), null)
  tokens.setAccess('access-token')
  assert.equal(tokens.hasSession(), true)
  tokens.clear()
  assert.equal(tokens.hasSession(), false)
  assert.equal(tokens.getAccess(), null)
  assert.equal(tokens.getRefresh(), null)
})

test('stale refresh rejection (401) does not clear newer session or trigger onSessionExpired', async () => {
  const originalFetch = globalThis.fetch
  const storage = () => {
    const entries = new Map()
    return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) }
  }
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()

  let expiredCalled = false
  setSessionExpiredHandler(() => { expiredCalled = true })

  // 1. Set up session 1
  tokens.clear()
  tokens.setRefresh('old-refresh-token', false)
  tokens.setAccess('old-access-token')

  // 2. Start refresh with deferred response
  let resolveRefresh
  globalThis.fetch = () =>
    new Promise((resolve) => {
      resolveRefresh = resolve
    })

  const refreshPromise = refreshSession()

  // 3. User logs in with a new session while refresh is pending
  tokens.clear()
  tokens.setRefresh('new-refresh-token', false)
  tokens.setAccess('new-access-token')

  // 4. Old refresh arrives with 401
  resolveRefresh({
    status: 401,
    ok: false,
    statusText: 'Unauthorized',
    json: async () => ({ message: 'Old token expired' }),
  })

  await assert.rejects(refreshPromise)

  // 5. Verify newer session is intact and expired handler was not triggered
  assert.equal(tokens.getAccess(), 'new-access-token')
  assert.equal(tokens.getRefresh(), 'new-refresh-token')
  assert.equal(tokens.hasSession(), true)
  assert.equal(expiredCalled, false)

  globalThis.fetch = originalFetch
})

test('legitimate refresh rejection (401) clears matching session and triggers onSessionExpired', async () => {
  const originalFetch = globalThis.fetch
  const storage = () => {
    const entries = new Map()
    return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) }
  }
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()

  let expiredCalled = false
  setSessionExpiredHandler(() => { expiredCalled = true })

  tokens.clear()
  tokens.setRefresh('active-refresh-token', false)
  tokens.setAccess('active-access-token')

  globalThis.fetch = async () => ({
    status: 401,
    ok: false,
    statusText: 'Unauthorized',
    json: async () => ({ message: 'Session expired' }),
  })

  await assert.rejects(refreshSession())

  assert.equal(tokens.hasSession(), false)
  assert.equal(tokens.getAccess(), null)
  assert.equal(tokens.getRefresh(), null)
  assert.equal(expiredCalled, true)

  globalThis.fetch = originalFetch
})

