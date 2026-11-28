import { vi } from 'vitest';
import { makeRawCart, makeRawWalletPage } from './cartFixtures.js';

export function createCartApiMocks(overrides = {}) {
  return {
    getCart: vi.fn(async () => makeRawCart()),
    addCartItem: vi.fn(async () => makeRawCart()),
    updateCartQuantity: vi.fn(async () => makeRawCart()),
    changeCartVariant: vi.fn(async () => makeRawCart()),
    selectCartItem: vi.fn(async () => makeRawCart()),
    selectAllCartItems: vi.fn(async () => makeRawCart()),
    removeCartItem: vi.fn(async () => null),
    applyCartVoucher: vi.fn(async () => makeRawCart()),
    removeCartVoucher: vi.fn(async () => null),
    getVoucherWalletPage: vi.fn(async () => makeRawWalletPage()),
    ...overrides,
  };
}
