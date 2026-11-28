import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRawCart, makeRawWalletPage } from '../mocks/cartFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';

vi.mock('../../src/features/customer/cart/cartApi.js', () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartQuantity: vi.fn(),
  changeCartVariant: vi.fn(),
  selectCartItem: vi.fn(),
  selectAllCartItems: vi.fn(),
  removeCartItem: vi.fn(),
  applyCartVoucher: vi.fn(),
  removeCartVoucher: vi.fn(),
  getVoucherWalletPage: vi.fn(),
}));

import * as cartApi from '../../src/features/customer/cart/cartApi.js';
import CartPage from '../../src/features/customer/cart/CartPage.jsx';

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cartApi.getCart).mockResolvedValue(makeRawCart());
    vi.mocked(cartApi.getVoucherWalletPage).mockResolvedValue(makeRawWalletPage());
    vi.mocked(cartApi.updateCartQuantity).mockResolvedValue(makeRawCart());
  });

  it('renders authoritative cart rows and totals from mocked API responses', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    expect(await screen.findByText('iPhone 15 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Tai nghe AirPods Pro')).toBeInTheDocument();
    expect(screen.getAllByText('59.980.000₫').length).toBeGreaterThan(0);
    expect(screen.getByText('Số lượng tồn kho không đủ')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tăng số lượng iPhone 15 Pro Max' }));

    expect(cartApi.updateCartQuantity).toHaveBeenCalledWith({ itemId: 1, quantity: 3 });
  });
});
