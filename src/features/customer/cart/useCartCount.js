import { useQuery } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import { getCart } from './cartApi';

export function useCartCount() {
  const { user, generation, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ['cart', user?.id, generation],
    queryFn: ({ signal }) => getCart({ signal }),
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 0,
    retry: false,
    select: (data) => data?.totalItemCount ?? 0,
  });

  return query.data ?? 0;
}

export default useCartCount;
