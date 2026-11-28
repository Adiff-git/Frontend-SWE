import { useEffect, useState } from "react";
import { getCategoryProducts } from "./categoryApi";

export default function useCategoryProducts(category, filters, sort, page) {
  const [state, setState] = useState(() => ({
    category,
    filters,
    sort,
    page,
    products: [],
    total: 0,
    loading: true,
    error: null,
  }));

  useEffect(() => {
    let ignore = false;

    getCategoryProducts({ category, filters, sort, page })
      .then(({ items, total }) => {
        if (!ignore) setState({ category, filters, sort, page, products: items, total, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState({ category, filters, sort, page, products: [], total: 0, loading: false, error });
      });

    return () => { ignore = true; };
  }, [category, filters, sort, page]);

  const isCurrent = state.category === category && state.filters === filters && state.sort === sort && state.page === page;

  return {
    products: isCurrent ? state.products : [],
    total: isCurrent ? state.total : 0,
    loading: !isCurrent || state.loading,
    error: isCurrent ? state.error : null,
  };
}
