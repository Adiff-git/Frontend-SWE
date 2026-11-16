import { createOperations } from './operationsModel.js';
// Synthetic preview view models. These are not backend DTOs.
export const PREVIEW_DATE = '2026-11-16';
export const money = (value) => `${new Intl.NumberFormat('vi-VN').format(value)}₫`;
export const statusLabels = { active: 'Đang bán', draft: 'Bản nháp', inactive: 'Ngừng kinh doanh' };
export const seedCategories = [
  { id: 'phones', name: 'Điện thoại', parentId: '', active: true },
  { id: 'iphone', name: 'Apple iPhone', parentId: 'phones', active: true },
  { id: 'galaxy', name: 'Samsung Galaxy', parentId: 'phones', active: true },
  { id: 'laptops', name: 'Laptop & Mac', parentId: '', active: true },
  { id: 'tablets', name: 'iPad & Tablet', parentId: '', active: true },
  { id: 'accessories', name: 'Phụ kiện', parentId: '', active: true },
  { id: 'audio', name: 'Tai nghe & Loa', parentId: '', active: true },
  { id: 'watches', name: 'Đồng hồ thông minh', parentId: '', active: true },
  { id: 'monitors', name: 'Màn hình & PC', parentId: '', active: true },
];
export const seedBrands = ['Apple', 'Samsung', 'Sony', 'Dell'].map(name => ({ id: name.toLowerCase(), name, active: true }));
const templates = [
  ['iPhone 15 Pro Max', 'IP15PM', 'iphone', 'apple', 29990000, '83e2e.png', '256GB · Titan tự nhiên'],
  ['MacBook Pro 14 M3 Pro', 'MBP14', 'laptops', 'apple', 49990000, '954ff.png', '18GB / 512GB · Đen'],
  ['Samsung Galaxy S24 Ultra', 'S24U', 'galaxy', 'samsung', 31490000, 'b957a.png', '512GB · Titan xám'],
  ['iPad Air M2 11 inch', 'IPADA', 'tablets', 'apple', 16990000, '770f2.png', '128GB · Starlight'],
  ['Củ sạc Apple 20W', 'AP20W', 'accessories', 'apple', 490000, '09c2f.png', 'USB-C · Trắng'],
  ['Sony WH-1000XM5', 'SONYXM5', 'audio', 'sony', 6490000, 'b0ac1.png', 'Đen · Không dây'],
  ['Apple Watch Series 9', 'AW9', 'watches', 'apple', 9990000, 'cacd1.png', '45mm · Hồng'],
  ['Dell UltraSharp U2723QE', 'DELL27', 'monitors', 'dell', 12990000, 'f4b10.png', '27 inch · 4K'],
];
export function createCatalog() {
  return {
    ...createOperations(),
    categories: structuredClone(seedCategories), brands: structuredClone(seedBrands),
    products: Array.from({ length: 24 }, (_, i) => {
      const [name, code, categoryId, brandId, price, image, configuration] = templates[i % templates.length];
      return { id: `product-${i + 1}`, name: i < 8 ? name : `${name} — Bộ ${Math.floor(i / 8) + 1}`,
        code: `${code}-${i + 1}`, categoryId, brandId, description: 'Sản phẩm minh họa cho bản xem trước Chạm Tech.',
        status: i === 22 ? 'draft' : i === 23 ? 'inactive' : 'active', version: 1,
        images: [{ id: `image-${i}`, source: image, name: `${code.toLowerCase()}.jpg` }],
        specifications: [{ id: `spec-${i}`, name: 'Cấu hình', value: configuration }],
        variants: [{ id: `variant-${i}`, sku: `${code}-${i + 1}`, label: configuration, price, stock: i === 6 ? 0 : i === 5 ? 4 : 18 + i, reserved: i === 6 ? 0 : 2 }],
      };
    }),
    sales: Array.from({ length: 24 }, (_, i) => ({ productId: `product-${i + 1}`, date: '2026-11-10', units: i % 5, unitPrice: templates[i % 8][4] })),
    adjustments: [],
  };
}
export function stockTotal(product) { return product.variants.reduce((sum, variant) => sum + Number(variant.stock), 0); }
export function categoryContains(categories, ancestorId, targetId) {
  const visited = new Set();
  let current = targetId;
  while (current && !visited.has(current)) {
    if (current === ancestorId) return true;
    visited.add(current);
    current = categories.find(c => c.id === current)?.parentId;
  }
  return false;
}
export function validateProduct(product, catalog) {
  const errors = {};
  if (!product.name.trim()) errors.name = 'Nhập tên sản phẩm.';
  if (!product.code.trim()) errors.code = 'Nhập mã sản phẩm.';
  if (catalog.products.some(p => p.id !== product.id && p.code.toLowerCase() === product.code.trim().toLowerCase())) errors.code = 'Mã sản phẩm đã tồn tại.';
  if (!catalog.categories.some(c => c.id === product.categoryId && c.active)) errors.categoryId = 'Chọn danh mục đang hiển thị.';
  if (!catalog.brands.some(b => b.id === product.brandId && b.active)) errors.brandId = 'Chọn thương hiệu đang hiển thị.';
  if (!product.variants.length) errors.variants = 'Thêm ít nhất một biến thể.';
  const seen = new Set();
  const savedProduct = catalog.products.find(p => p.id === product.id);
  const variantFields = {};
  if (savedProduct?.variants.some(saved => !product.variants.some(v => v.id === saved.id))) errors.variants = 'Không thể gỡ biến thể đã lưu; cần giữ liên kết và lịch sử tồn kho.';
  for (const v of product.variants) {
    const vf = {};
    const sku = v.sku.trim().toLowerCase();
    if (!sku || seen.has(sku) || catalog.products.some(p => p.id !== product.id && p.variants.some(other => other.sku.toLowerCase() === sku))) {
      vf.sku = 'Mỗi biến thể cần SKU duy nhất.';
      errors.variants ||= vf.sku;
    }
    seen.add(sku);
    if (!v.label.trim()) {
      vf.label = 'Nhập cấu hình cho biến thể.';
      errors.variants ||= 'Nhập cấu hình cho mỗi biến thể.';
    }
    if (v.price === '' || !Number.isSafeInteger(Number(v.price)) || Number(v.price) < 0) {
      vf.price = 'Giá bán phải là số nguyên không âm.';
      errors.variants ||= vf.price;
    }
    if (v.stock === '' || !Number.isSafeInteger(Number(v.stock)) || Number(v.stock) < v.reserved) {
      vf.stock = 'Tồn kho phải là số nguyên và không thấp hơn số đã giữ chỗ.';
      errors.variants ||= vf.stock;
    }
    if (Object.keys(vf).length) variantFields[v.id] = vf;
  }
  if (Object.keys(variantFields).length) errors.variantFields = variantFields;
  const keys = product.specifications.map(s => s.name.trim().toLowerCase());
  const specFields = {};
  product.specifications.forEach((s, i) => {
    const sf = {};
    if (!keys[i] || keys.indexOf(keys[i]) !== i) sf.name = 'Nhập tên thông số duy nhất.';
    if (!s.value.trim()) sf.value = 'Nhập giá trị thông số.';
    if (Object.keys(sf).length) {
      specFields[s.id] = sf;
      errors.specifications ||= 'Nhập tên, giá trị và tránh trùng thông số.';
    }
  });
  if (Object.keys(specFields).length) errors.specFields = specFields;
  return errors;
}
export function adjustedStock(variant, mode, input) {
  const quantity = Number(input);
  if (input === '' || !Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Số lượng phải là số nguyên không âm.');
  const next = mode === 'set' ? quantity : mode === 'remove' ? variant.stock - quantity : variant.stock + quantity;
  if (!Number.isSafeInteger(next) || next < variant.reserved) throw new Error('Tồn kho sau điều chỉnh không được thấp hơn lượng đã giữ chỗ.');
  return next;
}
