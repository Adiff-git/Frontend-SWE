const price = (amount) => ({ amount: String(amount), currency: 'VND' });

export function makeRawCart(overrides = {}) {
  return {
    items: [
      {
        id: 1,
        productId: '00000000-0000-4000-8000-000000000001',
        variantId: '00000000-0000-4000-8000-000000000011',
        productName: 'iPhone 15 Pro Max',
        sku: 'IP15PM-256-NAT',
        options: { storage: '256GB', color: 'Titan' },
        primaryImageUrl: 'https://cdn.example/iphone.jpg',
        unitPrice: price(29990000),
        quantity: 2,
        selected: true,
        purchasable: true,
        availabilityReason: null,
        subtotal: price(59980000),
        availability: { availableQuantity: 10, status: 'IN_STOCK' },
      },
      {
        id: 2,
        productId: '00000000-0000-4000-8000-000000000002',
        variantId: '00000000-0000-4000-8000-000000000012',
        productName: 'Tai nghe AirPods Pro',
        sku: 'APPRO-USB-C',
        options: { color: 'Trắng' },
        primaryImageUrl: null,
        unitPrice: price(4990000),
        quantity: 1,
        selected: false,
        purchasable: false,
        availabilityReason: 'INSUFFICIENT_STOCK',
        subtotal: price(4990000),
        availability: { availableQuantity: 0, status: 'OUT_OF_STOCK' },
      },
    ],
    totalItemCount: 2,
    selectedItemCount: 1,
    selectedTotalQuantity: 2,
    selectedSubtotal: price(59980000),
    finalTotal: price(59980000),
    voucherDiscount: price(0),
    voucher: null,
    voucherSelectionClearedReason: null,
    ...overrides,
  };
}

export const emptyRawCart = {
  items: [],
  totalItemCount: 0,
  selectedItemCount: 0,
  selectedTotalQuantity: 0,
  selectedSubtotal: price(0),
  finalTotal: price(0),
  voucherDiscount: price(0),
  voucher: null,
  voucherSelectionClearedReason: null,
};

export const rawCartWithVoucher = makeRawCart({
  finalTotal: price(54980000),
  voucherDiscount: price(5000000),
  voucher: {
    walletEntitlementId: 7,
    voucherId: '00000000-0000-4000-8000-000000000099',
    code: 'GIAM5TR',
    title: 'Giảm 5 triệu',
    discountType: 'FIXED_AMOUNT',
    discountValue: 5000000,
    maximumDiscount: 5000000,
    calculationBase: 'SELECTED_SUBTOTAL',
    appliedDiscount: price(5000000),
  },
});

export function makeRawWalletPage(overrides = {}) {
  return {
    items: [
      {
        walletEntitlementId: 7,
        voucherId: '00000000-0000-4000-8000-000000000099',
        code: 'GIAM5TR',
        title: 'Giảm 5 triệu',
        discountType: 'FIXED_AMOUNT',
        discountValue: 5000000,
        maximumDiscount: 5000000,
        minimumSubtotal: 10000000,
        description: 'Áp dụng cho điện thoại',
        validFrom: '2026-01-01T00:00:00Z',
        validUntil: '2027-01-01T00:00:00Z',
        enabled: true,
        grantedAt: '2026-01-02T00:00:00Z',
        applicable: true,
        ineligibilityReason: null,
      },
      {
        walletEntitlementId: 8,
        voucherId: '00000000-0000-4000-8000-000000000100',
        code: 'HETHAN',
        title: 'Ưu đãi cũ',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maximumDiscount: 1000000,
        minimumSubtotal: 1000000,
        description: 'Mã đã hết hạn',
        validFrom: '2025-01-01T00:00:00Z',
        validUntil: '2025-12-31T00:00:00Z',
        enabled: true,
        grantedAt: '2025-01-02T00:00:00Z',
        applicable: false,
        ineligibilityReason: 'VOUCHER_EXPIRED',
      },
    ],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
    ...overrides,
  };
}

export const rawProductWithVariants = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'iPhone 15 Pro Max',
  variants: [
    {
      id: '00000000-0000-4000-8000-000000000011',
      sku: 'IP15PM-256-NAT',
      options: { storage: '256GB', color: 'Titan' },
      sellingPrice: price(29990000),
      availability: { availableQuantity: 10, status: 'IN_STOCK' },
    },
    {
      id: '00000000-0000-4000-8000-000000000013',
      sku: 'IP15PM-512-NAT',
      options: { storage: '512GB', color: 'Titan' },
      sellingPrice: price(35990000),
      availability: { availableQuantity: 4, status: 'IN_STOCK' },
    },
  ],
};
