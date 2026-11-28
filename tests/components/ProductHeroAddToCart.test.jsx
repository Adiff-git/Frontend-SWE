import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { guestAuthValue } from '../mocks/authFixtures.js';
import { makeRawCart, rawProductWithVariants } from '../mocks/cartFixtures.js';
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
import { toProductHeroView } from '../../src/features/customer/product-detail/productDetailApi.js';
import ProductHero from '../../src/features/customer/product-detail/ProductHero.jsx';

function LocationProbe() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="intent">{location.state?.intent ?? ''}</span>
    </div>
  );
}

describe('ProductHero add-to-cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cartApi.getCart).mockResolvedValue(makeRawCart());
    vi.mocked(cartApi.addCartItem).mockResolvedValue(makeRawCart());
  });

  it('adds the selected authoritative variant for an authenticated shopper', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductHero product={toProductHeroView(rawProductWithVariants)} />, {
      initialEntries: ['/products/product-1'],
    });

    await user.click(await screen.findByRole('button', { name: /Thêm vào giỏ hàng/i }));

    expect(cartApi.addCartItem).toHaveBeenCalledWith({
      productVariantId: '00000000-0000-4000-8000-000000000011',
      quantity: 1,
    });
  });

  it('restores return-url intent without auto-submitting', async () => {
    renderWithProviders(<ProductHero product={toProductHeroView(rawProductWithVariants)} />, {
      initialEntries: ['/products/product-1?add=1&variant=00000000-0000-4000-8000-000000000013&quantity=2'],
    });

    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(cartApi.addCartItem).not.toHaveBeenCalled();
  });

  it('preserves add intent for a guest', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ProductHero product={toProductHeroView(rawProductWithVariants)} />
        <LocationProbe />
      </>,
      { authValue: guestAuthValue, initialEntries: ['/products/product-1'] },
    );

    await user.click(await screen.findByRole('button', { name: /Thêm vào giỏ hàng/i }));

    expect(screen.getByTestId('pathname')).toHaveTextContent('/login');
    expect(screen.getByTestId('intent')).toHaveTextContent('add=1');
  });
});
