import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toProductHeroView,
  toHighlightsView,
  toSpecificationsView,
  toReviewsView,
  toSimilarProductView,
  toSimilarProductViews,
  toProductDetailViewModel,
} from '../src/features/customer/product-detail/productDetailApi.js';

const productFixture = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'iPhone 15 Pro Max',
  category: { id: '00000000-0000-4000-8000-000000000002', name: 'Điện thoại' },
  primaryImageUrl: 'https://cdn.example/product.jpg',
  description: 'Example description',
  brand: null,
  images: [
    { id: '00000000-0000-4000-8000-000000000003', url: null, displayOrder: 0 },
    { id: '00000000-0000-4000-8000-000000000004', url: 'https://cdn.example/product-2.jpg', displayOrder: 1 },
  ],
  variants: [
    {
      id: '00000000-0000-4000-8000-000000000005',
      sku: 'IP15PM-256-NAT',
      options: { storage: '256GB', color: 'Titan' },
      sellingPrice: { amount: 29990000, currency: 'VND' },
      technicalSpecifications: { Chip: 'A17 Pro' },
      availability: { availableQuantity: 18, status: 'IN_STOCK' },
    },
  ],
};

const reviewPageFixture = {
  items: [
    {
      id: 701,
      rating: 5,
      comment: 'Tốt quá.\nChụp ảnh đẹp.',
      images: [
        { id: '00000000-0000-4000-8000-000000000006', finalUrl: null },
        { id: '00000000-0000-4000-8000-000000000007', finalUrl: 'https://cdn.example/review.jpg' },
      ],
      author: { displayName: 'Nguyễn Tuấn Anh', profileImage: null },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedPurchase: true,
    },
  ],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
};

const summaryFixture = { reviewCount: 1542, averageRating: 4.8 };
const similarPageFixture = {
  items: [
    {
      id: '00000000-0000-4000-8000-000000000008',
      name: 'Similar product',
      category: { id: '00000000-0000-4000-8000-000000000002', name: 'Điện thoại' },
      primaryImageUrl: 'https://cdn.example/similar.jpg',
      displayPrice: { amount: 150000, currency: 'VND' },
      representativeVariantId: '00000000-0000-4000-8000-000000000009',
      availability: { availableQuantity: 3, status: 'IN_STOCK' },
    },
  ],
};

test('toProductHeroView handles missing sellingPrice, null price, and safe option fallback', () => {
  // "`variants` | `VariantSummary[]` | Yes | `minItems: 1`"
  // "`options` ... keys are not guaranteed"
  // "`price` uses `Number(amount)` only for display formatting; the raw amount may exceed safe integer precision, so no arithmetic is performed on it"
  const noPriceProduct = {
    ...productFixture,
    primaryImageUrl: null,
    images: [],
    variants: [
      {
        ...productFixture.variants[0],
        sku: '',
        options: undefined,
        sellingPrice: undefined,
      },
    ],
  };

  const hero = toProductHeroView(noPriceProduct);

  assert.equal(hero.options.length, 1);
  assert.equal(hero.options[0].price, 0);
  assert.ok(hero.options[0].storage);
  assert.ok(hero.color);
  assert.equal(hero.image, null);

  const similar = toSimilarProductView({ ...similarPageFixture.items[0], displayPrice: null });
  assert.equal(similar.price, 'Liên hệ');
  assert.equal(similar.oldPrice, null);
});

test('toProductHeroView marks every out-of-stock rule as not purchasable', () => {
  // "A product is purchasable only when the selected variant has `status === \"IN_STOCK\"` and `availableQuantity > 0`"
  const outOfStockProduct = {
    ...productFixture,
    variants: [
      { ...productFixture.variants[0], availability: { status: 'OUT_OF_STOCK', availableQuantity: 4 } },
      { ...productFixture.variants[0], availability: { status: 'INVENTORY_UNAVAILABLE', availableQuantity: 4 } },
      { ...productFixture.variants[0], availability: { status: 'IN_STOCK', availableQuantity: 0 } },
    ],
  };

  const hero = toProductHeroView(outOfStockProduct);

  assert.equal(hero.inStock, false);
  assert.deepEqual(hero.options.map((option) => option.inStock), [false, false, false]);
});

test('toSpecificationsView returns an explicit empty collection for empty technicalSpecifications', () => {
  const empty = toSpecificationsView({
    variants: [{ ...productFixture.variants[0], technicalSpecifications: {} }],
  });

  assert.deepEqual(empty, []);
  assert.deepEqual(toSpecificationsView(null), []);

  const mapped = toSpecificationsView(productFixture);
  assert.equal(mapped.length, 1);
  assert.deepEqual(mapped[0].items[0], ['Chip', 'A17 Pro']);
});

