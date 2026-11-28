import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import {
  createAddress as apiCreateAddress,
  deleteAddress as apiDeleteAddress,
  getAddresses as apiGetAddresses,
  updateAddress as apiUpdateAddress,
} from '../../../api/addresses';

export default function useAddresses() {
  const queryClient = useQueryClient();
  const { user, generation, isAuthenticated } = useAuth();

  const queryKey = useMemo(
    () => ['addresses', user?.id, generation],
    [user?.id, generation],
  );

  const {
    data: rawAddresses,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => apiGetAddresses({ signal }),
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const addresses = useMemo(() => {
    if (!Array.isArray(rawAddresses)) return [];
    // Ensure default-first, then id descending
    return [...rawAddresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [rawAddresses]);

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const createMutation = useMutation({
    retry: false,
    mutationFn: (payload) => apiCreateAddress(payload),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    retry: false,
    mutationFn: ({ id, payload }) => apiUpdateAddress(id, payload),
    onSuccess: () => invalidate(),
    onError: (err) => {
      if (err?.status === 404) {
        invalidate();
      }
    },
  });

  const deleteMutation = useMutation({
    retry: false,
    mutationFn: (id) => apiDeleteAddress(id),
    onSuccess: () => invalidate(),
    onError: (err) => {
      if (err?.status === 404) {
        invalidate();
      }
    },
  });

  const setDefault = useCallback(
    async (address) => {
      if (!address || address.isDefault) return;
      return updateMutation.mutateAsync({
        id: address.id,
        payload: {
          recipientName: address.recipientName,
          recipientPhone: address.recipientPhone,
          addressText: address.addressText,
          isDefault: true,
        },
      });
    },
    [updateMutation],
  );

  return {
    addresses,
    count: addresses.length,
    isLoading,
    isError,
    error,
    refetch,
    invalidate,
    createAddress: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAddress: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    isUpdating: updateMutation.isPending,
    deleteAddress: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    setDefault,
  };
}
