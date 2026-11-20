import { useEffect, useState } from "react";
import { getCategoryProducts } from "./categoryApi";

export default function useCategoryProducts(category, filters, sort, page) {
  const [state, setState] = useState({
    products: [],
    total: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let ignore = false; // ignore answers from outdated requests
    setState((s) => ({ ...s, loading: true, error: null }));

    getCategoryProducts({ category, filters, sort, page })
      .then(({ items, total }) => {
        if (!ignore) setState({ products: items, total, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState((s) => ({ ...s, loading: false, error }));
      });

    return () => { ignore = true; };
  }, [category, filters, sort, page]);

  return state;

}