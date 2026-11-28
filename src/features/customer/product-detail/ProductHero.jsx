import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { IconCamera, IconShieldCheck, IconShoppingBag, IconShoppingCart } from "@tabler/icons-react";
import useAuth from "../../../hooks/useAuth";
import useCart from "../cart/useCart.js";
import { buildAddIntent, readAddIntent } from "../cart/cartIntent.js";
import { mapApiError } from "../cart/cartReasons.js";
import "./ProductHero.css";

const money = (price) => `${new Intl.NumberFormat("vi-VN").format(price)}₫`;

export default function ProductHero({ product, inStock = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, generation } = useAuth();
  const cart = useCart();
  const { notice, busy: cartBusy, addItem } = cart;
  const options = Array.isArray(product?.options) ? product.options : [];
  const intent = readAddIntent(location.search);
  const restoredIndex = intent?.variantId ? options.findIndex((entry) => entry.variantId === intent.variantId) : -1;
  const restoredTarget = restoredIndex >= 0 ? options[restoredIndex] : null;
  const restoredQuantity = restoredTarget
    ? Math.min(Math.max(intent?.quantity || 1, 1), Math.min(restoredTarget.inventory || 999, 999))
    : 1;
  const [selected, setSelected] = useState(restoredIndex >= 0 ? restoredIndex : 0);
  const [quantity, setQuantity] = useState(restoredQuantity);
  const [localMessage, setLocalMessage] = useState("");
  const [localBusy, setLocalBusy] = useState(false);
  const intentHandledRef = useRef(false);
  const selectedIndex = Math.min(selected, Math.max(options.length - 1, 0));
  const option = options[selectedIndex] ?? { storage: "", price: 0, originalPrice: 0, inventory: 0, inStock: false };
  const canPurchase = Boolean(inStock && option.inStock !== false && option.inventory > 0);
  const maxQuantity = canPurchase ? option.inventory : 0;
  const displayedQuantity = canPurchase ? Math.min(Math.max(quantity, 1), maxQuantity || 1) : 1;
  const discount = option.originalPrice > option.price
    ? Math.round((1 - option.price / option.originalPrice) * 100)
    : 0;
  const message = localMessage || notice;

  useEffect(() => {
    if (!intent || intentHandledRef.current || !isAuthenticated || !option.variantId) return;
    if (intent.variantId !== option.variantId) return;
    intentHandledRef.current = true;
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (!active) return;
      setLocalBusy(true);
      try {
        await addItem({ productVariantId: option.variantId, quantity: displayedQuantity });
        if (user?.id) await queryClient.invalidateQueries({ queryKey: ["cart", user.id, generation] });
        if (active) setLocalMessage("Đã thêm sản phẩm vào giỏ hàng.");
        navigate(location.pathname, { replace: true, state: null });
      } catch (error) {
        if (active) setLocalMessage(mapApiError(error));
      } finally {
        if (active) setLocalBusy(false);
      }
    };
    void run();
    return () => { active = false; };
  }, [addItem, displayedQuantity, generation, intent, isAuthenticated, location.pathname, navigate, option.variantId, queryClient, user?.id]);

  async function handleAddToCart() {
    if (!option.variantId) {
      setLocalMessage("Sản phẩm này chưa có biến thể để thêm vào giỏ hàng.");
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          intent: buildAddIntent({
            variantId: option.variantId,
            quantity: displayedQuantity,
            pathname: location.pathname,
          }),
        },
      });
      return;
    }

    setLocalMessage("");
    setLocalBusy(true);
    try {
      await addItem({ productVariantId: option.variantId, quantity: displayedQuantity });
      if (user?.id) await queryClient.invalidateQueries({ queryKey: ["cart", user.id, generation] });
      setLocalMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      setLocalMessage(mapApiError(error));
    } finally {
      setLocalBusy(false);
    }
  }

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
        <div className="product-hero__storage" role="group" aria-label="Dung lượng bộ nhớ">{options.map((item, index) => <button type="button" key={`${item.variantId || item.storage}-${index}`} className={selectedIndex === index ? "product-hero__storage-option is-selected" : "product-hero__storage-option"} aria-pressed={selectedIndex === index} onClick={() => { setSelected(index); setLocalMessage(""); }}><strong>{item.storage}</strong><span>{money(item.price)}</span></button>)}</div>
        <div className="product-hero__stock">{canPurchase ? `✓  Còn ${option.inventory} máy · Có thể đặt hàng` : "Hết hàng"}</div>
        <div className="product-hero__option-label"><span>Số lượng:</span><span>Tối đa {maxQuantity} chiếc</span></div>
        <div className="product-hero__stepper"><button type="button" aria-label="Giảm số lượng" disabled={!canPurchase || displayedQuantity === 1} onClick={() => setQuantity(displayedQuantity - 1)}>−</button><output aria-live="polite">{displayedQuantity}</output><button type="button" aria-label="Tăng số lượng" disabled={!canPurchase || displayedQuantity >= maxQuantity} onClick={() => setQuantity(displayedQuantity + 1)}>+</button></div>
        <div className="product-hero__actions"><button type="button" className="product-hero__buy" disabled={!canPurchase} onClick={() => setLocalMessage("Đây là bản xem trước, chưa hỗ trợ đặt hàng.")}><IconShoppingBag size={18} /> MUA NGAY</button><button type="button" className="product-hero__cart" disabled={!canPurchase || localBusy || cartBusy} onClick={handleAddToCart}><IconShoppingCart size={18} /> Thêm vào giỏ hàng</button></div>
        {message && <p className="product-hero__message" role="status">{message}</p>}
      </div>
    </section>
  );
}
