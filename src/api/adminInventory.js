import { api } from './client.js';

const BASE = '/api/admin/inventory/variants';

function cleanQuery(q) {
  if (typeof q !== 'string') return undefined;
  const trimmed = q.trim();
  return trimmed ? trimmed : undefined;
}

export const listAdminInventory = ({ page = 0, size = 20, q, status } = {}, options) => {
  const params = { page, size, q: cleanQuery(q) };
  if (Array.isArray(status) ? status.length > 0 : Boolean(status)) {
    params.status = status;
  }
  return api.get(BASE, params, options);
};

export const getAdminInventoryVariant = (variantId, options) =>
  api.get(`${BASE}/${encodeURIComponent(variantId)}`, undefined, options);

export const getAdminInventoryHistory = (variantId, { page = 0, size = 20 } = {}, options) =>
  api.get(`${BASE}/${encodeURIComponent(variantId)}/history`, { page, size }, options);

export const replenishAdminInventory = (variantId, { operationId, delta, reason }, options) => {
  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  return api.post(
    `${BASE}/${encodeURIComponent(variantId)}/replenishments`,
    {
      operationId: operationId || crypto.randomUUID(),
      delta: String(delta),
      ...(trimmedReason ? { reason: trimmedReason } : {}),
    },
    options,
  );
};

export const correctAdminInventory = (variantId, { operationId, delta, reason }, options) =>
  api.post(
    `${BASE}/${encodeURIComponent(variantId)}/corrections`,
    {
      operationId: operationId || crypto.randomUUID(),
      delta: String(delta),
      reason: String(reason ?? '').trim(),
    },
    options,
  );
