import test from 'node:test';
import assert from 'node:assert/strict';
import { signupSessionStore } from '../src/features/customer/auth/signupSessionStore.js';

test('signupSessionStore creates, updates, and zeroes out credentials on clear', () => {
  signupSessionStore.clear();
  assert.equal(signupSessionStore.hasSession(), false);
  assert.equal(signupSessionStore.get(), null);

  const sessionId = signupSessionStore.set({
    pendingRegistration: {
      registrationCredential: 'secret-credential-123',
      challengeId: 'challenge-uuid',
      expiresAt: '2026-11-13T20:00:00Z',
    },
    email: 'test@example.com',
    password: 'superSecretPassword123!',
    displayName: 'Test User',
    destination: '/checkout',
  });

  assert.equal(typeof sessionId, 'number');
  assert.equal(signupSessionStore.hasSession(), true);

  const session = signupSessionStore.get();
  assert.equal(session.id, sessionId);
  assert.equal(session.email, 'test@example.com');
  assert.equal(session.password, 'superSecretPassword123!');
  assert.equal(session.pendingRegistration.registrationCredential, 'secret-credential-123');

  // Update pending registration (e.g. after resend)
  signupSessionStore.updatePending(sessionId, {
    registrationCredential: 'rotated-credential-456',
    challengeId: 'new-challenge-uuid',
    expiresAt: '2026-11-13T20:10:00Z',
  });

  const updated = signupSessionStore.get();
  assert.equal(updated.pendingRegistration.registrationCredential, 'rotated-credential-456');

  // Attempting to clear with non-matching targetId should NOT clear
  signupSessionStore.clear(sessionId + 999);
  assert.equal(signupSessionStore.hasSession(), true);
  assert.equal(signupSessionStore.get().email, 'test@example.com');

  // Clear with matching sessionId zeroes out properties on object
  signupSessionStore.clear(sessionId);
  assert.equal(signupSessionStore.hasSession(), false);
  assert.equal(signupSessionStore.get(), null);
  assert.equal(session.password, null);
  assert.equal(session.pendingRegistration, null);
});

test('a delayed resend cannot change a replacement or cleared session', () => {
  const firstId = signupSessionStore.set({ pendingRegistration: { challengeId: 'a' }, password: 'password-a' });
  signupSessionStore.clear(firstId);
  const nextProof = { challengeId: 'b', registrationCredential: 'proof-b' };
  const nextId = signupSessionStore.set({ pendingRegistration: nextProof, password: 'password-b' });
  assert.equal(signupSessionStore.updatePending({ challengeId: 'unscoped' }), false);
  assert.equal(signupSessionStore.updatePending(firstId, { challengeId: 'stale' }), false);
  assert.equal(signupSessionStore.get().pendingRegistration, nextProof);
  assert.equal(signupSessionStore.get().password, 'password-b');
  signupSessionStore.clear(firstId);
  assert.equal(signupSessionStore.get().id, nextId);
  signupSessionStore.clear(nextId);
  assert.equal(signupSessionStore.updatePending(nextId, nextProof), false);
});

