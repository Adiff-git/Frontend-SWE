import { IconChevronDown, IconSparkles } from "@tabler/icons-react";
import "./CategoryHeading.css";

export default function CategoryHeading({ sortBy, onSortChange }) {
  return (
    <section className="category-heading" data-node-id="299:415">
      <div className="category-heading__copy">
        <div className="category-heading__eyebrow-row">
          <span className="category-heading__eyebrow"><IconSparkles size={13} />FLAGSHIP HARDWARE</span>
          <span className="category-heading__trust">Ủy quyền chính hãng</span>
        </div>
        <h1 className="category-heading__title">Laptop cao cấp <span>(128 sản phẩm)</span></h1>
      </div>
      <label className="category-sort">
        <span>Sắp xếp theo:</span>
        <span className="category-sort__control">
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value)} aria-label="Sắp xếp sản phẩm">
            <option value="popular">Phổ biến nhất</option>
            <option value="price-low">Giá thấp đến cao</option>
            <option value="price-high">Giá cao đến thấp</option>
          </select>
          <IconChevronDown size={15} />
        </span>
      </label>
    </section>
  );
}
