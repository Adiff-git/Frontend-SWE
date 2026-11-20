import { IconSearch } from "@tabler/icons-react";
import ProductCard from "./ProductCard";
import "./FeaturedProducts.css";

export default function FeaturedProducts({ brands, activeBrand, addedProducts, onAddToCart, onBrandChange, onSearchChange, products, search }) {
  return (
    <section className="featured" id="featured-products" data-node-id="3:9334" aria-labelledby="featured-title">
      <div className="featured__heading">
        <div>
          <span className="section-kicker"><span />CHẠM TECH FLAGSHIPS</span>
          <h2 className="featured__title" id="featured-title">Sản phẩm nổi bật</h2>
          <p className="featured__description">Thiết bị tinh hoa dẫn đầu thị trường với hiệu năng và độ hoàn thiện đỉnh cao.</p>
        </div>
        <div className="featured__controls">
          <label className="storefront-search">
            <IconSearch size={17} />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm sản phẩm" aria-label="Tìm sản phẩm" />
          </label>
          <div className="brand-filters" aria-label="Lọc theo thương hiệu">
            {["Tất cả", ...brands.slice(0, 2)].map((brand) => (
              <button key={brand} className={`brand-filter${activeBrand === brand ? " brand-filter--active" : ""}`} onClick={() => onBrandChange(brand)} aria-pressed={activeBrand === brand}>{brand}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="product-grid" aria-live="polite">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            added={addedProducts.includes(product.id)}
            onAddToCart={() => onAddToCart(product.id)}
            product={product}
          />
        ))}
        {products.length === 0 && <p className="featured__empty">Không tìm thấy sản phẩm phù hợp. Thử một từ khóa khác nhé.</p>}
      </div>
    </section>
  );
}
