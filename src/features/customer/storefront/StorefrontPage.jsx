import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../hooks/useAuth";
import { addCartItem } from "../cart/cartApi";
import { mapApiError } from "../cart/cartReasons";
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
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, generation } = useAuth();

  const [activeBrand, setActiveBrand] = useState("Tất cả");
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartMessage, setCartMessage] = useState("");

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

  async function addToCart(product) {
    if (!product?.variantId) {
      setCartMessage("Sản phẩm chưa có biến thể để thêm vào giỏ hàng.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setCartMessage("");
    setAddingProductId(product.id);
    try {
      await addCartItem({ productVariantId: product.variantId, quantity: 1 });
      setAddedProducts((current) => current.includes(product.id) ? current : [...current, product.id]);
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ["cart", user.id, generation] });
      }
    } catch (requestError) {
      setCartMessage(mapApiError(requestError));
    } finally {
      setAddingProductId(null);
    }
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
        <HeroSection slides={data.heroSlides} products={data.products} onAddToCart={addToCart} />
        <CategorySection categories={data.categories} activeCategory={activeCategory} onSelectCategory={selectCategory} onShowAll={showAllCategories} />
        {cartMessage && <p className="storefront__cart-message" role="status">{cartMessage}</p>}
        <FeaturedProducts
          brands={data.brands}
          activeBrand={activeBrand}
          addedProducts={addedProducts}
          addingProductId={addingProductId}
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
    </div>
  );
}
