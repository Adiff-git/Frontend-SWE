import { useState } from "react";
import { IconCamera, IconShieldCheck, IconShoppingBag, IconShoppingCart } from "@tabler/icons-react";
import "./ProductHero.css";

const money = (price) => `${new Intl.NumberFormat("vi-VN").format(price)}₫`;

export default function ProductHero({ product, inStock = true }) {
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const options = Array.isArray(product?.options) ? product.options : [];
  const selectedIndex = Math.min(selected, Math.max(options.length - 1, 0));
  const option = options[selectedIndex] ?? { storage: "", price: 0, originalPrice: 0, inventory: 0, inStock: false };
  const canPurchase = Boolean(inStock && option.inStock !== false && option.inventory > 0);
  const maxQuantity = canPurchase ? option.inventory : 0;
  const displayedQuantity = canPurchase ? Math.min(Math.max(quantity, 1), maxQuantity || 1) : 1;
  const discount = option.originalPrice > option.price
    ? Math.round((1 - option.price / option.originalPrice) * 100)
    : 0;

  return (
    <section className="product-hero" data-node-id="299:1433">
      <div className="product-hero__media">
        <div className="product-hero__image-frame" data-node-id="299:1436">
          <div className="product-hero__badges"><span>CHÍNH HÃNG VN/A</span><span><IconShieldCheck size={15} /> Bảo hành 12 tháng</span></div>
          <img src={product?.image ?? ""} alt={`${product?.name ?? "Sản phẩm"} ${product?.color ?? ""}`.trim()} onError={(event) => { event.currentTarget.hidden = true; }} />
          <span className="product-hero__image-label"><IconCamera size={16} /> Ảnh chi tiết sản phẩm</span>
        </div>
        <div className="product-hero__media-footer" />
      </div>
      <div className="product-hero__purchase" data-node-id="299:1492">
        <div className="product-hero__meta"><span>APPLE INC. · FLAGSHIP PRO</span><span>SKU: {product?.sku}</span></div>
        <h1>{product?.name} {option.storage}</h1>
        <div className="product-hero__price"><div><strong>{money(option.price)}</strong><del>{money(option.originalPrice)}</del><span>-{discount}%</span></div><small>✓ &nbsp; Giá đã bao gồm VAT</small></div>
        <div className="product-hero__option-label"><span>Màu sắc hoàn thiện:</span><strong>{product?.color}</strong></div>
        <button className="product-hero__swatch" aria-label={product?.color} aria-pressed="true" />
        <div className="product-hero__option-label"><span>Dung lượng bộ nhớ:</span></div>
        <div className="product-hero__storage" role="group" aria-label="Dung lượng bộ nhớ">{options.map((item, index) => <button type="button" key={`${item.storage}-${index}`} className={selectedIndex === index ? "product-hero__storage-option is-selected" : "product-hero__storage-option"} aria-pressed={selectedIndex === index} onClick={() => { setSelected(index); setMessage(""); }}><strong>{item.storage}</strong><span>{money(item.price)}</span></button>)}</div>
        <div className="product-hero__stock">{canPurchase ? `✓  Còn ${option.inventory} máy · Có thể đặt hàng` : "Hết hàng"}</div>
        <div className="product-hero__option-label"><span>Số lượng:</span><span>Tối đa {maxQuantity} chiếc</span></div>
        <div className="product-hero__stepper"><button type="button" aria-label="Giảm số lượng" disabled={!canPurchase || displayedQuantity === 1} onClick={() => setQuantity(displayedQuantity - 1)}>−</button><output aria-live="polite">{displayedQuantity}</output><button type="button" aria-label="Tăng số lượng" disabled={!canPurchase || displayedQuantity >= maxQuantity} onClick={() => setQuantity(displayedQuantity + 1)}>+</button></div>
        <div className="product-hero__actions"><button type="button" className="product-hero__buy" disabled={!canPurchase} onClick={() => setMessage("Đây là bản xem trước, chưa hỗ trợ đặt hàng.")}><IconShoppingBag size={18} /> MUA NGAY</button><button type="button" className="product-hero__cart" disabled={!canPurchase} onClick={() => setMessage("Đây là bản xem trước, chưa hỗ trợ giỏ hàng.")}><IconShoppingCart size={18} /> Thêm vào giỏ hàng</button></div>
        {message && <p className="product-hero__message" role="status">{message}</p>}
      </div>
    </section>
  );
}
