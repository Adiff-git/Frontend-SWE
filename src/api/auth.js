import { api, storeSession, ApiError } from './client.js';
import { tokens } from './tokenStore.js';
import { getProfile, updateProfile } from './profile.js';

export function commitSession(result, remember, generation) {
  const committed = storeSession(result.headers, result.data, remember, generation);
  if (!committed) throw new ApiError(409, 'Phiên đăng nhập đã thay đổi.', { code: 'SESSION_CHANGED' });
  tokens.setSessionMarker(crypto.randomUUID(), remember);
  return { ...result, committed, generation };
}

export async function startSession(path, body, { remember = false, expectedStatus = 200 } = {}) {
  const generation = tokens.nextGeneration();
  const result = await api.post(path, body, { auth: false, withHeaders: true, expectedStatus });
  return commitSession(result, remember, generation);
}

export const register = (email, password) => api.post('/api/auth/register', { email, password }, { auth: false, expectedStatus: 202 });
export const resendRegistration = (pending) => api.post('/api/auth/registration-verifications/resend', {
  registrationCredential: pending.registrationCredential, challengeId: pending.challengeId,
}, { auth: false, expectedStatus: 202 });
export const confirmRegistration = (pending, code, password, options) => startSession('/api/auth/registration-verifications/confirm', {
  registrationCredential: pending.registrationCredential, challengeId: pending.challengeId, code, password,
}, { ...options, expectedStatus: 201 });
export const login = (identifier, password, options) => startSession('/api/auth/login', { identifier, password }, options);
export const changePassword = (currentPassword, newPassword) => api.put('/api/auth/password', { currentPassword, newPassword }, { autoRefresh: false, expectedStatus: 204 });
export async function revokeToken(refreshToken) {
  if (!refreshToken) return;
  try { await api.post('/api/auth/logout', { refreshToken }, { auth: false }); } catch { /* Local logout is authoritative for this browser. */ }
}
export async function logout() {
  const refreshToken = tokens.getRefresh();
  tokens.clear();
  await revokeToken(refreshToken);
}
export const getCurrentUser = getProfile;
export const updateDisplayName = (displayName, options) => updateProfile({ displayName }, options);
export { refreshSession } from './client.js';
