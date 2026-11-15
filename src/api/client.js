import { tokens } from './tokenStore.js';

const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = network failure (no response)
    this.data = data;
    this.fieldErrors = data?.fieldErrors ?? {}; // { fieldName: ['message', ...] } for forms
  }
}

// The app (e.g. AuthProvider) registers what should happen when the session is dead.
let onSessionExpired = () => {};
export function setSessionExpiredHandler(fn) { onSessionExpired = fn; }

function buildUrl(path, params) {
  const url = new URL(path, BASE_URL || window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      // .set (not .append): the contract rejects duplicate query parameters
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  return url;
}

async function send(url, { method, body, headers, auth }) {
  const token = tokens.getAccess();
  try {
    return await fetch(url, {
      method,
      headers: {
        // Only when there is a body: a Content-Type on GET forces a CORS preflight every time.
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(auth && token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
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
 */
async function request(path, { method = 'GET', body, params, headers, auth = true, withHeaders = false } = {}) {
  const url = buildUrl(path, params);
  let res = await send(url, { method, body, headers, auth });

  if (res.status === 401 && auth && tokens.hasSession()) {
    await refreshSession(); // throws if the session is really dead
    res = await send(url, { method, body, headers, auth }); // retry once
  }

  const data = await parse(res);
  if (!res.ok) throw toError(res, data);
  return withHeaders ? { data, headers: res.headers } : data;
}

export const api = {
  get: (path, params, options) => request(path, { ...options, params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

// Login/register/refresh all answer the same way: refresh token in the JSON body,
// access JWT in the Authorization RESPONSE header.
export function storeSession(headers, body) {
  const access = headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!access) {
    // Usually means the backend does not send Access-Control-Expose-Headers: Authorization
    throw new ApiError(0, 'Authorization header not readable from the response (CORS expose-headers?)', null);
  }
  tokens.setRefresh(body.refreshToken); // first: the old refresh token is already consumed
  tokens.setAccess(access);
}

let refreshPromise = null;

export function refreshSession() {
  // Same-tab dedupe (refreshPromise) + cross-tab lock: the backend revokes the whole
  // session if a consumed refresh token is ever reused.
  refreshPromise ??= navigator.locks
    .request('auth-refresh', async () => {
      const refreshToken = tokens.getRefresh(); // read inside the lock
      if (!refreshToken) throw new ApiError(401, 'No session', null);

      const res = await send(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      });
      const data = await parse(res);

      if (res.status === 401) {
        // Only a real 401 means the session is dead. 409 (retry) / 500 / network: keep the tokens.
        tokens.clear();
        onSessionExpired();
      }
      if (!res.ok) throw toError(res, data);
      storeSession(res.headers, data);
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}