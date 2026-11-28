export const authenticatedAuthValue = {
  user: { id: 'user-1', displayName: 'Shopper', username: 'shopper' },
  generation: 1,
  status: 'authenticated',
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: async () => ({ success: true }),
  logout: async () => {},
  clearSession: () => {},
  retryBootstrap: async () => {},
};

export const guestAuthValue = {
  ...authenticatedAuthValue,
  user: null,
  status: 'guest',
  isAuthenticated: false,
};

export function makeAuthValue(overrides = {}) {
  return { ...authenticatedAuthValue, ...overrides };
}
