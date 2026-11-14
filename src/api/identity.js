import { api } from './client.js';
const singleUse = { autoRefresh: false };
export const createEmailChallenge = (purpose, destination) => api.post('/api/me/email-verification-challenges', { purpose, destination }, singleUse);
export const getEmailChallenge = (id) => api.get(`/api/me/email-verification-challenges/${encodeURIComponent(id)}`);
export const confirmEmailChallenge = (id, code, recentAuthProof) => api.post(`/api/me/email-verification-challenges/${encodeURIComponent(id)}/confirm`, {
  code, ...(recentAuthProof && { recentAuthProof }),
}, singleUse);
export const reauthenticate = (operation, password) => api.post('/api/me/reauthentications', { operation, password }, singleUse);
export const createInitialPassword = (newPassword, recentAuthProof) => api.post('/api/me/password', { newPassword, recentAuthProof }, { ...singleUse, expectedStatus: 204 });
export const getGoogleConnection = (options) => api.get('/api/me/google-connection', undefined, options);
export const startGoogleAttempt = (mode, body) => {
  const path = mode === 'LOGIN' ? '/api/auth/google-login-attempts' : mode === 'LINK' ? '/api/me/google-connection-attempts' : '/api/me/google-reauthentication-attempts';
  return api.post(path, body, { auth: mode !== 'LOGIN', credentials: 'include', autoRefresh: false });
};
export const exchangeGoogleCode = (code, codeVerifier, mode) => api.post('/api/auth/google-code-exchanges', { code, codeVerifier }, {
  auth: mode !== 'LOGIN', autoRefresh: false, withHeaders: true,
});
