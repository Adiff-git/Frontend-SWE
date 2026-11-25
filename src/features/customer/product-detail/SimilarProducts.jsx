import ProductCard from "../storefront/ProductCard.jsx";

export default function SimilarProducts({ products = [], sectionErrors }) {
  return <section className="product-similar" data-node-id="299:1840">
    <p className="product-detail__eyebrow">GỢI Ý CHO BẠN</p>
    <h2 className="product-detail__section-title">Sản phẩm tương tự</h2>
    {sectionErrors?.similar && <p className="product-reviews__intro" role="status">Không thể tải sản phẩm tương tự. Vui lòng thử lại sau.</p>}
    <div className="product-highlights__grid">{products.map((product) => <ProductCard key={product.id} product={{ ...product, image: product.image ?? "" }} onAddToCart={() => undefined} />)}</div>
  </section>;
}
