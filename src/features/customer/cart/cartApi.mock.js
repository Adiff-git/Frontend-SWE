import { initialCartItems } from '../../../mocks/cart.js';

const STORAGE_KEY = 'mock-cart-v1';
const LATENCY_MS = 250;
const MAX_QTY = 999;

// ---- Mock catalog (variants + stock) ---------------------------------
export const mockVariants = {
  'iphone-15-pro-max': [
    { id: 'ip15pm-256-nat', sku: 'IP15PM-256-NAT', options: { color: 'Titan Tự nhiên', storage: '256GB' }, price: 29990000, stock: 10 },
    { id: 'ip15pm-256-blue', sku: 'IP15PM-256-BLU', options: { color: 'Titan Xanh', storage: '256GB' }, price: 29990000, stock: 3 },
    { id: 'ip15pm-512-nat', sku: 'IP15PM-512-NAT', options: { color: 'Titan Tự nhiên', storage: '512GB' }, price: 34990000, stock: 0 }, // out of stock
  ],
  'apple-20w-usb-c': [
    { id: 'app20w-wht', sku: 'APP20W-WHT', options: { color: 'Trắng' }, price: 490000, stock: 50 },
    { id: 'app20w-blk', sku: 'APP20W-BLK', options: { color: 'Đen' }, price: 490000, stock: 5 },
  ],
};

const variantIndex = Object.entries(mockVariants).flatMap(([productId, list]) =>
  list.map((v) => ({ ...v, productId })));
const findVariant = (variantId) => variantIndex.find((v) => v.id === variantId);

const mockVouchers = [
  { walletEntitlementId: 901, voucherId: 801, code: 'WELCOME10', title: 'Giảm 10%', discountType: 'PERCENTAGE', discountValue: 10, maximumDiscount: 2000000, minimumSubtotal: 0, enabled: true },
  { walletEntitlementId: 902, voucherId: 802, code: 'SAVE500K', title: 'Giảm 500.000đ', discountType: 'FIXED_AMOUNT', discountValue: 500000, maximumDiscount: null, minimumSubtotal: 5000000, enabled: true },
  { walletEntitlementId: 903, voucherId: 803, code: 'BIGSPENDER', title: 'Giảm 3.000.000đ cho đơn từ 50 triệu', discountType: 'FIXED_AMOUNT', discountValue: 3000000, maximumDiscount: null, minimumSubtotal: 50000000, enabled: true }, // not applicable
  { walletEntitlementId: 904, voucherId: 804, code: 'EXPIRED5', title: 'Voucher hết hạn', discountType: 'PERCENTAGE', discountValue: 5, maximumDiscount: null, minimumSubtotal: 0, enabled: false }, // VOUCHER_DISABLED
];

// ---- State ------------------------------------------------------------
const money = (amount) => ({ amount, currency: 'VND' });

function seed() {
  const items = initialCartItems.map((item, index) => {
    const variant = variantIndex.find((v) => v.sku === item.sku);
    return {
      id: index + 1,
      productId: variant.productId,
      variantId: variant.id,
      productName: item.name,
      image: item.image,
      quantity: item.quantity,
      selected: true,
    };
  });
  return { items, nextId: items.length + 1, voucherWalletId: null, clearedReason: null };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return seed();
}

let state = load();
const save = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
};

/** Call from the browser console: window.resetMockCart() */
export function resetMockCart() {
  state = seed();
  save();
}
if (typeof window !== 'undefined') window.resetMockCart = resetMockCart;

// ---- Helpers ----------------------------------------------------------
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

// Shape the error so your client/mapApiError can read it. Adjust if
// mapApiError expects a different property layout.
function mockError(status, message, code, reason) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.reason = reason;
  error.body = { status, detail: message, message, code, reason, fieldErrors: {} };
  error.data = error.body;
  return error;
}

const availabilityOf = (variant) => ({
  availableQuantity: variant.stock,
  status: variant.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
});

function rowReason(row, variant) {
  if (!variant) return 'PRODUCT_UNAVAILABLE';
  if (variant.stock <= 0) return 'INVENTORY_UNAVAILABLE';
  if (row.quantity > variant.stock) return 'INSUFFICIENT_STOCK';
  return null;
}

