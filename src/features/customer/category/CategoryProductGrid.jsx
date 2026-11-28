import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../hooks/useAuth";
import { addCartItem } from "../cart/cartApi";
import { mapApiError } from "../cart/cartReasons";
import ProductCard from "../storefront/ProductCard.jsx";
import "./CategoryProductGrid.css";

const formatVnd = (value) => `${new Intl.NumberFormat("vi-VN").format(value)}₫`;

export default function CategoryProductGrid({ products }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, generation } = useAuth();
  const [addedProducts, setAddedProducts] = useState([]);
  const [addingProductId, setAddingProductId] = useState(null);
  const [message, setMessage] = useState("");

  async function addToCart(product) {
    if (!product?.variantId) {
      setMessage("Sản phẩm chưa có biến thể để thêm vào giỏ hàng.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setMessage("");
    setAddingProductId(product.id);
    try {
      await addCartItem({ productVariantId: product.variantId, quantity: 1 });
      setAddedProducts((current) => current.includes(product.id) ? current : [...current, product.id]);
      if (user?.id) await queryClient.invalidateQueries({ queryKey: ["cart", user.id, generation] });
    } catch (error) {
      setMessage(mapApiError(error));
    } finally {
      setAddingProductId(null);
    }
  }

  return (
    <div className="category-product-grid" aria-live="polite">
      {message && <p className="category-product-grid__message" role="status">{message}</p>}
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{ ...product, price: formatVnd(product.price), oldPrice: product.oldPrice ? formatVnd(product.oldPrice) : null, colors: [], colorName: "" }}
          added={addedProducts.includes(product.id)}
          adding={addingProductId === product.id}
          onAddToCart={addToCart}
        />
      ))}
      {products.length === 0 && <p className="category-product-grid__empty">Không tìm thấy sản phẩm phù hợp với bộ lọc này.</p>}
    </div>
  );
}
