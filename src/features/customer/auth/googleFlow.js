import { BASE_URL, ApiError, assertSession, refreshSession } from '../../../api/client.js';
import { commitSession } from '../../../api/auth.js';
import { tokens } from '../../../api/tokenStore.js';
import { exchangeGoogleCode, startGoogleAttempt } from '../../../api/identity.js';
import { getSafeReturnDestination } from './navigation.js';

const FLOW_KEY = 'googleFlow';
let exchangeFlight;
let returnedProof = null;

export function takeGoogleProof() {
  const result = returnedProof;
  if (!result || result.sessionMarker !== tokens.getSessionMarker() || Date.parse(result.expiresAt) <= Date.now()) return null;
  return result;
}

export function clearGoogleProof() { returnedProof = null; }

export function captureGoogleCallback() {
  if (!['/auth/google/callback', '/auth/google/error'].includes(window.location.pathname)) return null;
  const params = new URLSearchParams(window.location.search);
  const result = { code: params.get('code'), failed: window.location.pathname.endsWith('/error') || params.has('error') };
  window.history.replaceState(null, '', window.location.pathname);
  return result;
}

const base64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function createPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  return { verifier, challenge };
}

export async function beginGoogle({ mode = 'LOGIN', operation, recentAuthProof, destination = '/', remember = false, context } = {}) {
  exchangeFlight = null;
  if (!navigator.locks?.request) {
    throw new ApiError(400, 'Trình duyệt cần hỗ trợ Web Locks để phối hợp đăng nhập Google giữa các tab. Vui lòng dùng trình duyệt khác hoặc đăng nhập bằng mật khẩu.');
  }
  return navigator.locks.request('google-initiation', async () => {
    const generation = tokens.getGeneration();
    let sessionMarker = tokens.getSessionMarker();
    if (mode !== 'LOGIN' && !sessionMarker) {
      sessionMarker = crypto.randomUUID();
      tokens.setSessionMarker(sessionMarker);
    }
    const { verifier, challenge } = await createPkce();
    const result = await startGoogleAttempt(mode, {
      codeChallenge: challenge, codeChallengeMethod: 'S256',
      ...(mode === 'LINK' && { recentAuthProof }),
      ...(mode === 'REAUTH' && { operation }),
    });
    assertSession(generation);
    const backend = new URL(BASE_URL || window.location.origin);
    const authorization = new URL(result.authorizationUrl, backend);
    if (authorization.origin !== backend.origin || authorization.pathname !== '/oauth2/authorization/google' || authorization.username || authorization.password) {
      throw new ApiError(502, 'Đường dẫn đăng nhập Google không hợp lệ.');
    }
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({
      verifier, mode, operation, sessionMarker, remember, context,
      destination: getSafeReturnDestination(destination), expiresAt: result.expiresAt,
    }));
    window.location.assign(authorization.href);
  });
}

export function finishGoogle(callback) {
  if (exchangeFlight) return exchangeFlight;
  exchangeFlight = (async () => {
    let flow;
    try { flow = JSON.parse(sessionStorage.getItem(FLOW_KEY)); } catch { /* Invalid redirect context. */ }
    sessionStorage.removeItem(FLOW_KEY);
    if (!flow || !['LOGIN', 'LINK', 'REAUTH'].includes(flow.mode) || !/^[A-Za-z0-9_-]{43}$/.test(callback?.code || '') || callback.failed || !(Date.parse(flow.expiresAt) > Date.now())) {
      throw new ApiError(400, 'Lượt đăng nhập Google không còn hợp lệ. Vui lòng bắt đầu lại.');
    }
    const generation = flow.mode === 'LOGIN' ? tokens.nextGeneration() : tokens.getGeneration();
    if (flow.mode !== 'LOGIN') {
      if (!flow.sessionMarker || flow.sessionMarker !== tokens.getSessionMarker() || !tokens.hasSession()) {
        throw new ApiError(409, 'Phiên xác thực đã thay đổi. Vui lòng bắt đầu lại.');
      }
      if (!tokens.getAccess()) await refreshSession();
      assertSession(generation);
    }
    const response = await exchangeGoogleCode(callback.code, flow.verifier, flow.mode);
    assertSession(generation);
    if (flow.mode === 'LOGIN') {
      return { session: commitSession(response, flow.remember, generation), destination: getSafeReturnDestination(flow.destination) };
    }
    if (flow.mode === 'REAUTH') {
      if (!response.data?.recentAuthProof || !(Date.parse(response.data.expiresAt) > Date.now())) throw new ApiError(502, 'Không nhận được bằng chứng xác thực hợp lệ.');
      returnedProof = { ...response.data, operation: flow.operation, sessionMarker: flow.sessionMarker, context: flow.context };
    }
    return { destination: '/profile/info' };
  })();
  return exchangeFlight;
}
