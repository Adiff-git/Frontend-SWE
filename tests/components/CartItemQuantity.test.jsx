import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRawCart, rawProductWithVariants } from '../mocks/cartFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';
import { toCartView } from '../../src/features/customer/cart/cartMappers.js';
import { toProductHeroView } from '../../src/features/customer/product-detail/productDetailApi.js';
import CartItems from '../../src/features/customer/cart/CartItems.jsx';

describe('Cart item quantity', () => {
  it('sends the next valid quantity from mocked cart data', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    const cart = toCartView(makeRawCart());
    const variants = toProductHeroView(rawProductWithVariants).options;

    renderWithProviders(
      <CartItems cart={cart} variantOptions={{ [cart.items[0].productId]: variants }} onUpdateQuantity={onUpdateQuantity} />,
    );

    await user.click(screen.getByRole('button', { name: 'Tăng số lượng iPhone 15 Pro Max' }));

    expect(onUpdateQuantity).toHaveBeenCalledWith({ itemId: 1, quantity: 3 });
  });

  it('disables decrementing below one', () => {
    const cart = toCartView(makeRawCart({
      items: [makeRawCart().items[0], { ...makeRawCart().items[0], id: 3, quantity: 1 }],
    }));

    renderWithProviders(<CartItems cart={cart} />);

    const buttons = screen.getAllByRole('button', { name: /Giảm số lượng/ });
    expect(buttons[1]).toBeDisabled();
  });
});
