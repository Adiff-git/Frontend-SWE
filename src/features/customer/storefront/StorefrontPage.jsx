import { useMemo, useState } from "react";
import useStorefront from "./useStorefront";
import BrandPartners from "./BrandPartners";
import CategorySection from "./CategorySection";
import DiscoveryBanner from "./DiscoveryBanner";
import FeaturedProducts from "./FeaturedProducts";
import HeroSection from "./HeroSection";
import ServiceCommitments from "./ServiceCommitments";
import StorefrontFooter from "./StorefrontFooter";
import "./StorefrontPage.css";

export default function StorefrontPage() {
  const { data, loading, error } = useStorefront();

  const [activeBrand, setActiveBrand] = useState("Tất cả");
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(2);
  const [addedProducts, setAddedProducts] = useState([]);

  const visibleProducts = useMemo(() => {
    const products = data?.products ?? [];
    const query = search.trim().toLocaleLowerCase("vi");
    return products.filter((product) => {
      const matchesBrand = activeBrand === "Tất cả" || product.brand === activeBrand;
      const matchesCategory = !activeCategory || product.category === activeCategory;
      const matchesSearch = !query || `${product.name} ${product.brand} ${product.category}`.toLocaleLowerCase("vi").includes(query);
      return matchesBrand && matchesCategory && matchesSearch;
    });
  }, [data, activeBrand, activeCategory, search]);

  function addToCart(productId) {
    setCartCount((count) => count + 1);
    setAddedProducts((current) => current.includes(productId) ? current : [...current, productId]);
  }

  function selectPrompt(prompt) {
    setSearch(prompt.includes("iPhone") ? "iPhone" : prompt.includes("iPad") ? "iPad" : "laptop");
    setActiveBrand("Tất cả");
    setActiveCategory("");
    document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth" });
  }

  function selectCategory(category) {
    setActiveCategory((current) => current === category ? "" : category);
    setActiveBrand("Tất cả");
    document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth" });
  }

  function showAllCategories() {
    setActiveCategory("");
    document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Không thể tải dữ liệu. Vui lòng thử lại.</p>;

  return (
    <div className="storefront" data-node-id="3:9206">
      <div className="storefront__content">
        <HeroSection slides={data.heroSlides} onAddToCart={addToCart} />
        <CategorySection categories={data.categories} activeCategory={activeCategory} onSelectCategory={selectCategory} onShowAll={showAllCategories} />
        <FeaturedProducts
          brands={data.brands}
          activeBrand={activeBrand}
          addedProducts={addedProducts}
          onAddToCart={addToCart}
          onBrandChange={(brand) => { setActiveBrand(brand); setActiveCategory(""); }}
          onSearchChange={setSearch}
          products={visibleProducts}
          search={search}
        />
        <DiscoveryBanner discoveryPrompts={data.discoveryPrompts} onSelectPrompt={selectPrompt} />
        <BrandPartners brands={data.brands} />
        <ServiceCommitments />
      </div>
      <StorefrontFooter />
      <span className="visually-hidden" aria-live="polite">Giỏ hàng có {cartCount} sản phẩm</span>
    </div>
  );
}
