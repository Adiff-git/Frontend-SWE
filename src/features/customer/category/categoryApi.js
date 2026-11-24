import { api } from "../../../api/client";
import { categoryProducts, categoryFilterOptions } from "../../../mocks/category";
import { initialCategoryFilters } from "./categoryDefault";

const SORT_MAP = { "price-low": "price-asc", "price-high": "price-desc" };
const PAGE_SIZE = 20;

const DEFAULT_MIN_PRICE = initialCategoryFilters.minPrice; // 15000000
const DEFAULT_MAX_PRICE = initialCategoryFilters.maxPrice; // 100000000

const toProductCard = (p) => ({
  id: p.id,
  name: p.name,
  image: p.primaryImageUrl,
  price: p.displayPrice ? Number(p.displayPrice.amount) : null,
  inStock: p.availability?.status === "IN_STOCK",
  variantId: p.representativeVariantId,
  // brand, rating, specs: not in the listing API yet (TODO)
});

export async function getCategoryProducts({ categoryId, filters, sort, page }) {
  const data = await api.get(
    "/api/products",
    {
      categoryId,
      minPrice: filters.minPrice > DEFAULT_MIN_PRICE ? String(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice < DEFAULT_MAX_PRICE ? String(filters.maxPrice) : undefined,
      sort: SORT_MAP[sort],
      page: page - 1, // backend is 0-based
      size: PAGE_SIZE,
    },
    { auth: false },
  );

  return { items: data.items.map(toProductCard), total: data.totalItems };
}

export async function getFilterOptions(category) { // still mocks
  return categoryFilterOptions;
}