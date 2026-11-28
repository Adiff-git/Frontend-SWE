import assert from 'node:assert/strict';
import test from 'node:test';
import { filterVariantsForProduct, toCartItemView, toCartView, toVoucherView } from '../src/features/customer/cart/cartMappers.js';
import { makeRawCart, makeRawWalletPage } from './mocks/cartFixtures.js';

test('toCartItemView preserves authoritative money strings and maps reasons', () => {
  const view = toCartItemView(makeRawCart().items[1]);
  assert.equal(view.unitPrice, '4990000');
  assert.equal(view.unitPriceDisplay, '4.990.000₫');
  assert.equal(view.purchasable, false);
  assert.equal(view.availabilityReason, 'Số lượng tồn kho không đủ');
});

test('toCartView reports server totals without recomputing money', () => {
  const view = toCartView(makeRawCart());
  assert.equal(view.items.length, 2);
  assert.equal(view.finalTotal, '59980000');
  assert.equal(view.finalTotalDisplay, '59.980.000₫');
  assert.equal(view.selectedItemCount, 1);
});

test('filterVariantsForProduct keeps only same-product variants', () => {
  const variants = [
    { id: 'same', productId: 'p-1' },
    { id: 'other', productId: 'p-2' },
    { id: 'any' },
  ];

  assert.deepEqual(filterVariantsForProduct(variants, 'p-1').map((variant) => variant.id), ['same', 'any']);
});

test('toVoucherView maps voucher applicability and discount text', () => {
  const vouchers = makeRawWalletPage().items.map(toVoucherView);
  assert.equal(vouchers[0].discountText, '5.000.000₫');
  assert.equal(vouchers[0].applicable, true);
  assert.equal(vouchers[1].ineligibilityReason, 'Mã giảm giá đã hết hạn');
});
