import { categories, products, heroSlides, brands, discoveryPrompts } from "../../../mocks/storefront";

// TODO: replace with the shared client from src/api/ 
export async function getStorefront() {
  return { categories, products, heroSlides, brands, discoveryPrompts };
}