import "./ProductCard.css";

export default function ProductCard({ added, onAddToCart, product }) {
  return (
    <article className="product-card">
      <div className="product-card__topline">
        {product.badge && <span className={`product-card__badge${product.badge.startsWith("-") ? " product-card__badge--sale" : ""}`}>{product.badge}</span>}
      </div>
      <div className="product-card__image-wrap">
        <img className="product-card__image" src={product.image} alt={product.name} />
      </div>
      <div className="product-card__swatches" aria-label={product.colorName}>
        {product.colors.map((color, index) => <span className="product-card__swatch" key={color} style={{ backgroundColor: color }} aria-label={`Màu ${index + 1}`} />)}
        <span className="product-card__color-name">{product.colorName}</span>
      </div>
      <h3 className="product-card__name">{product.name}</h3>
      <div className="product-card__specs">
        {product.specs.map((spec) => <span key={spec}>{spec}</span>)}
      </div>
      <div className="product-card__price-row">
        <strong>{product.price}</strong>
        {product.oldPrice ? <del>{product.oldPrice}</del> : <span className="product-card__stock">{product.status}</span>}
      </div>
      <button className="product-card__buy" onClick={onAddToCart}>
        {added ? "Đã thêm vào giỏ" : "Chọn mua"}
      </button>
    </article>
  );
}
