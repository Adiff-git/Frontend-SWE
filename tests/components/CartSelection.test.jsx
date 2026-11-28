import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRawCart } from '../mocks/cartFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';
import { toCartView } from '../../src/features/customer/cart/cartMappers.js';
import CartItems from '../../src/features/customer/cart/CartItems.jsx';

describe('Cart selection', () => {
  it('submits authoritative selection changes for row and select all', async () => {
    const user = userEvent.setup();
    const onToggleItem = vi.fn();
    const onToggleAll = vi.fn();
    const cart = toCartView(makeRawCart());

    renderWithProviders(
      <CartItems cart={cart} onToggleItem={onToggleItem} onToggleAll={onToggleAll} />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes.find((checkbox) => checkbox.getAttribute('aria-label') === null && checkbox !== checkboxes[0]));

    expect(onToggleItem).toHaveBeenCalledWith({ itemId: 1, selected: false });

    await user.click(screen.getByRole('checkbox', { name: /Chọn tất cả/ }));

    expect(onToggleAll).toHaveBeenCalledWith(false);
  });
});
