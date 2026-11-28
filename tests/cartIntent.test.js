import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAddIntent, readAddIntent } from '../src/features/customer/cart/cartIntent.js';

test('buildAddIntent preserves pathname and query separators', () => {
  assert.equal(
    buildAddIntent({ variantId: 'v-1', quantity: 2, pathname: '/products/1' }),
    '/products/1?add=1&variant=v-1&quantity=2',
  );
  assert.equal(
    buildAddIntent({ variantId: 'v-1', quantity: 2, pathname: '/products/1?tab=specs' }),
    '/products/1?tab=specs&add=1&variant=v-1&quantity=2',
  );
});

test('readAddIntent ignores invalid quantities', () => {
  assert.deepEqual(readAddIntent('?add=1&variant=v-1&quantity=2'), { variantId: 'v-1', quantity: 2 });
  assert.equal(readAddIntent('?add=1&variant=v-1&quantity=0'), null);
  assert.equal(readAddIntent('?variant=v-1&quantity=2'), null);
});
