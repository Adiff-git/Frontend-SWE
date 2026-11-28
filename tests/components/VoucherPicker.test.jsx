import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRawWalletPage } from '../mocks/cartFixtures.js';
import { renderWithProviders } from '../mocks/renderWithProviders.jsx';
import { toVoucherView } from '../../src/features/customer/cart/cartMappers.js';
import VoucherPicker from '../../src/features/customer/cart/VoucherPicker.jsx';

describe('Voucher picker', () => {
  it('applies only eligible mocked vouchers and can remove the applied voucher', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onRemove = vi.fn();
    const entries = makeRawWalletPage().items.map(toVoucherView);

    renderWithProviders(
      <VoucherPicker
        entries={entries}
        appliedVoucher={{ code: 'GIAM5TR', walletEntitlementId: 7 }}
        onApply={onApply}
        onRemove={onRemove}
      />,
    );

    const applyButtons = screen.getAllByRole('button', { name: /Áp dụng|Đang áp dụng/ });
    expect(applyButtons[1]).toBeDisabled();
    expect(screen.getByText('Mã giảm giá đã hết hạn')).toBeInTheDocument();

    await user.click(applyButtons[0]);
    await user.click(screen.getByRole('button', { name: 'Bỏ mã GIAM5TR' }));

    expect(onApply).toHaveBeenCalledWith({ walletEntitlementId: 7 });
    expect(onRemove).toHaveBeenCalled();
  });
});
