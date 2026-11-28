import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidQuantity, normalizeQuantity } from '../src/features/customer/cart/cartValidation.js';

test('isValidQuantity accepts integers from 1 to 999', () => {
  assert.equal(isValidQuantity(1), true);
  assert.equal(isValidQuantity(999), true);
  assert.equal(isValidQuantity(0), false);
  assert.equal(isValidQuantity(-1), false);
  assert.equal(isValidQuantity(1.5), false);
  assert.equal(isValidQuantity(1000), false);
  assert.equal(isValidQuantity('2'), false);
});

test('normalizeQuantity rejects out-of-range and non-integer values', () => {
  assert.equal(normalizeQuantity(2), 2);
  assert.equal(normalizeQuantity(0), null);
  assert.equal(normalizeQuantity(5000), null);
  assert.equal(normalizeQuantity('abc'), null);
});
