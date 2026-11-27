import { api } from './client.js';

export const getAdminBehaviorOverview = (days = 7, options) =>
  api.get('/api/admin/behavior/overview', { days }, options);
