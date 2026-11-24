import { api } from "../../../api/client";
import { categories, products, heroSlides, brands, discoveryPrompts } from "../../../mocks/storefront";

export const toProductCard = (p) => ({
  id: p.id,
  name: p.name,
  image: p.primaryImageUrl,
  price: p.displayPrice ? Number(p.displayPrice.amount) : null,
  inStock: p.availability?.status === "IN_STOCK",
  variantId: p.representativeVariantId,
});

export async function getStorefront() {
  // allSettled: if the products call fails, the rest of the homepage still renders
  const [recs] = await Promise.allSettled([
    api.get("/api/recommendations", { limit: 10 }, { auth: false }),
  ]);

  const productsFailed = recs.status === "rejected";
  if (productsFailed) console.error("homepage products failed:", recs.reason);

  return {
    products: productsFailed ? [] : recs.value.items.map(toProductCard),
    productsError: productsFailed,
    // Still mock: no endpoints yet (TODO: categories, brands, banners)
    categories,
    brands,
    heroSlides,
    discoveryPrompts,
  };
}