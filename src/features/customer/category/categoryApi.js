import { api } from "../../../api/client";
import { categoryFilterOptions } from "../../../mocks/category";
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
  status: p.availability?.status === "IN_STOCK" ? "Sẵn hàng" : "Hết hàng",
  variantId: p.representativeVariantId,
  // brand, rating, specs: not in the listing API yet (TODO)
});

export async function getCategoryProducts({ categoryId, filters, sort, page }) {
  console.log("categoryId:", categoryId);
  const data = await api.get(
    "/api/products",
    {
      categoryId,
      brandId: filters.brands,                // array of brand UUIDs
      specFilters: buildSpecFilters(filters),
      minPrice: filters.minPrice > DEFAULT_MIN_PRICE ? String(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice < DEFAULT_MAX_PRICE ? String(filters.maxPrice) : undefined,
      sort: SORT_MAP[sort],
      page: page - 1,
      size: PAGE_SIZE,
    },
    { auth: false },
  );
  return { items: data.items.map(toProductCard), total: data.totalItems };
}

const SCREEN_RANGES = {
  "13 - 14 inch": { min: 13, max: 14.9 },
  "15 - 16 inch": { min: 15, max: 16.9 },
};

function buildSpecFilters({ minRam, cpus = [], screens = [] }) {
  const groups = [];
  if (minRam > 0)
    groups.push({ key: "physical_ram", alternatives: [{ op: "gte", value: minRam, unit: "GB" }] });
  if (cpus.length)
    groups.push({ key: "cpu_family", alternatives: cpus.slice(0, 4).map((value) => ({ op: "eq", value })) });
  if (screens.length)
    groups.push({
      key: "display_diagonal",
      alternatives: screens.map((s) => ({ op: "between", ...SCREEN_RANGES[s], unit: "inch" })),
    });
  return groups.length ? JSON.stringify(groups) : undefined;
}

export async function getFilterOptions(categoryId) {
  const [brandsRes, specsRes] = await Promise.allSettled([
    api.get("/api/brands", {}, { auth: false }),
    api.get("/api/product-filter-options", { categoryId }, { auth: false }),
  ]);
  const brands = brandsRes.status === "fulfilled" ? brandsRes.value : [];
  const specs = specsRes.status === "fulfilled" ? specsRes.value : [];
  const byKey = Object.fromEntries(specs.map((g) => [g.key, g.options]));
  return {
    brands: brands.map((b) => ({ id: b.id, name: b.name, count: b.productCount })),
    uses: [],
    ram: (byKey.physical_ram ?? []).map((o) => o.value),
    cpus: (byKey.cpu_family ?? []).map((o) => o.value),
    screens: byKey.display_diagonal ? Object.keys(SCREEN_RANGES) : [],
  };
}