test('toReviewsView keeps the no-rating state and filters null review image URLs', () => {
  // "`averageRating` | number 1..5 or `null` | Yes | Two decimals; null when no reviews"
  // "`items[].rating` | integer 1..5"
  // "`items[].images` ... Max 10; null URLs filtered out"
  const emptyReviews = toReviewsView(
    { items: [], totalElements: 0 },
    { reviewCount: 0, averageRating: null },
  );

  assert.equal(emptyReviews.summary.score, 'Chưa có đánh giá');
  assert.equal(emptyReviews.summary.count, '0');
  assert.equal(emptyReviews.reviews.length, 0);
  assert.ok(!String(emptyReviews.summary.score).includes('NaN'));
  assert.ok(!String(emptyReviews.summary.score).includes('0'));

  const mapped = toReviewsView(reviewPageFixture, { reviewCount: 1, averageRating: 5 });
  assert.equal(mapped.reviews[0].rating, 5);
  assert.equal(mapped.reviews[0].initials, 'NT');
  assert.equal(mapped.reviews[0].title, 'Tốt quá');
  assert.deepEqual(mapped.reviews[0].photos, ['https://cdn.example/review.jpg']);
  assert.match(mapped.reviews[0].time, /(giờ|ngày) trước|Vừa xong/);
  assert.equal(mapped.summary.score, '5.0');
});

test('toSimilarProductView formats prices and returns ProductCard-compatible fields', () => {
  // "`items` ... Max 20"
  // "`price` is formatted with `Intl.NumberFormat(\"vi-VN\")` + `₫`; null `displayPrice` yields \"Liên hệ\""
  const similar = toSimilarProductView(similarPageFixture.items[0]);

  assert.deepEqual(similar, {
    id: similarPageFixture.items[0].id,
    name: 'Similar product',
    image: 'https://cdn.example/similar.jpg',
    price: '150.000₫',
    oldPrice: null,
    status: 'Còn hàng',
    colors: [],
    colorName: '',
    specs: ['Điện thoại'],
    variantId: similarPageFixture.items[0].representativeVariantId,
  });

  assert.deepEqual(toSimilarProductViews(null), []);
  assert.equal(toSimilarProductViews(similarPageFixture.items).length, 1);
});

test('toHighlightsView returns a fresh copy of the documented TODO fallback', () => {
  const highlights = toHighlightsView();

  assert.equal(highlights[0].title, 'Chip A17 Pro');
  highlights[0].title = 'changed';
  assert.notEqual(toHighlightsView()[0].title, 'changed');
});

test('toProductDetailViewModel returns the complete mapped view model', () => {
  const vm = toProductDetailViewModel({
    product: productFixture,
    reviews: reviewPageFixture,
    summary: summaryFixture,
    similar: similarPageFixture,
  });

  assert.deepEqual(Object.keys(vm).sort(), [
    'averageRating',
    'distribution',
    'highlights',
    'inStock',
    'product',
    'reviewCount',
    'reviews',
    'similarProducts',
    'specifications',
    'summary',
  ].sort());

  assert.equal(vm.product.name, 'iPhone 15 Pro Max');
  assert.equal(vm.product.sku, 'IP15PM-256-NAT');
  assert.equal(vm.product.color, 'Titan');
  assert.equal(vm.product.inventory, 18);
  assert.equal(vm.product.image, 'https://cdn.example/product.jpg');
  assert.equal(vm.product.options[0].price, 29990000);
  assert.equal(vm.product.options[0].originalPrice, 34990000);
  assert.equal(vm.product.inStock, true);
  assert.deepEqual(vm.highlights, toHighlightsView());
  assert.equal(vm.specifications[0].items[0][1], 'A17 Pro');
  assert.equal(vm.reviews[0].name, 'Nguyễn Tuấn Anh');
  assert.equal(vm.summary.score, '4.8');
  assert.equal(vm.summary.count, '1.542');
  assert.ok(vm.summary.purchased);
  assert.ok(vm.summary.withPhotos);
  assert.equal(vm.distribution.length, 5);
  assert.deepEqual(vm.similarProducts[0], toSimilarProductView(similarPageFixture.items[0]));
  assert.equal(vm.reviewCount, 1542);
  assert.equal(vm.averageRating, 4.8);
  assert.equal(vm.inStock, true);
});
