import { useInfiniteQuery } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { getVoucherWalletPage } from './cartApi';
import { toVoucherView } from './cartMappers';
import { mapApiError } from './cartReasons';

export function useVoucherWallet() {
  const { user, generation, isAuthenticated } = useAuth();
  const query = useInfiniteQuery({
    queryKey: ['cart', 'voucherWallet', user?.id, generation, 20],
    queryFn: ({ pageParam = 0, signal }) => getVoucherWalletPage({ page: pageParam, size: 20, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.last ? undefined : (lastPage?.page ?? 0) + 1),
    enabled: isAuthenticated && Boolean(user?.id),
    retry: false,
  });

  const entries = (query.data?.pages ?? []).flatMap((page) => (page.items ?? []).map(toVoucherView));

  return {
    wallet: query.data?.pages ?? [],
    entries,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? mapApiError(query.error) : '',
    fetchNextPage: query.fetchNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}

export default useVoucherWallet;
