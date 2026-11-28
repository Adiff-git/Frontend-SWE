import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRawCart } from '../mocks/cartFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';
import { toCartView } from '../../src/features/customer/cart/cartMappers.js';
import CartItems from '../../src/features/customer/cart/CartItems.jsx';

describe('Cart removal', () => {
  it('submits one-item and selected-item removals', async () => {
    const user = userEvent.setup();
    const onRemoveItem = vi.fn();
    const onRemoveSelected = vi.fn();
    const cart = toCartView(makeRawCart());

    renderWithProviders(
      <CartItems cart={cart} onRemoveItem={onRemoveItem} onRemoveSelected={onRemoveSelected} />,
    );

    await user.click(screen.getByRole('button', { name: 'Xóa iPhone 15 Pro Max' }));
    await user.click(screen.getByRole('button', { name: 'Xóa sản phẩm đã chọn' }));

    expect(onRemoveItem).toHaveBeenCalledWith({ itemId: 1 });
    expect(onRemoveSelected).toHaveBeenCalledWith([1]);
  });
});
