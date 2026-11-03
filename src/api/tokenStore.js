// Access token: memory only (gone on reload, short-lived: <= 15 min).
// Refresh token: localStorage (survives reloads; the backend uses bearer headers only, no cookies).
let accessToken = null;
const KEY = 'refreshToken';

export const tokens = {
  getAccess: () => accessToken,
  setAccess: (t) => { accessToken = t || null; },
  getRefresh: () => localStorage.getItem(KEY),
  setRefresh: (t) => {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY); // never store the string "undefined"
  },
  hasSession: () => Boolean(localStorage.getItem(KEY)),
  clear() { accessToken = null; localStorage.removeItem(KEY); },
};