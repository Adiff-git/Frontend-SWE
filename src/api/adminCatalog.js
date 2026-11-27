import { api, assertSession } from './client.js';
import { completeImageUpload, createImageUpload, uploadImageBytes } from './media.js';
import { tokens } from './tokenStore.js';

const BASE = '/api/admin/catalog';

function cleanQuery(q) {
  if (typeof q !== 'string') return undefined;
  const trimmed = q.trim();
  return trimmed ? trimmed : undefined;
}

function productListParams({ page = 0, size = 20, status, categoryId, includeDescendants, brandId, q, sort } = {}) {
  const params = { page, size, q: cleanQuery(q), sort };
  if (Array.isArray(status) ? status.length > 0 : Boolean(status)) {
    params.status = status;
  }
  if (categoryId) {
    params.categoryId = categoryId;
    if (includeDescendants !== undefined) params.includeDescendants = includeDescendants;
  }
  if (brandId) params.brandId = brandId;
  return params;
}

export const listAdminProducts = (params, options) =>
  api.get(`${BASE}/products`, productListParams(params), options);

export const getAdminProduct = (productId, options) =>
  api.get(`${BASE}/products/${encodeURIComponent(productId)}`, undefined, options);

export const createAdminProduct = (payload, options) =>
  api.post(`${BASE}/products`, payload, options);

export const updateAdminProduct = (productId, payload, options) =>
  api.patch(`${BASE}/products/${encodeURIComponent(productId)}`, payload, options);

export const transitionAdminProduct = (productId, action, revisions, options) =>
  api.post(`${BASE}/products/${encodeURIComponent(productId)}/${encodeURIComponent(action)}`, revisions, options);

export const listAdminVariants = (productId, options) =>
  api.get(`${BASE}/products/${encodeURIComponent(productId)}/variants`, undefined, options);

export const createAdminVariant = (productId, payload, options) =>
  api.post(`${BASE}/products/${encodeURIComponent(productId)}/variants`, payload, options);

export const updateAdminVariant = (productId, variantId, payload, options) =>
  api.patch(`${BASE}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, payload, options);

export const setAdminVariantEnabled = (productId, variantId, enabled, revisions, options) =>
  api.post(
    `${BASE}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/${enabled ? 'enable' : 'disable'}`,
    revisions,
    options,
  );

export const getAdminVariantSpecifications = (productId, variantId, options) =>
  api.get(`${BASE}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/specifications`, undefined, options);

export const replaceAdminVariantSpecifications = (productId, variantId, payload, options) =>
  api.put(`${BASE}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/specifications`, payload, options);

export const listAdminCategories = ({ page = 0, size = 20, q, sort, parentCategoryId } = {}, options) =>
  api.get(`${BASE}/categories`, { page, size, q: cleanQuery(q), sort, parentCategoryId }, options);

export const getAdminCategory = (categoryId, options) =>
  api.get(`${BASE}/categories/${encodeURIComponent(categoryId)}`, undefined, options);

export const createAdminCategory = (payload, options) =>
  api.post(`${BASE}/categories`, payload, options);

export const updateAdminCategory = (categoryId, payload, options) =>
  api.patch(`${BASE}/categories/${encodeURIComponent(categoryId)}`, payload, options);

export const deleteAdminCategory = (categoryId, { expectedVersion, expectedTaxonomyVersion }, options) =>
  api.delete(`${BASE}/categories/${encodeURIComponent(categoryId)}`, {
    ...options,
    params: { expectedVersion, expectedTaxonomyVersion },
  });

export const listAdminBrands = ({ page = 0, size = 20, q, sort } = {}, options) =>
  api.get(`${BASE}/brands`, { page, size, q: cleanQuery(q), sort }, options);

export const getAdminBrand = (brandId, options) =>
  api.get(`${BASE}/brands/${encodeURIComponent(brandId)}`, undefined, options);

export const createAdminBrand = (payload, options) =>
  api.post(`${BASE}/brands`, payload, options);

export const updateAdminBrand = (brandId, payload, options) =>
  api.patch(`${BASE}/brands/${encodeURIComponent(brandId)}`, payload, options);

export const deleteAdminBrand = (brandId, { expectedVersion }, options) =>
  api.delete(`${BASE}/brands/${encodeURIComponent(brandId)}`, {
    ...options,
    params: { expectedVersion },
  });

export const getAdminProductImages = (productId, options) =>
  api.get(`${BASE}/products/${encodeURIComponent(productId)}/images`, undefined, options);

export const attachAdminProductImage = (productId, payload, options) =>
  api.post(`${BASE}/products/${encodeURIComponent(productId)}/images`, payload, options);

export const setPrimaryAdminProductImage = (productId, payload, options) =>
  api.put(`${BASE}/products/${encodeURIComponent(productId)}/images/primary`, payload, options);

export const reorderAdminProductImages = (productId, payload, options) =>
  api.put(`${BASE}/products/${encodeURIComponent(productId)}/images/order`, payload, options);

export const removeAdminProductImage = (productId, imageId, { expectedVersion, expectedTaxonomyVersion, replacementImageId }, options) =>
  api.delete(`${BASE}/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`, {
    ...options,
    params: { expectedVersion, expectedTaxonomyVersion, replacementImageId },
  });

/**
 * Upload an image file through the standard media flow, then attach it to a product gallery.
 */
export async function uploadAndAttachAdminProductImage(productId, file, { expectedVersion, expectedTaxonomyVersion, altText, isPrimary, displayOrder }) {
  const owner = tokens.getGeneration();
  const upload = await createImageUpload(file.type);
  assertSession(owner);
  await uploadImageBytes(upload.uploadUrl, file);
  assertSession(owner);
  await completeImageUpload(upload.id);
  assertSession(owner);
  return attachAdminProductImage(productId, {
    expectedVersion,
    expectedTaxonomyVersion,
    imageId: upload.id,
    altText,
    ...(isPrimary !== undefined && { isPrimary }),
    ...(displayOrder !== undefined && { displayOrder }),
  });
}

/**
 * Fetch all pages of categories or brands for dropdowns/tree views (bounded by backend max size=100).
 */
export async function listAllAdminTaxonomy(fetcher, { sort = 'name,asc', signal } = {}) {
  const items = [];
  let page = 0;
  let totalPages = 1;
  let taxonomyVersion = null;
  while (page < totalPages) {
    const res = await fetcher({ page, size: 100, sort }, { signal });
    items.push(...(res?.items || []));
    if (res?.taxonomyVersion !== undefined) taxonomyVersion = res.taxonomyVersion;
    totalPages = Math.max(1, res?.totalPages || 1);
    page += 1;
  }
  return { items, taxonomyVersion };
}
