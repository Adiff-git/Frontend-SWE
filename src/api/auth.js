import { api, storeSession } from './client.js';
import { tokens } from './tokenStore.js';

async function startSession(path, body) {
  const { data, headers } = await api.post(path, body, { auth: false, withHeaders: true });
  storeSession(headers, data);
}

// Register accepts only username + password (see spec).
export const register = (username, password) =>
  startSession('/api/auth/register', { username, password });

// `identifier` = username OR email (not "email").
export const login = (identifier, password) =>
  startSession('/api/auth/login', { identifier, password });

export async function logout() {
  const refreshToken = tokens.getRefresh();
  try {
    if (refreshToken) await api.post('/api/auth/logout', { refreshToken }, { auth: false });
  } catch {
    // best effort: the user must be signed out locally even if the server call fails
  } finally {
    tokens.clear();
  }
}

export const getCurrentUser = () => api.get('/api/me');

export { refreshSession } from './client.js';