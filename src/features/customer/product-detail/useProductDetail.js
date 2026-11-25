import { useCallback, useEffect, useState } from 'react';
import { getProductDetailData } from './productDetailApi.js';
import * as mock from "../../../mocks/product-detail";

const EMPTY_SECTION_ERRORS = { reviews: false, rating: false, similar: false };

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
const mockViewModel = {
  product: { ...mock.product, inStock: true },
  inStock: true,
  highlights: mock.highlights,
  specifications: mock.specifications,
  reviews: mock.reviews,
  summary: mock.summary,           // only if your mock file exports it
  distribution: mock.distribution, // same
  similarProducts: mock.similarProducts ?? [],
  reviewCount: mock.reviews.length,
  averageRating: null,
};

function initialState(id, nonce = 0) {
  return {
    id,
    nonce,
    data: null,
    loading: true,
    notFound: false,
    error: null,
    sectionErrors: EMPTY_SECTION_ERRORS,
  };
}

export default function useProductDetail(id) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState(() => initialState(id));

  useEffect(() => {
    if (USE_MOCKS) return; // mock mode: no network
    let ignore = false;
    const controller = new AbortController();

    getProductDetailData(id, { signal: controller.signal })
      .then(({ data, sectionErrors }) => {
        if (!ignore) setState({ id, nonce, data, loading: false, notFound: false, error: null, sectionErrors });
      })
      .catch((error) => {
        if (ignore || error?.name === 'AbortError') return;
        const notFound = error?.status === 404;
        setState({
          id,
          nonce,
          data: null,
          loading: false,
          notFound,
          error: notFound ? null : error,
          sectionErrors: EMPTY_SECTION_ERRORS,
        });
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, nonce]);

  const retry = useCallback(() => setNonce((value) => value + 1), []);

  if (USE_MOCKS) {
    return {
      data: mockViewModel,
      loading: false,
      notFound: false,
      error: null,
      sectionErrors: EMPTY_SECTION_ERRORS,
      retry,
    };
  }

  const isCurrent = state.id === id && state.nonce === nonce;

  return {
    data: isCurrent ? state.data : null,
    loading: !isCurrent || state.loading,
    notFound: isCurrent && state.notFound,
    error: isCurrent ? state.error : null,
    sectionErrors: isCurrent ? state.sectionErrors : EMPTY_SECTION_ERRORS,
    retry,
  };
}
