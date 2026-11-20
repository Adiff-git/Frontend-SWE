import { useState } from "react";
import ProductCard from "../storefront/ProductCard.jsx";
import "./CategoryProductGrid.css";

const formatVnd = (value) => `${new Intl.NumberFormat("vi-VN").format(value)}₫`;

export default function CategoryProductGrid({ products }) {
  const [addedProducts, setAddedProducts] = useState([]);

  function addToCart(productId) {
    setAddedProducts((current) => current.includes(productId) ? current : [...current, productId]);
  }

  return (
    <div className="category-product-grid" aria-live="polite">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{ ...product, price: formatVnd(product.price), oldPrice: product.oldPrice ? formatVnd(product.oldPrice) : null, colors: [], colorName: "" }}
          added={addedProducts.includes(product.id)}
          onAddToCart={() => addToCart(product.id)}
        />
      ))}
      {products.length === 0 && <p className="category-product-grid__empty">Không tìm thấy sản phẩm phù hợp với bộ lọc này.</p>}
    </div>
  );
}
