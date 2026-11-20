import {
  IconChevronRight,
  IconDeviceAirpods,
  IconDeviceDesktop,
  IconDeviceLaptop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconDeviceWatch,
  IconHeadphones,
} from "@tabler/icons-react";
import "./CategorySection.css";

const categoryIcons = {
  phone: IconDeviceMobile,
  laptop: IconDeviceLaptop,
  tablet: IconDeviceTablet,
  watch: IconDeviceWatch,
  headphones: IconHeadphones,
  monitor: IconDeviceDesktop,
  devices: IconDeviceAirpods,
};

export default function CategorySection({ categories, activeCategory, onSelectCategory, onShowAll }) {
  return (
    <section className="categories" data-node-id="3:9262" aria-labelledby="categories-title">
      <div className="section-topline">
        <h2 id="categories-title" className="section-topline__title">Danh mục công nghệ</h2>
        <button className="text-link" onClick={onShowAll}>Xem tất cả danh mục <IconChevronRight size={15} /></button>
      </div>
      <div className="categories__grid">
        {categories.map((category) => {
          const CategoryIcon = categoryIcons[category.icon];
          return (
            <button
              className={`category-tile${activeCategory === category.name ? " category-tile--active" : ""}`}
              key={category.name}
              onClick={() => onSelectCategory(category.name)}
              aria-pressed={activeCategory === category.name}
            >
              <span className="category-tile__icon"><CategoryIcon size={23} stroke={1.7} /></span>
              <strong>{category.name}</strong>
              <small>{category.count}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
