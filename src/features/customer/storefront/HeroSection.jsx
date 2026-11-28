import { useState } from "react";
import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import "./HeroSection.css";

export default function HeroSection({ slides, products = [], onAddToCart }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  if (!slide) return null;

  const mappedProduct = products.find((product) => product.id === slide.productId);

  return (
    <section className="hero" data-node-id="3:9209" aria-label="Sản phẩm nổi bật">
      <div className="hero__copy">
        <div className="hero__eyebrow-row">
          <span className="hero__badge"><IconSparkles size={14} stroke={1.8} />{slide.badge}</span>
          <span className="hero__series">{slide.eyebrow}</span>
        </div>
        <h1 className="hero__title">{slide.title}</h1>
        <p className="hero__subtitle">{slide.subtitle}</p>
        <p className="hero__description">{slide.description}</p>
        <div className="hero__price-line">
          <span className="hero__price-label">Giá khởi điểm từ</span>
          <strong className="hero__price">{slide.price}</strong>
          {slide.oldPrice && <del className="hero__old-price">{slide.oldPrice}</del>}
          {slide.discount && <span className="hero__discount">{slide.discount}</span>}
        </div>
        <div className="hero__actions">
          <button
            className="storefront-button storefront-button--primary"
            type="button"
            disabled={!mappedProduct?.variantId}
            onClick={() => mappedProduct && onAddToCart(mappedProduct)}
          >
            Chọn mua <IconArrowRight size={17} />
          </button>
          <a className="storefront-button storefront-button--soft" href="#featured-products">Khám phá thông số</a>
        </div>
      </div>
      <div className="hero__visual">
        <img className="hero__image" src={slide.image} alt={slide.title} />
        <div className="hero__feature">
          <span className="hero__feature-icon"><IconSparkles size={18} /></span>
          <span><small>HIỆU NĂNG</small><strong>{slide.feature}</strong></span>
        </div>
      </div>
      <div className="hero__pagination" aria-label="Chọn sản phẩm nổi bật">
        {slides.map((item, index) => (
          <button
            key={item.productId}
            className={`hero__dot${index === activeSlide ? " hero__dot--active" : ""}`}
            aria-label={`Xem ${item.title}`}
            aria-pressed={index === activeSlide}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
