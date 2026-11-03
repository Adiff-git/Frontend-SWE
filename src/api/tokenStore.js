// Access token: memory only (gone on reload, short-lived: <= 15 min).
// Refresh token: localStorage when remembered, otherwise sessionStorage for this tab.
let accessToken = null;
const KEY = 'refreshToken';

export const tokens = {
  getAccess: () => accessToken,
  setAccess: (t) => { accessToken = t || null; },
  getRefresh: () => sessionStorage.getItem(KEY) || localStorage.getItem(KEY),
  setRefresh: (t, remember = !sessionStorage.getItem(KEY)) => {
    const storage = remember ? localStorage : sessionStorage;
    // Preserve the selected persistence policy when rotating refresh tokens.
    if (t) {
      storage.setItem(KEY, t);
      (remember ? sessionStorage : localStorage).removeItem(KEY);
    } else {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    }
  },
  hasSession: () => Boolean(sessionStorage.getItem(KEY) || localStorage.getItem(KEY)),
  clear() { accessToken = null; localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); },
};
