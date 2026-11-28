import { Link } from "react-router-dom";
import "./ProductCard.css";

export default function ProductCard({ added, adding = false, onAddToCart, product }) {
  const productId = product?.id;
  const detailPath = productId ? `/products/${productId}` : null;
  const canAdd = Boolean(product?.variantId) && product?.inStock !== false;

  function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!canAdd || adding) return;
    onAddToCart?.(product);
  }

  const content = (
    <>
      <div className="product-card__topline">
        {product.badge && <span className={`product-card__badge${product.badge.startsWith("-") ? " product-card__badge--sale" : ""}`}>{product.badge}</span>}
      </div>
      <div className="product-card__image-wrap">
        {product.image ? <img className="product-card__image" src={product.image} alt={product.name} /> : <div className="product-card__image-placeholder" aria-hidden="true" />}
      </div>
      {product.colors?.length > 0 && (
        <div className="product-card__swatches" aria-label={product.colorName}>
          {product.colors.map((color, index) => (
            <span className="product-card__swatch" key={color} style={{ backgroundColor: color }} aria-label={`Màu ${index + 1}`} />
          ))}
          {product.colorName && <span className="product-card__color-name">{product.colorName}</span>}
        </div>
      )}
      <h3 className="product-card__name">{product.name}</h3>
      {product.specs?.length > 0 && (
        <div className="product-card__specs">
          {product.specs.map((spec) => <span key={spec}>{spec}</span>)}
        </div>
      )}
      <div className="product-card__price-row">
        <strong>{product.price ?? "Liên hệ"}</strong>
        {product.oldPrice ? <del>{product.oldPrice}</del> : <span className="product-card__stock">{product.status}</span>}
      </div>
    </>
  );

  return (
    <article className="product-card">
      {detailPath ? <Link className="product-card__link" to={detailPath}>{content}</Link> : <div className="product-card__link">{content}</div>}
      <button
        className="product-card__buy"
        type="button"
        onClick={handleAddToCart}
        disabled={!canAdd || adding}
        aria-disabled={!canAdd || adding}
      >
        {adding ? "Đang thêm..." : added ? "Đã thêm vào giỏ" : !canAdd ? "Hết hàng" : "Chọn mua"}
      </button>
    </article>
  );
}
