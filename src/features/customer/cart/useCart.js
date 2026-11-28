import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { getProductVariants } from '../product-detail/productDetailApi';
import {
  addCartItem,
  applyCartVoucher,
  changeCartVariant,
  getCart,
  removeCartItem,
  removeCartVoucher,
  selectAllCartItems,
  selectCartItem,
  updateCartQuantity,
} from './cartApi';
import { toCartView } from './cartMappers';
import { mapApiError } from './cartReasons';

const isAlreadyRemoved = (error) => error?.status === 404;

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function useCart() {
  const auth = useAuth();
  const user = USE_MOCKS ? { id: 'mock-user' } : auth.user;
  const generation = auth.generation;
  const isAuthenticated = USE_MOCKS || auth.isAuthenticated;  

  // const { user, generation, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const cartKey = useMemo(() => ['cart', user?.id, generation], [user?.id, generation]);
  const walletPrefix = useMemo(() => ['cart', 'voucherWallet'], []);
  const scope = useMemo(() => ({ id: `cart:${user?.id ?? 'guest'}:${generation}` }), [user?.id, generation]);
  const [notice, setNotice] = useState('');
  const [variantOptions, setVariantOptions] = useState({});

  const query = useQuery({
    queryKey: cartKey,
    queryFn: ({ signal }) => getCart({ signal }),
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 0,
    retry: false,
  });

  const cart = useMemo(() => toCartView(query.data), [query.data]);

  const settle = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: cartKey, type: 'active' });
    await queryClient.invalidateQueries({ queryKey: walletPrefix });
  }, [queryClient, cartKey, walletPrefix]);

  const onError = useCallback((error) => setNotice(mapApiError(error)), []);
  const onSuccess = useCallback(() => setNotice(''), []);

  const mutationOptions = useCallback((mutationFn) => ({
    mutationFn,
    scope,
    retry: false,
    onError,
    onSuccess,
    onSettled: settle,
  }), [scope, onError, onSuccess, settle]);

  const addMutation = useMutation(mutationOptions(({ productVariantId, quantity }) => addCartItem({ productVariantId, quantity })));
  const quantityMutation = useMutation(mutationOptions(({ itemId, quantity }) => updateCartQuantity({ itemId, quantity })));
  const variantMutation = useMutation(mutationOptions(({ itemId, productVariantId }) => changeCartVariant({ itemId, productVariantId })));
  const selectMutation = useMutation(mutationOptions(({ itemId, selected }) => selectCartItem({ itemId, selected })));
  const selectAllMutation = useMutation(mutationOptions(({ selected }) => selectAllCartItems({ selected })));
  const removeMutation = useMutation(mutationOptions(async ({ itemId }) => {
    try {
      await removeCartItem({ itemId });
    } catch (error) {
      if (!isAlreadyRemoved(error)) throw error;
    }
  }));
  const removeSelectedMutation = useMutation(mutationOptions(async ({ itemIds }) => {
    for (const itemId of itemIds) {
      try {
        await removeCartItem({ itemId });
      } catch (error) {
        if (!isAlreadyRemoved(error)) throw error;
      }
    }
  }));
  const applyVoucherMutation = useMutation(mutationOptions(({ walletEntitlementId }) => applyCartVoucher({ walletEntitlementId })));
  const removeVoucherMutation = useMutation(mutationOptions(() => removeCartVoucher()));

  const loadVariants = useCallback(async (productId) => {
    if (!productId || variantOptions[productId]) return;
    const variants = await getProductVariants(productId);
    setVariantOptions((current) => ({ ...current, [productId]: variants }));
  }, [variantOptions]);

  const busy = addMutation.isPending || quantityMutation.isPending || variantMutation.isPending
    || selectMutation.isPending || selectAllMutation.isPending || removeMutation.isPending
    || removeSelectedMutation.isPending || applyVoucherMutation.isPending || removeVoucherMutation.isPending;

  return {
    cart,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? mapApiError(query.error) : '',
    refetch: query.refetch,
    notice,
    clearNotice: () => setNotice(''),
    setNotice,
    busy,
    addItem: addMutation.mutateAsync,
    updateQuantity: quantityMutation.mutateAsync,
    changeVariant: variantMutation.mutateAsync,
    selectItem: selectMutation.mutateAsync,
    selectAll: selectAllMutation.mutateAsync,
    removeItem: removeMutation.mutateAsync,
    removeSelected: removeSelectedMutation.mutateAsync,
    applyVoucher: applyVoucherMutation.mutateAsync,
    removeVoucher: removeVoucherMutation.mutateAsync,
    variantOptions,
    loadVariants,
  };
}

export default useCart;
