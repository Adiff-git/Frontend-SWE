import './VariantPicker.css';

export default function VariantPicker({ item, variants = [], busy = false, onSelect }) {
  return (
    <div className="variant-picker" role="group" aria-label={`Chọn biến thể cho ${item.name}`}>
      {variants.length === 0 ? (
        <p>Đang tải các biến thể...</p>
      ) : (
        variants.map((variant) => (
          <button
            key={variant.variantId}
            type="button"
            className="variant-picker__option"
            disabled={busy || variant.variantId === item.variantId}
            aria-pressed={variant.variantId === item.variantId}
            onClick={() => onSelect?.(variant.variantId)}
          >
            <strong>{variant.storage}</strong>
            <span>{variant.priceDisplay ?? variant.price}</span>
          </button>
        ))
      )}
    </div>
  );
}