function voucherIneligibility(voucher, base, eligibleCount) {
  if (!voucher.enabled) return 'VOUCHER_DISABLED';
  if (eligibleCount === 0) return 'NO_ELIGIBLE_ITEMS';
  if (base < voucher.minimumSubtotal) return 'MINIMUM_SUBTOTAL_NOT_MET';
  return null;
}

function discountFor(voucher, base) {
  let discount = voucher.discountType === 'PERCENTAGE'
    ? Math.floor((base * voucher.discountValue) / 100)
    : voucher.discountValue;
  if (voucher.maximumDiscount != null) discount = Math.min(discount, voucher.maximumDiscount);
  return Math.min(discount, base);
}

/** Selected + purchasable subtotal, used by cart and wallet. */
function selectedBase() {
  let base = 0;
  let count = 0;
  for (const row of state.items) {
    const variant = findVariant(row.variantId);
    if (row.selected && !rowReason(row, variant)) {
      base += variant.price * row.quantity;
      count += 1;
    }
  }
  return { base, count };
}

/** Reconcile under the "lock": deselect unpurchasable rows, clear invalid voucher. */
function reconcile() {
  for (const row of state.items) {
    if (rowReason(row, findVariant(row.variantId))) row.selected = false;
  }
  if (state.voucherWalletId != null) {
    const voucher = mockVouchers.find((v) => v.walletEntitlementId === state.voucherWalletId);
    const { base, count } = selectedBase();
    const reason = voucher ? voucherIneligibility(voucher, base, count) : 'VOUCHER_UNAVAILABLE';
    if (reason) {
      state.voucherWalletId = null;
      state.clearedReason = reason;
    }
  }
}

function buildResponse() {
  reconcile();
  const items = state.items.map((row) => {
    const variant = findVariant(row.variantId);
    const reason = rowReason(row, variant);
    const unit = variant.price;
    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      productName: row.productName,
      sku: variant.sku,
      options: variant.options,
      primaryImageUrl: row.image ?? null,
      unitPrice: money(unit),
      quantity: row.quantity,
      selected: row.selected,
      purchasable: !reason,
      availabilityReason: reason,
      subtotal: money(unit * row.quantity),
      availability: availabilityOf(variant),
    };
  });

  const { base, count } = selectedBase();
  const selectedTotalQuantity = state.items
    .filter((r) => r.selected && !rowReason(r, findVariant(r.variantId)))
    .reduce((sum, r) => sum + r.quantity, 0);

  let voucher = null;
  let discount = 0;
  if (state.voucherWalletId != null) {
    const v = mockVouchers.find((x) => x.walletEntitlementId === state.voucherWalletId);
    discount = discountFor(v, base);
    voucher = {
      walletEntitlementId: v.walletEntitlementId,
      voucherId: v.voucherId,
      code: v.code,
      title: v.title,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maximumDiscount: v.maximumDiscount == null ? null : money(v.maximumDiscount),
      calculationBase: money(base),
      appliedDiscount: money(discount),
    };
  }

  const cleared = state.clearedReason;
  state.clearedReason = null; // reported once, like the real API
  save();

  return {
    items,
    totalItemCount: items.length,
    selectedItemCount: count,
    selectedTotalQuantity,
    selectedSubtotal: money(base),
    finalTotal: money(base - discount),
    voucherDiscount: money(discount),
    voucher,
    voucherSelectionClearedReason: cleared,
  };
}

function findRow(itemId) {
  const row = state.items.find((r) => r.id === Number(itemId));
  if (!row) throw mockError(404, 'Cart item not found.', 'NOT_FOUND');
  return row;
}

function assertQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
    throw mockError(400, 'Quantity must be between 1 and 999.', 'VALIDATION_ERROR');
  }
}

function assertStock(variant, quantity) {
  if (variant.stock < quantity) {
    throw mockError(409, 'Not enough stock for the requested quantity.', 'INSUFFICIENT_STOCK');
  }
}

// ---- API surface (same signatures as cartApi.real.js) -----------------
export async function getCart() {
  await delay();
  return buildResponse();
}

