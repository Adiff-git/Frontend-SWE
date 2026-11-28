import { formatExactVnd } from './exactMoneyJson.js';
import { mapAvailabilityReason, mapVoucherReason } from './cartReasons.js';

const optionLabels = {
  storage: 'Dung lượng',
  color: 'Màu sắc',
};

export function moneyDigits(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && value !== null) return moneyDigits(value.amount);
  return String(value);
}

const moneyDisplay = (value) => formatExactVnd(moneyDigits(value));

const optionText = (options) => Object.entries(options ?? {})
  .map(([key, value]) => `${optionLabels[key] ?? key}: ${value}`)
  .join(' · ');

export function toCartItemView(rawItem) {
  return {
    id: rawItem.id,
    productId: rawItem.productId,
    variantId: rawItem.variantId,
    name: rawItem.productName,
    sku: rawItem.sku,
    image: rawItem.primaryImageUrl ?? '',
    options: optionText(rawItem.options),
    unitPrice: moneyDigits(rawItem.unitPrice),
    unitPriceDisplay: moneyDisplay(rawItem.unitPrice),
    quantity: rawItem.quantity,
    selected: Boolean(rawItem.selected),
    purchasable: Boolean(rawItem.purchasable),
    availabilityReason: mapAvailabilityReason(rawItem.availabilityReason),
    rawAvailabilityReason: rawItem.availabilityReason ?? null,
    subtotal: moneyDigits(rawItem.subtotal),
    subtotalDisplay: moneyDisplay(rawItem.subtotal),
    availability: rawItem.availability ? {
      availableQuantity: rawItem.availability.availableQuantity,
      status: rawItem.availability.status,
    } : null,
    pricing: rawItem.pricing ? {
      originalPrice: moneyDigits(rawItem.pricing.originalPrice),
      effectivePrice: moneyDigits(rawItem.pricing.effectivePrice),
    } : null,
  };
}

export function toVoucherView(rawEntry) {
  return {
    walletEntitlementId: rawEntry.walletEntitlementId,
    voucherId: rawEntry.voucherId,
    code: rawEntry.code,
    title: rawEntry.title,
    description: rawEntry.description,
    discountType: rawEntry.discountType,
    discountText: rawEntry.discountType === 'PERCENTAGE'
      ? `${rawEntry.discountValue}%`
      : formatExactVnd(rawEntry.discountValue),
    minimumSubtotal: moneyDigits(rawEntry.minimumSubtotal),
    validUntil: rawEntry.validUntil,
    applicable: Boolean(rawEntry.applicable),
    ineligibilityReason: mapVoucherReason(rawEntry.ineligibilityReason),
  };
}

export function toCartView(rawCart = {}) {
  return {
    items: (rawCart.items ?? []).map(toCartItemView),
    totalItemCount: rawCart.totalItemCount ?? 0,
    selectedItemCount: rawCart.selectedItemCount ?? 0,
    selectedTotalQuantity: rawCart.selectedTotalQuantity ?? 0,
    selectedSubtotal: moneyDigits(rawCart.selectedSubtotal),
    selectedSubtotalDisplay: moneyDisplay(rawCart.selectedSubtotal),
    finalTotal: moneyDigits(rawCart.finalTotal),
    finalTotalDisplay: moneyDisplay(rawCart.finalTotal),
    voucherDiscount: moneyDigits(rawCart.voucherDiscount),
    voucherDiscountDisplay: moneyDisplay(rawCart.voucherDiscount),
    voucher: rawCart.voucher ? {
      walletEntitlementId: rawCart.voucher.walletEntitlementId,
      voucherId: rawCart.voucher.voucherId,
      code: rawCart.voucher.code,
      title: rawCart.voucher.title,
      appliedDiscount: moneyDigits(rawCart.voucher.appliedDiscount),
      appliedDiscountDisplay: moneyDisplay(rawCart.voucher.appliedDiscount),
    } : null,
    voucherSelectionClearedReason: mapVoucherReason(rawCart.voucherSelectionClearedReason),
  };
}

export function filterVariantsForProduct(variants, productId) {
  if (!Array.isArray(variants)) return [];
  return variants.filter((variant) => !variant.productId || variant.productId === productId);
}
