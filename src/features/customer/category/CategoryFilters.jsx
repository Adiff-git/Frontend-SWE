import { IconArrowDown, IconDeviceLaptop, IconFilter } from "@tabler/icons-react";
import FilterCheckGroup from "./FilterCheckGroup.jsx";
import FilterToggleGroup from "./FilterToggleGroup.jsx";
import PriceRangeFilter from "./PriceRangeFilter.jsx";
import "./CategoryFilters.css";

export default function CategoryFilters({ options, count, filters, onChange, onApply }) {
  if (!options) return null;

  return (
    <aside className="category-filter-panel" data-node-id="299:463" aria-label="Bộ lọc thông số">
      <div className="category-filter-panel__heading">
        <span className="category-filter-panel__heading-icon"><IconFilter size={18} /></span>
        <h2>Bộ lọc thông số</h2>
        <span className="category-filter-panel__count">{count} áp dụng</span>
      </div>
      <FilterCheckGroup
        title="Thương hiệu"
        filterKey="brands"
        items={options?.brands.map(({ name, count: itemCount }) => ({ value: name, label: name, count: itemCount }))}
        selected={filters.brands}
        onChange={onChange}
      />
      <PriceRangeFilter filters={filters} onChange={onChange} />
      <FilterToggleGroup title="Nhu cầu sử dụng" filterKey="uses" items={options.uses} selected={filters.uses} onChange={onChange} layout="uses" />
      <FilterToggleGroup title="RAM tối thiểu" filterKey="minRam" items={options.ram.map((value) => `${value}GB`)} selected={[`${filters.minRam}GB`]} onChange={(key, value) => onChange(key, Number.parseInt(value, 10))} layout="ram" values={options.ram} selectedValue={filters.minRam} />
      <FilterCheckGroup title="Chipset / CPU" filterKey="cpus" items={options.cpus.map((value) => ({ value, label: value }))} selected={filters.cpus} onChange={onChange} />
      <FilterToggleGroup title="Màn hình" filterKey="screens" items={options.screens} selected={filters.screens} onChange={onChange} layout="screens" icon={<IconDeviceLaptop size={18} />} />
      <button className="category-filter-panel__apply" onClick={onApply}><IconArrowDown size={16} />Áp dụng bộ lọc</button>
    </aside>
  );
}
