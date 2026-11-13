import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafeReturnDestination } from '../src/features/customer/auth/navigation.js';
import { tokens } from '../src/api/tokenStore.js';

test('getSafeReturnDestination preserves valid internal pathname, search, and hash', () => {
  assert.equal(
    getSafeReturnDestination({ pathname: '/profile/orders', search: '?page=2', hash: '#details' }),
    '/profile/orders?page=2#details',
  );
  assert.equal(getSafeReturnDestination('/checkout'), '/checkout');
  assert.equal(getSafeReturnDestination(null, '?redirect=%2Fproducts%3Fcategory%3Dphone'), '/products?category=phone');
});

test('getSafeReturnDestination rejects external, protocol-relative, backslash and malformed destinations', () => {
  assert.equal(getSafeReturnDestination('https://phishing.com'), '/');
  assert.equal(getSafeReturnDestination('http://phishing.com'), '/');
  assert.equal(getSafeReturnDestination('//phishing.com'), '/');
  assert.equal(getSafeReturnDestination('/\\phishing.com'), '/');
  assert.equal(getSafeReturnDestination(null, '?redirect=https%3A%2F%2Fevil.com'), '/');
  assert.equal(getSafeReturnDestination(undefined), '/');
  assert.equal(getSafeReturnDestination(123), '/');
  assert.equal(getSafeReturnDestination({}), '/');
});

test('getSafeReturnDestination prevents auth redirect loops and unavailable admin routes', () => {
  assert.equal(getSafeReturnDestination('/login'), '/');
  assert.equal(getSafeReturnDestination('/signup'), '/');
  assert.equal(getSafeReturnDestination('/signup/verify'), '/');
  assert.equal(getSafeReturnDestination('/login/forget'), '/');
  assert.equal(getSafeReturnDestination('/login/reset'), '/');
  assert.equal(getSafeReturnDestination('/admin'), '/');
  assert.equal(getSafeReturnDestination('/admin/products/123'), '/');
  assert.equal(getSafeReturnDestination({ pathname: '/admin/orders' }), '/');
});

test('tokens generation increments on clear and nextGeneration', () => {
  const g1 = tokens.getGeneration();
  const g2 = tokens.nextGeneration();
  assert.equal(g2, g1 + 1);

  tokens.clear();
  const g3 = tokens.getGeneration();
  assert.equal(g3, g2 + 1);
});

