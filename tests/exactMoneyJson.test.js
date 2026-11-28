import assert from 'node:assert/strict';
import test from 'node:test';
import { parseExactMoneyJson, formatExactVnd } from '../src/features/customer/cart/exactMoneyJson.js';

test('parseExactMoneyJson quotes only numeric amount fields', () => {
  const parsed = parseExactMoneyJson('{"finalTotal":{"amount":9007199254740993,"currency":"VND"}}');
  assert.equal(parsed.finalTotal.amount, '9007199254740993');
});

test('parseExactMoneyJson rejects decimal amounts', () => {
  assert.throws(
    () => parseExactMoneyJson('{"amount":1.5}'),
    /không phải số nguyên/,
  );
});

test('formatExactVnd formats integers without precision loss', () => {
  assert.equal(formatExactVnd('9007199254740993'), '9.007.199.254.740.993₫');
  assert.equal(formatExactVnd('abc'), '—');
});
