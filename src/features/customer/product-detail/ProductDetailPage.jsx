import { Link, useParams } from "react-router-dom";
import "../storefront/StorefrontPage.css";
import "./ProductDetailPage.css";
import useProductDetail from "./useProductDetail.js";
import ProductHero from "./ProductHero.jsx";
import ProductHighlights from "./ProductHighlights.jsx";
import ProductSpecifications from "./ProductSpecifications.jsx";
import ProductReviews from "./ProductReviews.jsx";
import SimilarProducts from "./SimilarProducts.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data, loading, notFound, error, sectionErrors, retry } = useProductDetail(id);

  if (loading) {
    return <div className="storefront product-detail" data-node-id="299:1383">
      <div className="product-detail__container">
        <p className="product-detail__state" role="status">Đang tải sản phẩm…</p>
      </div>
    </div>;
  }

  if (notFound) {
    return <div className="storefront product-detail" data-node-id="299:1383">
      <div className="product-detail__container">
        <div className="product-detail__state" role="alert">
          <p>Không tìm thấy sản phẩm.</p>
          <Link to="/products">Quay lại danh sách sản phẩm</Link>
        </div>
      </div>
    </div>;
  }

  if (error || !data) {
    return <div className="storefront product-detail" data-node-id="299:1383">
      <div className="product-detail__container">
        <div className="product-detail__state" role="alert">
          <p>Không thể tải sản phẩm. Vui lòng thử lại.</p>
          <button type="button" onClick={retry}>Thử lại</button>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="storefront product-detail" data-node-id="299:1383">
      <div className="product-detail__container">
        <div className="product-detail__breadcrumb" data-node-id="299:1408">
          <div aria-label="Đường dẫn">Trang chủ <span>›</span> Điện thoại <span>›</span> Apple iPhone <span>›</span> <strong>{data.product.name}</strong></div>
          <div className="product-detail__availability"><span>● Kho máy Flagship sẵn hàng</span><span> / </span> Chính Hãng VN/A (Apple Store Authorized)</div>
        </div>
        <ProductHero product={data.product} inStock={data.inStock} />
        <ProductHighlights highlights={data.highlights} />
        <ProductSpecifications specifications={data.specifications} />
        <ProductReviews reviews={data.reviews} summary={data.summary} distribution={data.distribution} sectionErrors={sectionErrors} />
        <SimilarProducts products={data.similarProducts} sectionErrors={sectionErrors} />
      </div>
    </div>
  );
}
