import { IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";
import "./ActiveFilterBar.css";

export default function ActiveFilterBar({ chips, onClearAll }) {
  return (
    <section className="category-active-filters" data-node-id="299:436" aria-label="Bộ lọc đang áp dụng">
      <span className="category-active-filters__label"><IconAdjustmentsHorizontal size={14} />ĐANG LỌC:</span>
      <div className="category-active-filters__chips">
        {chips.map((chip) => (
          <button className="category-filter-chip" key={chip.key} onClick={chip.onRemove}>
            {chip.label}<IconX size={13} aria-hidden="true" />
          </button>
        ))}
      </div>
      <button className="category-active-filters__clear" onClick={onClearAll}><IconX size={14} />Xoá tất cả</button>
    </section>
  );
}
