import { IconCheck, IconTrash } from '@tabler/icons-react';
import VariantPicker from './VariantPicker.jsx';
import { useState } from 'react';
import './CartItem.css';

export default function CartItem({
  item,
  busy = false,
  variants = [],
  onToggle,
  onQuantityChange,
  onVariantRequest,
  onVariantChange,
  onRemove,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const incrementDisabled = busy || item.quantity >= 999
    || Boolean(item.availability && item.quantity >= item.availability.availableQuantity && !item.purchasable);

  function openPicker() {
    setPickerOpen((open) => !open);
    if (!pickerOpen) onVariantRequest?.(item.productId);
  }

  return (
    <article className="cart-item">
      <label className="cart-item__select">
        <input
          type="checkbox"
          checked={item.selected}
          disabled={!item.purchasable || busy}
          onChange={onToggle}
        />
        <span className="cart-items__checkbox"><IconCheck size={14} /></span>
        <span>Chọn</span>
      </label>

      {item.image ? (
        <img className="cart-item__image" src={item.image} alt={item.name} />
      ) : (
        <div className="cart-item__image cart-item__image--empty" aria-label="Không có ảnh sản phẩm" />
      )}

      <div className="cart-item__details">
        <h2>{item.name}</h2>
        {item.options && <p>{item.options}</p>}
        <span className="cart-item__sku">SKU: {item.sku}</span>
        {!item.purchasable && item.availabilityReason && (
          <p className="cart-item__reason">{item.availabilityReason}</p>
        )}

        <div className="cart-item__actions">
          <div className="cart-item__prices">
            <strong>{item.unitPriceDisplay}</strong>
            <span>Thành tiền: {item.subtotalDisplay}</span>
          </div>
          <div className="cart-item__quantity">
            <button
              type="button"
              aria-label={`Giảm số lượng ${item.name}`}
              disabled={busy || item.quantity <= 1}
              onClick={() => onQuantityChange?.(item.id, item.quantity - 1)}
            >
              −
            </button>
            <output>{item.quantity}</output>
            <button
              type="button"
              aria-label={`Tăng số lượng ${item.name}`}
              disabled={incrementDisabled}
              onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
            >
              +
            </button>
          </div>
          <button
            className="cart-item__remove"
            type="button"
            aria-label={`Xóa ${item.name}`}
            disabled={busy}
            onClick={() => onRemove?.(item.id)}
          >
            <IconTrash size={18} />
          </button>
        </div>

        {item.productId && (
          <div className="cart-item__variant">
            <button type="button" disabled={busy} onClick={openPicker}>
              {pickerOpen ? 'Đóng danh sách biến thể' : 'Đổi biến thể'}
            </button>
            {pickerOpen && (
              <VariantPicker
                item={item}
                variants={variants}
                busy={busy}
                onSelect={(variantId) => {
                  onVariantChange?.({ itemId: item.id, productVariantId: variantId });
                  setPickerOpen(false);
                }}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
