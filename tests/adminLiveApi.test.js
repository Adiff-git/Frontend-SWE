import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachAdminProductImage,
  createAdminBrand,
  createAdminCategory,
  createAdminProduct,
  createAdminVariant,
  deleteAdminBrand,
  deleteAdminCategory,
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
  removeAdminProductImage,
  reorderAdminProductImages,
  replaceAdminVariantSpecifications,
  setAdminVariantEnabled,
  setPrimaryAdminProductImage,
  transitionAdminProduct,
  updateAdminBrand,
  updateAdminCategory,
  updateAdminProduct,
  updateAdminVariant,
} from '../src/api/adminCatalog.js';
import {
  correctAdminInventory,
  getAdminInventoryHistory,
  getAdminInventoryVariant,
  listAdminInventory,
  replenishAdminInventory,
} from '../src/api/adminInventory.js';
import { getAdminBehaviorOverview } from '../src/api/adminBehavior.js';
import { ApiError } from '../src/api/client.js';
import { tokens } from '../src/api/tokenStore.js';
import {
  formatAdminError,
  optionsMapToRows,
  rowsToOptionsMap,
  rowsToSpecDocument,
  specDocumentToRows,
} from '../src/features/admin/adminErrors.js';

async function withStubbedFetch(fn) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  tokens.clear();
  tokens.setAccess('admin-jwt-token');

  globalThis.fetch = async (url, init = {}) => {
    const parsedUrl = new URL(String(url));
    const parsedBody = init.body ? JSON.parse(init.body) : null;
    const entry = {
      method: init.method || 'GET',
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: parsedUrl.searchParams,
      headers: init.headers || {},
      body: parsedBody,
    };
    calls.push(entry);
    return new Response(JSON.stringify({ ok: true, items: [], totalItems: 0, totalPages: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    await fn(calls);
  } finally {
    globalThis.fetch = originalFetch;
    tokens.clear();
  }
}

test('adminCatalog APIs follow draft/version-1 endpoints, repeated status filters, and revision params', async () => {
  await withStubbedFetch(async (calls) => {
    await listAdminProducts({
      page: 0,
      size: 20,
      status: ['DRAFT', 'PUBLISHED', 'DRAFT'],
      q: '  ',
      includeDescendants: true, // omitted because categoryId is absent
      sort: 'name,asc',
    });
    let call = calls.at(-1);
    assert.equal(call.method, 'GET');
    assert.equal(call.pathname, '/api/admin/catalog/products');
    assert.deepEqual(call.searchParams.getAll('status'), ['DRAFT', 'PUBLISHED']);
    assert.equal(call.searchParams.get('q'), null);
    assert.equal(call.searchParams.get('includeDescendants'), null);
    assert.equal(call.headers.Authorization, 'Bearer admin-jwt-token');

    await listAdminProducts({
      categoryId: 'cat-1',
      includeDescendants: true,
      q: 'iphone',
    });
    call = calls.at(-1);
    assert.equal(call.searchParams.get('categoryId'), 'cat-1');
    assert.equal(call.searchParams.get('includeDescendants'), 'true');
    assert.equal(call.searchParams.get('q'), 'iphone');

    await createAdminProduct({ name: 'Laptop', categoryId: 'cat-1' });
    assert.equal(calls.at(-1).method, 'POST');
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products');

    await updateAdminProduct('prod-1', { expectedVersion: '1', expectedTaxonomyVersion: '2', name: 'Laptop Pro' });
    assert.equal(calls.at(-1).method, 'PATCH');
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products/prod-1');

    await transitionAdminProduct('prod-1', 'publish', { expectedVersion: '2', expectedTaxonomyVersion: '2' });
    assert.equal(calls.at(-1).method, 'POST');
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products/prod-1/publish');

    await createAdminVariant('prod-1', {
      expectedVersion: '2',
      expectedTaxonomyVersion: '2',
      sku: 'SKU-1',
      sellingPrice: { amount: 100000, currency: 'VND' },
    });
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products/prod-1/variants');

    await updateAdminVariant('prod-1', 'var-1', { expectedVersion: '3', expectedTaxonomyVersion: '2', sku: 'SKU-2' });
    assert.equal(calls.at(-1).method, 'PATCH');
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products/prod-1/variants/var-1');

    await setAdminVariantEnabled('prod-1', 'var-1', false, { expectedVersion: '4', expectedTaxonomyVersion: '2' });
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products/prod-1/variants/var-1/disable');

    await replaceAdminVariantSpecifications('prod-1', 'var-1', {
      expectedVersion: '5',
      expectedTaxonomyVersion: '2',
      technicalSpecifications: { schema_version: 1, values: { ram_gb: 16 } },
    });
    assert.equal(calls.at(-1).method, 'PUT');
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/products/prod-1/variants/var-1/specifications');

    await listAdminCategories({ page: 0, size: 50, parentCategoryId: 'root' });
    assert.equal(calls.at(-1).searchParams.get('parentCategoryId'), 'root');

    await createAdminCategory({ expectedTaxonomyVersion: '2', name: 'Phones', parentCategoryId: null });
    assert.equal(calls.at(-1).pathname, '/api/admin/catalog/categories');

    await updateAdminCategory('cat-1', { expectedVersion: '1', expectedTaxonomyVersion: '3', name: 'Phones 2' });
    assert.equal(calls.at(-1).method, 'PATCH');

    await deleteAdminCategory('cat-1', { expectedVersion: '2', expectedTaxonomyVersion: '4' });
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.equal(calls.at(-1).searchParams.get('expectedVersion'), '2');
    assert.equal(calls.at(-1).searchParams.get('expectedTaxonomyVersion'), '4');

    await listAdminBrands({ page: 0, size: 20, sort: 'code,asc' });
    assert.equal(calls.at(-1).searchParams.get('sort'), 'code,asc');

    await createAdminBrand({ code: 'apple', name: 'Apple' });
    await updateAdminBrand('brand-1', { expectedVersion: '0', name: 'Apple Inc.' });
    await deleteAdminBrand('brand-1', { expectedVersion: '1' });
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.equal(calls.at(-1).searchParams.get('expectedVersion'), '1');

    await attachAdminProductImage('prod-1', {
      expectedVersion: '5',
      expectedTaxonomyVersion: '4',
      imageId: 'img-up-1',
      altText: 'Front view',
    });
    await setPrimaryAdminProductImage('prod-1', { expectedVersion: '6', expectedTaxonomyVersion: '4', imageId: 'img-1' });
    await reorderAdminProductImages('prod-1', { expectedVersion: '7', expectedTaxonomyVersion: '4', imageIds: ['img-1'] });
    await removeAdminProductImage('prod-1', 'img-1', {
      expectedVersion: '8',
      expectedTaxonomyVersion: '4',
      replacementImageId: 'img-2',
    });
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.equal(calls.at(-1).searchParams.get('replacementImageId'), 'img-2');
  });
});

test('adminInventory and adminBehavior APIs serialize exact quantities, reasons, and days', async () => {
  await withStubbedFetch(async (calls) => {
    await listAdminInventory({ page: 1, size: 20, q: 'IP15', status: ['PUBLISHED', 'DRAFT'] });
    let call = calls.at(-1);
    assert.equal(call.pathname, '/api/admin/inventory/variants');
    assert.deepEqual(call.searchParams.getAll('status'), ['PUBLISHED', 'DRAFT']);
    assert.equal(call.searchParams.get('q'), 'IP15');

    await getAdminInventoryVariant('var-1');
    assert.equal(calls.at(-1).pathname, '/api/admin/inventory/variants/var-1');

    await getAdminInventoryHistory('var-1', { page: 0, size: 10 });
    assert.equal(calls.at(-1).pathname, '/api/admin/inventory/variants/var-1/history');

    await replenishAdminInventory('var-1', {
      operationId: 'op-1',
      delta: '25',
      reason: '   ', // blank optional reason should be omitted
    });
    call = calls.at(-1);
    assert.equal(call.method, 'POST');
    assert.equal(call.pathname, '/api/admin/inventory/variants/var-1/replenishments');
    assert.deepEqual(call.body, { operationId: 'op-1', delta: '25' });

    await correctAdminInventory('var-1', {
      operationId: 'op-2',
      delta: '-3',
      reason: '  Stock count  ',
    });
    call = calls.at(-1);
    assert.equal(call.method, 'POST');
    assert.equal(call.pathname, '/api/admin/inventory/variants/var-1/corrections');
    assert.deepEqual(call.body, { operationId: 'op-2', delta: '-3', reason: 'Stock count' });

    await getAdminBehaviorOverview(30);
    call = calls.at(-1);
    assert.equal(call.method, 'GET');
    assert.equal(call.pathname, '/api/admin/behavior/overview');
    assert.equal(call.searchParams.get('days'), '30');
  });
});

test('adminErrors formats stale version, publication readiness violations, and reservation floor details', () => {
  const stale = formatAdminError(new ApiError(409, 'Conflict', {
    code: 'CATALOG_STALE_VERSION',
    expectedVersion: '3',
    currentVersion: '4',
  }));
  assert.equal(stale.isStale, true);
  assert.match(stale.details[0], /3.*4/);

  const readiness = formatAdminError(new ApiError(422, 'Invalid', {
    code: 'CATALOG_PUBLICATION_INVALID',
    violations: [{ path: 'variants', code: 'ENABLED_VARIANT_REQUIRED', message: 'Need 1 enabled variant' }],
  }));
  assert.equal(readiness.details[0], 'variants: Need 1 enabled variant');

  const floor = formatAdminError(new ApiError(409, 'Floor', {
    code: 'INVENTORY_RESERVATION_FLOOR',
    onHand: '5',
    reserved: '4',
    available: '1',
  }));
  assert.match(floor.details[0], /5.*4.*1/);
});

test('spec and option row helpers round-trip typed schema v1 specs and reject invalid keys', () => {
  const original = {
    schema_version: 1,
    values: {
      ram_gb: { value: 16, unit: 'GB' },
      has_5g: true,
      weight_g: 221,
      chip: 'A17 Pro',
    },
  };
  const rows = specDocumentToRows(original);
  const converted = rowsToSpecDocument(rows);
  assert.equal(converted.valid, true);
  assert.deepEqual(converted.document, original);

  const badSpecs = rowsToSpecDocument([
    { id: '1', key: 'RAM GB', type: 'string', value: '16', unit: '' },
    { id: '2', key: 'weight_g', type: 'number', value: '   ', unit: '' },
  ]);
  assert.equal(badSpecs.valid, false);
  assert.ok(badSpecs.rowErrors['1'].key);
  assert.ok(badSpecs.rowErrors['2'].value);

  const optRows = optionsMapToRows({ color: 'Titan', storage: '256GB' });
  const optMap = rowsToOptionsMap(optRows);
  assert.equal(optMap.valid, true);
  assert.deepEqual(optMap.options, { color: 'Titan', storage: '256GB' });
});
