import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './authContext';
import { setSessionExpiredHandler } from '../../../api/client';
import { tokens } from '../../../api/tokenStore';
import {
  getCurrentUser,
  login as apiLogin,
  register as apiRegister,
  revokeToken,
  updateDisplayName as apiUpdateDisplayName,
} from '../../../api/auth';

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [generation, setGeneration] = useState(() => tokens.getGeneration());
  const [hasStoredSession, setHasStoredSession] = useState(() => tokens.hasSession());
  const [isExpired, setIsExpired] = useState(false);
  const [isCompletingAuth, setIsCompletingAuth] = useState(false);

  // 1. Register session-expired callback with client
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setIsExpired(true);
      setHasStoredSession(false);
      queryClient.removeQueries({ queryKey: ['profile'] });
    });
    return () => {
      setSessionExpiredHandler(() => {});
    };
  }, [queryClient]);

  // 2. Cross-tab synchronization for remembered sessions
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'refreshToken') return;

      // sessionStorage sessions remain tab-scoped; do not sign them out
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('refreshToken')) {
        return;
      }

      // If refreshToken was removed in localStorage by another tab
      if (event.newValue === null) {
        tokens.clear();
        setGeneration(tokens.nextGeneration());
        setHasStoredSession(false);
        setIsExpired(false);
        queryClient.cancelQueries();
        queryClient.removeQueries({ queryKey: ['profile'] });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => {
        window.removeEventListener('storage', handleStorage);
      };
    }
  }, [queryClient]);

  // 3. Session-scoped profile query
  const profileQuery = useQuery({
    queryKey: ['profile', generation],
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    enabled: hasStoredSession && !isExpired,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Exclude 401 and 403 from blind query retries
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 2;
    },
  });

  // 4. Derive single source of truth for session status
  let status = 'guest';
  let error = null;

  if (hasStoredSession && !isExpired) {
    if (profileQuery.isLoading || profileQuery.isPending) {
      status = 'checking';
    } else if (profileQuery.isSuccess && profileQuery.data) {
      status = 'authenticated';
    } else if (profileQuery.isError) {
      const err = profileQuery.error;
      if (err?.status === 401) {
        status = 'guest';
      } else if (err?.status === 403) {
        status = 'error';
        error = {
          type: 'forbidden',
          status: 403,
          message: 'Tài khoản không có quyền truy cập hồ sơ cá nhân.',
        };
      } else if (err?.status === 0) {
        status = 'error';
        error = {
          type: 'network',
          status: 0,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        };
      } else {
        status = 'error';
        error = {
          type: 'server',
          status: err?.status || 500,
          message: err?.message || 'Đã xảy ra lỗi khi kiểm tra phiên làm việc.',
        };
      }
    }
  }

  // 5. Actions
  const loginAction = useCallback(async (identifier, password, options = {}) => {
    const result = await apiLogin(identifier, password, options);
    setGeneration(result.generation);
    setHasStoredSession(true);
    setIsExpired(false);

    try {
      const profile = await queryClient.fetchQuery({
        queryKey: ['profile', result.generation],
        queryFn: ({ signal }) => getCurrentUser({ signal }),
        retry: false,
      });
      return { success: true, profile };
    } catch (err) {
      return { success: true, profile: null, profileError: err };
    }
  }, [queryClient]);

  const registerAction = useCallback(async (username, password, options = {}) => {
    const result = await apiRegister(username, password, options);
    setGeneration(result.generation);
    setHasStoredSession(true);
    setIsExpired(false);

    try {
      const profile = await queryClient.fetchQuery({
        queryKey: ['profile', result.generation],
        queryFn: ({ signal }) => getCurrentUser({ signal }),
        retry: false,
      });
      return { success: true, profile };
    } catch (err) {
      return { success: true, profile: null, profileError: err };
    }
  }, [queryClient]);

  const logoutAction = useCallback(async () => {
    const nextGen = tokens.nextGeneration();
    setGeneration(nextGen);
    const tokenToRevoke = tokens.getRefresh();
    tokens.clear();
    setHasStoredSession(false);
    setIsExpired(false);
    setIsCompletingAuth(false);

    // Cancel and remove private queries
    queryClient.cancelQueries();
    queryClient.removeQueries({ queryKey: ['profile'] });
    queryClient.removeQueries({ queryKey: ['orders'] });
    queryClient.removeQueries({ queryKey: ['cart'] });

    if (tokenToRevoke) {
      revokeToken(tokenToRevoke).catch(() => {});
    }
  }, [queryClient]);

  const retryBootstrap = useCallback(() => {
    setIsExpired(false);
    setHasStoredSession(tokens.hasSession());
    profileQuery.refetch();
  }, [profileQuery]);

  const updateProfile = useCallback(async (displayName) => {
    const updated = await apiUpdateDisplayName(displayName);
    queryClient.setQueryData(['profile', generation], (old) => {
      return old ? { ...old, displayName: updated?.displayName || displayName } : updated;
    });
    queryClient.invalidateQueries({ queryKey: ['profile', generation] });
    return updated;
  }, [generation, queryClient]);

  const value = useMemo(
    () => ({
      user: status === 'authenticated' ? profileQuery.data : null,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'checking',
      error,
      isCompletingAuth,
      setCompletingAuth: setIsCompletingAuth,
      login: loginAction,
      register: registerAction,
      logout: logoutAction,
      retryBootstrap,
      updateProfile,
    }),
    [
      status,
      profileQuery.data,
      error,
      isCompletingAuth,
      loginAction,
      registerAction,
      logoutAction,
      retryBootstrap,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
