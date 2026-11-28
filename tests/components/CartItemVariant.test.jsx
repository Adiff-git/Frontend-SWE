import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRawCart, rawProductWithVariants } from '../mocks/cartFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';
import { toCartView } from '../../src/features/customer/cart/cartMappers.js';
import { toProductHeroView } from '../../src/features/customer/product-detail/productDetailApi.js';
import CartItem from '../../src/features/customer/cart/CartItem.jsx';

describe('Cart item variant', () => {
  it('loads variants and submits the authoritative variant id', async () => {
    const user = userEvent.setup();
    const onVariantRequest = vi.fn();
    const onVariantChange = vi.fn();
    const item = toCartView(makeRawCart()).items[0];
    const variants = toProductHeroView(rawProductWithVariants).options;

    renderWithProviders(
      <CartItem
        item={item}
        variants={variants}
        onVariantRequest={onVariantRequest}
        onVariantChange={onVariantChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Đổi biến thể' }));

    expect(onVariantRequest).toHaveBeenCalledWith(item.productId);

    await user.click(screen.getByRole('button', { name: /512GB/ }));

    expect(onVariantChange).toHaveBeenCalledWith({
      itemId: 1,
      productVariantId: '00000000-0000-4000-8000-000000000013',
    });
  });
});
