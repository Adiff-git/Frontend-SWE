import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../hooks/useAuth";
import { addCartItem } from "../cart/cartApi";
import { mapApiError } from "../cart/cartReasons";
import ProductCard from "../storefront/ProductCard.jsx";

export default function SimilarProducts({ products = [], sectionErrors }) {
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

  return <section className="product-similar" data-node-id="299:1840">
    <p className="product-detail__eyebrow">GỢI Ý CHO BẠN</p>
    <h2 className="product-detail__section-title">Sản phẩm tương tự</h2>
    {sectionErrors?.similar && <p className="product-reviews__intro" role="status">Không thể tải sản phẩm tương tự. Vui lòng thử lại sau.</p>}
    {message && <p className="product-reviews__intro" role="status">{message}</p>}
    <div className="product-highlights__grid">{products.map((product) => <ProductCard key={product.id} product={{ ...product, image: product.image ?? "" }} added={addedProducts.includes(product.id)} adding={addingProductId === product.id} onAddToCart={addToCart} />)}</div>
  </section>;
}
