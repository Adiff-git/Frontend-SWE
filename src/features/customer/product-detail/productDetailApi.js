import { api } from '../../../api/client.js';
import { filterVariantsForProduct } from '../cart/cartMappers.js';
import { highlights as mockHighlights, product as mockProduct } from '../../../mocks/product-detail.js';

// TODO: Backend has no original/list price field; these are mock fallback values only.
const MOCK_ORIGINAL_PRICES = mockProduct.options.map((option) => option.originalPrice);

// TODO: No highlights endpoint exists; this is mock fallback data only.
const MOCK_HIGHLIGHTS = mockHighlights;

// TODO: No color option is guaranteed by `variant.options`; this is mock fallback data only.
const MOCK_COLOR = mockProduct.color;

// TODO: Backend has no purchased/withPhotos counters; these are mock fallback values only.
const MOCK_REVIEW_STATS = { purchased: '4.8k', withPhotos: '312' };

// TODO: Rating summary has no per-star distribution field; this is mock fallback data only.
const MOCK_DISTRIBUTION = [
  { stars: 5, count: '1.288', width: '83.5%' },
  { stars: 4, count: '226', width: '14.7%' },
  { stars: 3, count: '21', width: '1.4%' },
  { stars: 2, count: '5', width: '.3%' },
  { stars: 1, count: '2', width: '.1%' },
];

const IMAGE_URL_KEYS = ['color', 'Color', 'colour', 'Colour'];
const STATUS_LABELS = { IN_STOCK: 'Còn hàng', OUT_OF_STOCK: 'Hết hàng', INVENTORY_UNAVAILABLE: 'Hết hàng' };

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (value && typeof value === 'object' ? value : {});

function firstNonEmptyUrl(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) ?? null;
}

function formatAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'Liên hệ';
  return `${new Intl.NumberFormat('vi-VN').format(value)}₫`;
}

function formatCount(value) {
  const count = Number(value);
  return new Intl.NumberFormat('vi-VN').format(Number.isFinite(count) ? count : 0);
}

function formatScore(value) {
  const score = Number(value);
  if (value === null || value === undefined || !Number.isFinite(score) || score <= 0) {
    return 'Chưa có đánh giá';
  }
  return score.toFixed(1);
}