export async function addCartItem({ productVariantId, quantity }) {
  await delay();
  assertQuantity(quantity);
  const variant = findVariant(productVariantId);
  if (!variant) throw mockError(404, 'Variant not found.', 'NOT_FOUND');
  const existing = state.items.find((r) => r.variantId === productVariantId);
  const resulting = (existing?.quantity ?? 0) + quantity;
  assertQuantity(resulting);
  assertStock(variant, resulting);
  if (existing) {
    existing.quantity = resulting;
  } else {
    const sample = initialCartItems.find((i) => i.sku === variant.sku || i.id === variant.productId);
    state.items.push({
      id: state.nextId++,
      productId: variant.productId,
      variantId: variant.id,
      productName: sample?.name ?? variant.sku,
      image: sample?.image ?? null,
      quantity,
      selected: true,
    });
  }
  return buildResponse();
}

export async function updateCartQuantity({ itemId, quantity }) {
  await delay();
  const row = findRow(itemId);
  assertQuantity(quantity);
  assertStock(findVariant(row.variantId), quantity);
  row.quantity = quantity;
  return buildResponse();
}

export async function changeCartVariant({ itemId, productVariantId }) {
  await delay();
  const row = findRow(itemId);
  const target = findVariant(productVariantId);
  if (!target || target.productId !== row.productId) {
    throw mockError(422, 'Variant does not belong to this product.', 'VARIANT_NOT_APPLICABLE');
  }
  const other = state.items.find((r) => r.id !== row.id && r.variantId === productVariantId);
  const resulting = row.quantity + (other?.quantity ?? 0);
  assertQuantity(resulting);
  assertStock(target, resulting);
  if (other) {
    other.quantity = resulting;
    state.items = state.items.filter((r) => r.id !== row.id);
  } else {
    row.variantId = productVariantId;
  }
  return buildResponse();
}

export async function selectCartItem({ itemId, selected }) {
  await delay();
  const row = findRow(itemId);
  if (selected && rowReason(row, findVariant(row.variantId))) {
    throw mockError(422, 'This item cannot be selected.', 'ITEM_NOT_PURCHASABLE');
  }
  row.selected = Boolean(selected);
  return buildResponse();
}

export async function selectAllCartItems({ selected }) {
  await delay();
  for (const row of state.items) {
    row.selected = Boolean(selected) && !rowReason(row, findVariant(row.variantId));
  }
  return buildResponse();
}

export async function removeCartItem({ itemId }) {
  await delay();
  findRow(itemId);
  state.items = state.items.filter((r) => r.id !== Number(itemId));
  buildResponse(); // reconcile voucher
}

export async function applyCartVoucher({ walletEntitlementId }) {
  await delay();
  const voucher = mockVouchers.find((v) => v.walletEntitlementId === Number(walletEntitlementId));
  if (!voucher) throw mockError(404, 'Voucher not found.', 'NOT_FOUND');
  const { base, count } = selectedBase();
  const reason = voucherIneligibility(voucher, base, count);
  if (reason) throw mockError(422, 'Voucher is not applicable.', 'VOUCHER_NOT_APPLICABLE', reason);
  state.voucherWalletId = voucher.walletEntitlementId;
  return buildResponse();
}

export async function removeCartVoucher() {
  await delay();
  state.voucherWalletId = null;
  save();
}

export async function getVoucherWalletPage({ page = 0, size = 20 } = {}) {
  await delay();
  const { base, count } = selectedBase();
  const all = mockVouchers.map((v) => {
    const reason = voucherIneligibility(v, base, count);
    return {
      walletEntitlementId: v.walletEntitlementId,
      voucherId: v.voucherId,
      code: v.code,
      title: v.title,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maximumDiscount: v.maximumDiscount == null ? null : money(v.maximumDiscount),
      minimumSubtotal: money(v.minimumSubtotal),
      description: null,
      validFrom: null,
      validUntil: null,
      enabled: v.enabled,
      grantedAt: '2026-11-20T12:00:00Z',
      applicable: !reason,
      ineligibilityReason: reason,
    };
  }).sort((a, b) => a.code.localeCompare(b.code));
  const start = page * size;
  const items = all.slice(start, start + size);
  const totalPages = Math.ceil(all.length / size);
  return {
    items, page, size,
    totalElements: all.length, totalPages,
    first: page === 0, last: page >= totalPages - 1,
  };
}

/** For product detail / variant switcher in mock mode. */
export function getMockProductVariants(productId) {
  return (mockVariants[productId] ?? []).map((v) => ({
    id: v.id,
    sku: v.sku,
    options: v.options,
    sellingPrice: money(v.price),
    availability: availabilityOf(v),
  }));
}