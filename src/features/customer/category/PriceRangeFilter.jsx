import { useId } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import "./PriceRangeFilter.css";

const MIN_PRICE = 15000000;
const MAX_PRICE = 100000000;
const STEP = 5000000;

const formatVnd = (value) => new Intl.NumberFormat("vi-VN").format(value);

export default function PriceRangeFilter({ filters, onChange }) {
  const titleId = useId();

  function changeMin(value) {
    onChange("minPrice", Math.min(Number(value), filters.maxPrice - STEP));
  }

  function changeMax(value) {
    onChange("maxPrice", Math.max(Number(value), filters.minPrice + STEP));
  }

  return (
    <div className="category-price-filter" role="group" aria-labelledby={titleId}>
      <div className="category-price-filter__header">
        <h3 id={titleId} className="category-price-filter__title">Khoảng giá</h3>
        <button className="category-price-filter__custom" type="button">
          Tùy biến <IconChevronDown size={13} />
        </button>
      </div>

      <div className="category-price-filter__ranges">
        <label>
          <span>TỪ</span>
          <strong>{formatVnd(filters.minPrice)}₫</strong>
          <input
            aria-label="Giá thấp nhất"
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={STEP}
            value={filters.minPrice}
            onChange={(event) => changeMin(event.target.value)}
          />
        </label>
        <label>
          <span>ĐẾN</span>
          <strong>{formatVnd(filters.maxPrice)}₫</strong>
          <input
            aria-label="Giá cao nhất"
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={STEP}
            value={filters.maxPrice}
            onChange={(event) => changeMax(event.target.value)}
          />
        </label>
      </div>

      <div className="category-price-filter__endpoints">
        <span>{formatVnd(MIN_PRICE)}₫</span>
        <span>{formatVnd(MAX_PRICE)}₫</span>
      </div>
    </div>
  );
}