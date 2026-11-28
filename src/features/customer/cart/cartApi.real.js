import { api } from '../../../api/client.js';
import { parseExactMoneyJson } from './exactMoneyJson.js';

const cartOptions = (options = {}) => ({
  responseType: 'text',
  expectedStatus: 200,
  ...options,
});

export function getCart({ signal } = {}) {
  return api.get('/api/me/cart', undefined, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function addCartItem({ productVariantId, quantity, signal }) {
  return api.post('/api/me/cart/items', { productVariantId, quantity }, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function updateCartQuantity({ itemId, quantity, signal }) {
  return api.put(`/api/me/cart/items/${encodeURIComponent(itemId)}/quantity`, { quantity }, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function changeCartVariant({ itemId, productVariantId, signal }) {
  return api.put(`/api/me/cart/items/${encodeURIComponent(itemId)}/variant`, { productVariantId }, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function selectCartItem({ itemId, selected, signal }) {
  return api.put(`/api/me/cart/items/${encodeURIComponent(itemId)}/selection`, { selected }, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function selectAllCartItems({ selected, signal }) {
  return api.put('/api/me/cart/selection', { selected }, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function removeCartItem({ itemId, signal }) {
  return api.delete(`/api/me/cart/items/${encodeURIComponent(itemId)}`, { signal, expectedStatus: 204 });
}

export function applyCartVoucher({ walletEntitlementId, signal }) {
  return api.put('/api/me/cart/voucher', { walletEntitlementId }, cartOptions({ signal })).then(parseExactMoneyJson);
}

export function removeCartVoucher({ signal } = {}) {
  return api.delete('/api/me/cart/voucher', { signal, expectedStatus: 204 });
}

export function getVoucherWalletPage({ page = 0, size = 20, signal } = {}) {
  return api.get('/api/me/vouchers', { page, size }, cartOptions({ signal })).then(parseExactMoneyJson);
}
