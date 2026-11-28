import { IconCheck } from '@tabler/icons-react';
import CartItem from './CartItem.jsx';
import './CartItems.css';

export default function CartItems({
  cart,
  busy = false,
  variantOptions = {},
  onToggleItem,
  onToggleAll,
  onUpdateQuantity,
  onVariantRequest,
  onVariantChange,
  onRemoveItem,
  onRemoveSelected,
}) {
  const items = cart.items ?? [];
  const purchasableItems = items.filter((item) => item.purchasable);
  const selectedPurchasable = purchasableItems.filter((item) => item.selected);
  const allSelected = purchasableItems.length > 0 && selectedPurchasable.length === purchasableItems.length;

  return (
    <section className="cart-items" data-node-id="299:284">
      <div className="cart-items__toolbar" data-node-id="299:285">
        <label className="cart-items__select-all">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={busy || purchasableItems.length === 0}
            onChange={() => onToggleAll?.(!allSelected)}
          />
          <span className="cart-items__checkbox"><IconCheck size={14} /></span>
          <span>Chọn tất cả ({items.length} món)</span>
        </label>
        <button
          className="cart-items__clear"
          type="button"
          disabled={busy || selectedPurchasable.length === 0}
          onClick={() => onRemoveSelected?.(selectedPurchasable.map((item) => item.id))}
        >
          Xóa sản phẩm đã chọn
        </button>
      </div>
      <div className="cart-items__list">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            busy={busy}
            variants={variantOptions[item.productId] ?? []}
            onToggle={() => onToggleItem?.({ itemId: item.id, selected: !item.selected })}
            onQuantityChange={(itemId, quantity) => onUpdateQuantity?.({ itemId, quantity })}
            onVariantRequest={onVariantRequest}
            onVariantChange={onVariantChange}
            onRemove={(itemId) => onRemoveItem?.({ itemId })}
          />
        ))}
      </div>
    </section>
  );
}
