// Access token: memory only (gone on reload, short-lived: <= 15 min).
// Refresh token: localStorage when remembered, otherwise sessionStorage for this tab.
let accessToken = null;
let currentGeneration = 1;
const KEY = 'refreshToken';

export const tokens = {
  getGeneration: () => currentGeneration,
  nextGeneration: () => {
    currentGeneration += 1;
    return currentGeneration;
  },
  getAccess: () => accessToken,
  setAccess: (t) => {
    accessToken = t || null;
  },
  getRefresh: () => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(KEY)) {
      return sessionStorage.getItem(KEY);
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(KEY);
    }
    return null;
  },
  isRemembered: () => {
    if (typeof localStorage !== 'undefined') {
      return Boolean(localStorage.getItem(KEY));
    }
    return false;
  },
  setRefresh: (t, remember = typeof sessionStorage !== 'undefined' ? !sessionStorage.getItem(KEY) : true) => {
    const storage = remember
      ? (typeof localStorage !== 'undefined' ? localStorage : null)
      : (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
    const otherStorage = remember
      ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
      : (typeof localStorage !== 'undefined' ? localStorage : null);

    if (t) {
      storage?.setItem(KEY, t);
      otherStorage?.removeItem(KEY);
    } else {
      localStorage?.removeItem(KEY);
      sessionStorage?.removeItem(KEY);
    }
  },
  hasSession: () => {
    const hasSessionStorage = typeof sessionStorage !== 'undefined' && Boolean(sessionStorage.getItem(KEY));
    const hasLocalStorage = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(KEY));
    return hasSessionStorage || hasLocalStorage;
  },
  clear() {
    currentGeneration += 1;
    accessToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(KEY);
    }
  },
};
