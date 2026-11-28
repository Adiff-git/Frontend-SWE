import { api } from './client.js';

export const getAddresses = (options) => api.get('/api/me/addresses', undefined, options);

export const getAddress = (id, options) =>
  api.get(`/api/me/addresses/${encodeURIComponent(id)}`, undefined, options);

export const createAddress = (payload, options) =>
  api.post('/api/me/addresses', payload, options);

export const updateAddress = (id, payload, options) =>
  api.put(`/api/me/addresses/${encodeURIComponent(id)}`, payload, options);

export const deleteAddress = (id, options) =>
  api.delete(`/api/me/addresses/${encodeURIComponent(id)}`, options);

