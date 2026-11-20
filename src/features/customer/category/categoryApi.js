import { categoryProducts, categoryFilterOptions } from "../../../mocks/category";

export async function getCategoryProducts({ category, filters, sort, page }) {
  const filtered = categoryProducts.filter((product) =>
    (!filters.brands.length || filters.brands.includes(product.brand)) &&
    product.price >= filters.minPrice &&
    product.price <= filters.maxPrice &&
    (!filters.uses.length || filters.uses.some((use) => product.use.includes(use))) &&
    product.ramGB >= filters.minRam &&
    (!filters.cpus.length || filters.cpus.includes(product.cpu)) &&
    (!filters.screens.length || filters.screens.includes(product.screen))
  );

  let items = filtered;
  if (sort === "price-low") items = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price-high") items = [...filtered].sort((a, b) => b.price - a.price);

  return { items, total: items.length };
}

export async function getFilterOptions(category) {
  return categoryFilterOptions;
}