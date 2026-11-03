import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAuth } from '../src/features/customer/auth/authValidation.js'
import { tokens } from '../src/api/tokenStore.js'

const form = { username: 'test-user', password: 'password123', confirmPassword: 'password123', displayName: '' }

test('registration validates confirmation, username and Unicode password limits', () => {
  assert.deepEqual(validateAuth(form, true), {})
  assert.match(validateAuth({ ...form, username: 'a@b' }, true).username, /4–50/)
  assert.match(validateAuth({ ...form, confirmPassword: 'different' }, true).confirmPassword, /khớp/)
  const tooManyBytes = '😀'.repeat(19)
  assert.match(validateAuth({ ...form, password: tooManyBytes, confirmPassword: tooManyBytes }, true).password, /72/)
  const eightCodePoints = '😀'.repeat(8)
  assert.deepEqual(validateAuth({ ...form, password: eightCodePoints, confirmPassword: eightCodePoints }, true), {})
  assert.match(validateAuth({ ...form, displayName: 'x'.repeat(101) }, true).displayName, /100/)
})

test('login allows existing short passwords and email identifiers without changing password whitespace', () => {
  assert.deepEqual(validateAuth({ ...form, username: 'user@example.com', password: ' x ' }, false), {})
  assert.match(validateAuth({ ...form, username: '  ' }, false).username, /nhập/)
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
