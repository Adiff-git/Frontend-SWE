import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './authContext';
import { assertSession, setSessionExpiredHandler } from '../../../api/client';
import { tokens } from '../../../api/tokenStore';
import { getCurrentUser, login as apiLogin, register, confirmRegistration, revokeToken } from '../../../api/auth';
import { updateProfile as apiUpdateProfile } from '../../../api/profile';
import { clearGoogleProof } from './googleFlow';

const privateQuery = (query) => ['profile', 'addresses', 'orders', 'cart', 'googleConnection'].includes(query.queryKey[0]);

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [generation, setGeneration] = useState(() => tokens.getGeneration());
  const [hasStoredSession, setHasStoredSession] = useState(() => tokens.hasSession());
  const [isCompletingAuth, setIsCompletingAuth] = useState(false);

  const clearPrivate = useCallback(() => {
    queryClient.cancelQueries({ predicate: privateQuery });
    queryClient.removeQueries({ predicate: privateQuery });
  }, [queryClient]);

  const clearSession = useCallback(() => {
    clearGoogleProof();
    tokens.clear();
    setGeneration(tokens.getGeneration());
    setHasStoredSession(false);
    setIsCompletingAuth(false);
    clearPrivate();
  }, [clearPrivate]);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!['refreshToken', 'authSessionMarker', null].includes(event.key)) return;
      if (sessionStorage.getItem('refreshToken')) return;
      if (event.key === 'refreshToken' && event.newValue !== null) return;
      tokens.syncExternal();
      sessionStorage.removeItem('googleFlow');
      setGeneration(tokens.getGeneration());
      setHasStoredSession(tokens.hasSession());
      setIsCompletingAuth(false);
      clearPrivate();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [clearPrivate]);

  const profileQuery = useQuery({
    queryKey: ['profile', generation],
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    enabled: hasStoredSession,
    staleTime: 60 * 1000,
    retry: false,
  });

  const acceptSession = useCallback(async (result) => {
    if (!result.committed) throw new Error('Phiên đăng nhập đã thay đổi.');
    assertSession(result.generation);
    clearPrivate();
    setGeneration(result.generation);
    setHasStoredSession(true);
    try {
      const profile = await queryClient.fetchQuery({
        queryKey: ['profile', result.generation],
        queryFn: ({ signal }) => getCurrentUser({ signal }), retry: false,
      });
      assertSession(result.generation);
      return { success: true, profile };
    } catch (error) {
      assertSession(result.generation);
      return { success: true, profile: null, profileError: error };
    }
  }, [queryClient, clearPrivate]);

  const login = useCallback(async (...args) => acceptSession(await apiLogin(...args)), [acceptSession]);
  const confirmSignup = useCallback(async (...args) => acceptSession(await confirmRegistration(...args)), [acceptSession]);
  const logout = useCallback(async () => {
    const secret = tokens.getRefresh();
    clearSession();
    void revokeToken(secret);
  }, [clearSession]);
  const updateProfile = useCallback(async (arg) => {
    const target = tokens.getGeneration();
    const updated = await apiUpdateProfile(typeof arg === 'string' ? { displayName: arg } : arg);
    assertSession(target);
    queryClient.setQueryData(['profile', target], updated);
    return updated;
  }, [queryClient]);
  const refreshProfile = useCallback(async () => {
    const target = tokens.getGeneration();
    const profile = await getCurrentUser();
    assertSession(target);
    queryClient.setQueryData(['profile', target], profile);
    return profile;
  }, [queryClient]);

  const status = !hasStoredSession ? 'guest' : profileQuery.isPending ? 'checking'
    : profileQuery.isError ? 'error' : 'authenticated';
  const error = profileQuery.error ? {
    status: profileQuery.error.status, code: profileQuery.error.code,
    type: profileQuery.error.status === 403 ? 'forbidden' : 'server',
    message: profileQuery.error.message,
  } : null;

  return <AuthContext.Provider value={{
    user: status === 'authenticated' ? profileQuery.data : null,
    status, error, generation, isAuthenticated: status === 'authenticated',
    isLoading: status === 'checking', isCompletingAuth, setCompletingAuth: setIsCompletingAuth,
    login, register, confirmSignup, acceptSession, logout, clearSession,
    updateProfile, refreshProfile, retryBootstrap: () => profileQuery.refetch(),
  }}>{children}</AuthContext.Provider>;
}
