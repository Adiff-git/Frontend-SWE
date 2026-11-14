import { tokens } from './tokenStore.js';

export const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (globalThis.process?.env?.VITE_API_URL);

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = network failure (no response)
    this.data = data;
    this.code = data?.code;
    this.fieldErrors = data?.fieldErrors ?? {}; // { fieldName: ['message', ...] } for forms
  }
}

// The app (e.g. AuthProvider) registers what should happen when the session is dead.
let onSessionExpired = () => {};
export function setSessionExpiredHandler(fn) {
  onSessionExpired = typeof fn === 'function' ? fn : () => {};
}

function buildUrl(path, params) {
  const base = BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');
  const url = new URL(path, base);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      // .set (not .append): the contract rejects duplicate query parameters
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  return url;
}

async function send(url, { method, body, headers, auth, signal, credentials }) {
  const token = tokens.getAccess();
  try {
    return await fetch(url, {
      method,
      signal,
      credentials: credentials || 'omit',
      cache: 'no-store',
      headers: {
        // Only when there is a body: a Content-Type on GET forces a CORS preflight every time.
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(auth && token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(0, 'Network error. Please check your connection.', null);
  }
}

const parse = (res) => (res.status === 204 ? null : res.json().catch(() => null));

// Auth spec exposes `message` + `detail`; catalog spec only `detail`. Support both.
const toError = (res, data) =>
  new ApiError(res.status, data?.detail ?? data?.message ?? res.statusText, data);

/**
 * options:
 *  - auth (default true): attach the access token and try one refresh on 401.
 *    Pass false for login/register/refresh/logout and public calls where you want no token.
 *  - withHeaders: return { data, headers } (needed because the access JWT arrives in a response header)
 *  - signal: optional AbortSignal
 */
export function assertSession(generation) {
  if (generation !== tokens.getGeneration()) {
    throw new ApiError(409, 'Phiên làm việc đã thay đổi. Vui lòng bắt đầu lại.', { code: 'SESSION_CHANGED' });
  }
}

async function request(path, { method = 'GET', body, params, headers, auth = true,
  autoRefresh = true, withHeaders = false, signal, credentials, expectedStatus } = {}) {
  const generation = tokens.getGeneration();
  const options = { method, body, headers, auth, signal, credentials };
  const url = buildUrl(path, params);
  let res = await send(url, options);
  if (auth) assertSession(generation);
  if (res.status === 401 && auth && autoRefresh && tokens.hasSession()) {
    await refreshSession();
    assertSession(generation);
    res = await send(url, options);
    if (res.status === 401 && generation === tokens.getGeneration()) {
      tokens.clear();
      onSessionExpired();
    }
  }
  const data = await parse(res);
  if (auth) assertSession(generation);
  if (!res.ok) throw toError(res, data);
  if (expectedStatus && res.status !== expectedStatus) {
    throw new ApiError(502, 'Phản hồi máy chủ không khớp phiên bản API yêu cầu.', { code: 'CONTRACT_MISMATCH' });
  }
  return withHeaders ? { data, headers: res.headers } : data;
}

export const api = {
  get: (path, params, options) => request(path, { ...options, params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

// Login/registration-confirmation/refresh return refresh tokens in the JSON body,
// access JWT in the Authorization RESPONSE header.
export function storeSession(headers, body, remember, expectedGeneration) {
  if (expectedGeneration !== undefined && expectedGeneration !== tokens.getGeneration()) {
    // Stale response from a previous generation: ignore to prevent race conditions
    return false;
  }
  const access = headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!access) {
    // Usually means the backend does not send Access-Control-Expose-Headers: Authorization
    throw new ApiError(0, 'Authorization header not readable from the response (CORS expose-headers?)', null);
  }
  if (!body || body.tokenType !== 'Bearer' || !/^[A-Za-z0-9_-]{43}$/.test(body.refreshToken || '') ||
      !Number.isInteger(body.accessTokenExpiresIn) || body.accessTokenExpiresIn <= 0 || body.accessTokenExpiresIn > 900 ||
      !Number.isFinite(Date.parse(body.refreshTokenExpiresAt))) {
    throw new ApiError(502, 'Phản hồi phiên đăng nhập không hợp lệ.', { code: 'CONTRACT_MISMATCH' });
  }
  tokens.setRefresh(body.refreshToken, remember); // first: the old refresh token is already consumed
  tokens.setAccess(access);
  tokens.setDeadline(body.refreshTokenExpiresAt);
  return true;
}

let refreshFlight = null;
let uncertainGeneration = null;

export function refreshSession() {
  const generation = tokens.getGeneration();
  if (uncertainGeneration === generation) {
    return Promise.reject(new ApiError(409, 'Không xác định được kết quả làm mới phiên. Vui lòng đăng nhập lại.', { code: 'SESSION_RECOVERY_REQUIRED' }));
  }
  if (refreshFlight?.generation === generation) return refreshFlight.promise;
  const runRefresh = async () => {
    assertSession(generation);
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) throw new ApiError(401, 'No session', null);
    try {
      const res = await send(buildUrl('/api/auth/refresh'), {
        method: 'POST', body: { refreshToken }, auth: false,
      });
      const data = await parse(res);
      if (res.status === 401 && generation === tokens.getGeneration()) {
        tokens.clear();
        onSessionExpired();
      }
      if (!res.ok) throw toError(res, data);
      assertSession(generation);
      storeSession(res.headers, data, undefined, generation);
    } catch (error) {
      if ((error.status === 0 || error.status >= 500) && generation === tokens.getGeneration()) {
        uncertainGeneration = generation;
        throw new ApiError(409, 'Không xác định được kết quả làm mới phiên. Vui lòng đăng nhập lại.', { code: 'SESSION_RECOVERY_REQUIRED' });
      }
      throw error;
    }
  };
  const promise = (typeof navigator !== 'undefined' && navigator.locks?.request
    ? navigator.locks.request('auth-refresh', runRefresh) : runRefresh());
  const flight = { generation, promise: null };
  flight.promise = promise.finally(() => { if (refreshFlight === flight) refreshFlight = null; });
  refreshFlight = flight;
  return flight.promise;
}
