import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { guestAuthValue } from '../mocks/authFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';
import ProtectedRoute from '../../src/components/ProtectedRoute.jsx';

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

describe('Cart access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects guests to login without requesting cart data', async () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
        </Route>
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>,
      { authValue: guestAuthValue },
    );

    expect(await screen.findByText('Trang đăng nhập')).toBeInTheDocument();
    expect(cartApi.getCart).not.toHaveBeenCalled();
  });
});
