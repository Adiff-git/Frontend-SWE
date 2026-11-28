import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCartItem,
  changeCartVariant,
  getCart,
  getVoucherWalletPage,
  removeCartItem,
  updateCartQuantity,
} from '../src/features/customer/cart/cartApi.js';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('getCart calls the cart endpoint and parses exact money text', async () => {
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url: String(url), init };
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"totalItemCount":1,"finalTotal":{"amount":59980000,"currency":"VND"}}',
    };
  };

  const result = await getCart();

  assert.equal(request.url, 'http://localhost:8080/api/me/cart');
  assert.equal(request.init.method, 'GET');
  assert.equal(result.finalTotal.amount, '59980000');
});

test('cart mutations send the documented method and payload', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"items":[]}',
    };
  };

  await addCartItem({ productVariantId: 'variant-1', quantity: 2 });
  await updateCartQuantity({ itemId: 12, quantity: 3 });
  await changeCartVariant({ itemId: 12, productVariantId: 'variant-2' });

  assert.deepEqual(calls[0], {
    url: 'http://localhost:8080/api/me/cart/items',
    method: 'POST',
    body: { productVariantId: 'variant-1', quantity: 2 },
  });
  assert.equal(calls[1].url, 'http://localhost:8080/api/me/cart/items/12/quantity');
  assert.deepEqual(calls[1].body, { quantity: 3 });
  assert.equal(calls[2].url, 'http://localhost:8080/api/me/cart/items/12/variant');
  assert.deepEqual(calls[2].body, { productVariantId: 'variant-2' });
});

test('getVoucherWalletPage sends paging parameters', async () => {
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = new URL(String(url));
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"page":1,"size":20,"items":[]}',
    };
  };

  const result = await getVoucherWalletPage({ page: 1, size: 20 });

  assert.equal(requestUrl.pathname, '/api/me/vouchers');
  assert.equal(requestUrl.searchParams.get('page'), '1');
  assert.equal(result.page, 1);
});

test('removeCartItem surfaces 404 so already-removed items can be ignored', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: async () => '{"detail":"Không tìm thấy"}',
    json: async () => ({ detail: 'Không tìm thấy' }),
  });

  await assert.rejects(() => removeCartItem({ itemId: 12 }), (error) => error.status === 404);
});

test('removeCartItem accepts 204 responses', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 204,
    statusText: 'No Content',
    text: async () => '',
  });

  assert.equal(await removeCartItem({ itemId: 12 }), null);
});
