import "./ProductReviews.css";

const starText = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

export default function ProductReviews({ reviews = [], summary, distribution = [], sectionErrors }) {
  const score = summary?.score ?? "Chưa có đánh giá";
  const count = summary?.count ?? "0";
  const purchased = summary?.purchased ?? "0";
  const withPhotos = summary?.withPhotos ?? "0";
  const numericScore = Number.parseFloat(score);
  const hasScore = Number.isFinite(numericScore);

  return <section className="product-reviews" data-node-id="299:1760">
    <p className="product-detail__eyebrow">ĐÁNH GIÁ SẢN PHẨM</p>
    <h2 className="product-detail__section-title">Đánh giá từ khách hàng</h2>
    <p className="product-reviews__intro">Điểm số và nhận xét dưới đây là nội dung minh họa cho thiết kế.</p>
    {sectionErrors?.rating && <p className="product-reviews__intro" role="status">Không thể tải điểm đánh giá. Vui lòng thử lại sau.</p>}
    {sectionErrors?.reviews && <p className="product-reviews__intro" role="status">Không thể tải danh sách đánh giá. Vui lòng thử lại sau.</p>}
    <div className="product-reviews__summary" data-node-id="299:1766"><div className="product-reviews__summary-row"><div className="product-reviews__score"><strong>{score}</strong><span className="product-reviews__stars" aria-label={hasScore ? `${score} sao` : "Chưa có đánh giá"}>{hasScore ? "★★★★★" : "—"}</span><b>Đánh giá trung bình</b></div><div className="product-reviews__distribution">{distribution.map((row) => <div className="product-reviews__distribution-row" key={row.stars}><b>{row.stars}</b><div className="product-reviews__track"><div style={{ width: row.width }} /></div><span>{row.count}</span></div>)}</div></div><div className="product-reviews__stats"><div><span>Đánh giá</span><strong>{count}</strong></div><div><span>Đã mua</span><strong>{purchased}</strong></div><div><span>Đánh giá có ảnh</span><strong>{withPhotos}</strong></div></div></div>
    <div className="product-reviews__list">{reviews.map((review) => <article className="product-reviews__card" key={`${review.name}-${review.time}`}><div className="product-reviews__card-header"><div className="product-reviews__author"><span className="product-reviews__avatar">{review.initials}</span><div><strong>{review.name}</strong><span>{review.time}</span></div></div><span className="product-reviews__stars" aria-label={`${review.rating} sao`}>{starText(review.rating)}</span></div><h3>{review.title}</h3><p>{review.text}</p>{review.photos?.length > 0 && <div className="product-reviews__photos">{review.photos.filter(Boolean).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`Ảnh sản phẩm từ khách hàng ${index + 1}`} />)}</div>}</article>)}</div>
  </section>;
}