function inventoryQuantity(variant) {
  const quantity = Number(variant?.availability?.availableQuantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function isVariantInStock(variant) {
  return variant?.availability?.status === 'IN_STOCK' && inventoryQuantity(variant) > 0;
}

function readColor(variant) {
  const options = asObject(variant?.options);
  for (const key of IMAGE_URL_KEYS) {
    if (options[key]) return String(options[key]);
  }
  return MOCK_COLOR;
}

function readStorage(variant, index) {
  return String(asObject(variant?.options).storage ?? `Phiên bản ${index + 1}`);
}

function mockOriginalPrice(storage, index) {
  const byStorage = MOCK_ORIGINAL_PRICES.find((_, position) => mockProduct.options[position]?.storage === storage);
  return byStorage ?? MOCK_ORIGINAL_PRICES[index] ?? MOCK_ORIGINAL_PRICES[0] ?? 0;
}

// TODO: Backend has no review title field; this title is derived from the comment only.
function deriveReviewTitle(comment) {
  const text = typeof comment === 'string' ? comment.trim() : '';
  if (!text) return 'Không có tiêu đề';
  const firstLine = text.split(/\r?\n/, 1)[0].trim();
  const firstSentence = firstLine.split(/[.!?]/, 1)[0].trim();
  return firstSentence || text;
}

function toInitials(displayName) {
  const words = String(displayName ?? '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'KH';
}

function formatReviewTime(createdAt) {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return 'Thời gian không xác định';
  const elapsedHours = Math.floor((Date.now() - timestamp) / (60 * 60 * 1000));
  if (elapsedHours < 1) return 'Vừa xong';
  if (elapsedHours < 24) return `${elapsedHours} giờ trước`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return `${elapsedDays} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function stringifySpecValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

export function toProductHeroView(product) {
  const variants = asArray(product?.variants);
  const options = variants.map((variant, index) => {
    const storage = readStorage(variant, index);
    return {
      variantId: String(variant?.id ?? ''),
      storage,
      price: formatAmount(variant?.sellingPrice?.amount),
      originalPrice: mockOriginalPrice(storage, index),
      sku: String(variant?.sku ?? ''),
      inventory: inventoryQuantity(variant),
      inStock: isVariantInStock(variant),
    };
  });

  if (!options.length) {
    options.push({
      variantId: '',
      storage: 'Mặc định',
      price: 0,
      originalPrice: 0,
      sku: '',
      inventory: 0,
      inStock: false,
    });
  }

  const images = asArray(product?.images)
    .slice()
    .sort((a, b) => Number(a?.displayOrder ?? 0) - Number(b?.displayOrder ?? 0));
  const image = firstNonEmptyUrl(
    product?.primaryImageUrl,
    ...images.map((item) => item?.url),
  );

  return {
    name: String(product?.name ?? ''),
    sku: String(variants[0]?.sku ?? ''),
    color: readColor(variants[0]),
    inventory: inventoryQuantity(variants[0]),
    image,
    options,
    inStock: isVariantInStock(variants[0]),
  };
}

export function toHighlightsView() {
  return MOCK_HIGHLIGHTS.map((item) => ({ ...item }));
}

export function toSpecificationsView(product) {
  const variants = asArray(product?.variants);
  const specifications = asObject(variants[0]?.technicalSpecifications);
  const items = Object.entries(specifications).map(([label, value]) => [label, stringifySpecValue(value)]);

  if (!items.length) return [];

  return [{ title: 'Thông số kỹ thuật', icon: 'chip', items }];
}

export function toReviewsView(reviewPage, ratingSummary) {
  const reviews = asArray(reviewPage?.items).map((review) => ({
    initials: toInitials(review?.author?.displayName),
    name: String(review?.author?.displayName ?? 'Khách hàng'),
    time: formatReviewTime(review?.createdAt),
    title: deriveReviewTitle(review?.comment),
    text: String(review?.comment ?? ''),
    photos: asArray(review?.images).map((image) => image?.finalUrl).filter((url) => typeof url === 'string' && url.trim()),
    rating: Math.min(5, Math.max(1, Number(review?.rating) || 1)),
  }));

  return {
    reviews,
    summary: {
      score: formatScore(ratingSummary?.averageRating),
      count: formatCount(ratingSummary?.reviewCount ?? reviewPage?.totalElements ?? 0),
      purchased: MOCK_REVIEW_STATS.purchased,
      withPhotos: MOCK_REVIEW_STATS.withPhotos,
    },
    distribution: MOCK_DISTRIBUTION.map((row) => ({ ...row })),
  };
}

export function toSimilarProductView(item) {
  const availability = asObject(item?.availability);
  const image = firstNonEmptyUrl(item?.primaryImageUrl);
  const categoryName = item?.category?.name;

  return {
    id: item?.id ?? '',
    name: String(item?.name ?? ''),
    image,
    price: formatMoney(item?.displayPrice?.amount),
    oldPrice: null,
    status: STATUS_LABELS[availability.status] ?? 'Đang cập nhật',
    colors: [],
    colorName: '',
    specs: categoryName ? [String(categoryName)] : [],
    variantId: item?.representativeVariantId ?? null,
  };
}

export function toSimilarProductViews(payload) {
  const items = Array.isArray(payload) ? payload : asArray(payload?.items);
  return items.map((item) => toSimilarProductView(item));
}

export function toProductDetailViewModel({ product, reviews, summary, similar } = {}) {
  const productHero = toProductHeroView(product);
  const reviewsView = toReviewsView(reviews, summary);

  return {
    product: productHero,
    highlights: toHighlightsView(),
    specifications: toSpecificationsView(product),
    reviews: reviewsView.reviews,
    summary: reviewsView.summary,
    distribution: reviewsView.distribution,
    similarProducts: toSimilarProductViews(similar),
    reviewCount: Number(summary?.reviewCount ?? reviews?.totalElements ?? 0) || 0,
    averageRating: summary?.averageRating ?? null,
    inStock: productHero.inStock,
  };
}

function publicRequestOptions(options) {
  return { auth: false, signal: options?.signal };
}

export function getProductDetail(id, options = {}) {
  return api.get(`/api/products/${encodeURIComponent(id)}`, undefined, publicRequestOptions(options));
}

export function getProductVariants(id, options = {}) {
  return getProductDetail(id, options).then((product) => {
    const variants = filterVariantsForProduct(product?.variants, product?.id);
    return toProductHeroView({ ...product, variants }).options.filter((option) => option.variantId);
  });
}

export function getProductReviews(id, options = {}) {
  return api.get(
    `/api/products/${encodeURIComponent(id)}/reviews`,
    { page: 0, size: 20, sort: 'createdAt,desc' },
    publicRequestOptions(options),
  );
}

export function getRatingSummary(id, options = {}) {
  return api.get(`/api/products/${encodeURIComponent(id)}/rating-summary`, undefined, publicRequestOptions(options));
}

export function getSimilarProducts(id, options = {}) {
  return api.get(
    `/api/products/${encodeURIComponent(id)}/similar`,
    { limit: 10 },
    publicRequestOptions(options),
  );
}

export async function getProductDetailData(id, options = {}) {
  const requestOptions = { signal: options?.signal };
  const [productResult, reviewsResult, ratingResult, similarResult] = await Promise.allSettled([
    getProductDetail(id, requestOptions),
    getProductReviews(id, requestOptions),
    getRatingSummary(id, requestOptions),
    getSimilarProducts(id, requestOptions),
  ]);

  if (productResult.status === 'rejected') throw productResult.reason;

  const settledValue = (result) => (result.status === 'fulfilled' ? result.value : null);

  return {
    data: toProductDetailViewModel({
      product: settledValue(productResult),
      reviews: settledValue(reviewsResult),
      summary: settledValue(ratingResult),
      similar: settledValue(similarResult),
    }),
    sectionErrors: {
      reviews: reviewsResult.status === 'rejected',
      rating: ratingResult.status === 'rejected',
      similar: similarResult.status === 'rejected',
    },
  };
}
