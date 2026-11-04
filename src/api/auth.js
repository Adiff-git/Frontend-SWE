import { api, storeSession } from './client.js';
import { tokens } from './tokenStore.js';

export async function startSession(path, body, { remember = false } = {}) {
  const gen = tokens.nextGeneration();
  const { data, headers } = await api.post(path, body, { auth: false, withHeaders: true });
  const committed = storeSession(headers, data, remember, gen);
  return { data, headers, committed, generation: gen };
}

// Register accepts email + password (and includes username for backward compatibility)
export const register = (email, password, options) =>
  startSession('/api/auth/register', { email, username: email, password }, options);

// `identifier` = email OR username
export const login = (identifier, password, options) =>
  startSession('/api/auth/login', { identifier, password }, options);

export async function revokeToken(refreshToken) {
  if (!refreshToken) return;
  try {
    await api.post('/api/auth/logout', { refreshToken }, { auth: false });
  } catch {
    // Best effort revocation; ignore failure
  }
}

export async function logout() {
  const refreshToken = tokens.getRefresh();
  // Invalidate local session and bump generation immediately
  tokens.clear();
  if (refreshToken) {
    await revokeToken(refreshToken);
  }
}

export const getCurrentUser = (options) => api.get('/api/me', undefined, options);

export const updateDisplayName = (displayName, options) => api.put('/api/me', { displayName }, options);

export { refreshSession } from './client.js';
