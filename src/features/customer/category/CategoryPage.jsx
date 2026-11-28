import { useState } from "react";
import { useParams, useSearchParams  } from "react-router-dom";
import useCategoryProducts from "./useCategory";
import useFilterOptions from "./useFilterOption";
import ActiveFilterBar from "./ActiveFilterBar.jsx";
import BreadcrumbNav from "./BreadcrumbNav.jsx";
import CategoryFilters from "./CategoryFilters.jsx";
import CategoryHeading from "./CategoryHeading.jsx";
import CategoryPagination from "./CategoryPagination.jsx";
import CategoryProductGrid from "./CategoryProductGrid.jsx";
import { initialCategoryFilters } from "./categoryDefault";
import "../storefront/StorefrontPage.css";
import "./CategoryPage.css";

const formatVnd = (value) => new Intl.NumberFormat("vi-VN").format(value);

export default function CategoryPage() {
  const [filterDraft, setFilterDraft] = useState(initialCategoryFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialCategoryFilters);
  const [sortBy, setSortBy] = useState("popular");
  const [page, setPage] = useState(1);

  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const { products, total, loading, error } = useCategoryProducts(slug, appliedFilters, sortBy, page);
  const options = useFilterOptions(categoryId);

  const filterCount = appliedFilters.brands.length + appliedFilters.uses.length + appliedFilters.cpus.length + appliedFilters.screens.length + (appliedFilters.minRam > 0 ? 1 : 0) + (appliedFilters.minPrice > 15000000 || appliedFilters.maxPrice < 100000000 ? 1 : 0);
  const activeChips = [
    ...appliedFilters.brands.map((brand) => ({ key: `brand-${brand}`, label: brand, onRemove: () => removeValue("brands", brand) })),
    ...(appliedFilters.minRam ? [{ key: "ram", label: `RAM: ${appliedFilters.minRam}GB trở lên`, onRemove: () => setAppliedFilters((current) => ({ ...current, minRam: 0 })) }] : []),
    ...(appliedFilters.minPrice > 15000000 || appliedFilters.maxPrice < 100000000 ? [{ key: "price", label: `Giá: ${formatVnd(appliedFilters.minPrice)}₫ - ${formatVnd(appliedFilters.maxPrice)}₫`, onRemove: () => setAppliedFilters((current) => ({ ...current, minPrice: 15000000, maxPrice: 100000000 })) }] : []),
    ...appliedFilters.uses.map((use) => ({ key: `use-${use}`, label: use, onRemove: () => removeValue("uses", use) })),
    ...appliedFilters.cpus.map((cpu) => ({ key: `cpu-${cpu}`, label: cpu, onRemove: () => removeValue("cpus", cpu) })),
    ...appliedFilters.screens.map((screen) => ({ key: `screen-${screen}`, label: screen, onRemove: () => removeValue("screens", screen) })),
  ];

  function removeValue(key, value) {
    setAppliedFilters((current) => ({ ...current, [key]: current[key].filter((item) => item !== value) }));
    setFilterDraft((current) => ({ ...current, [key]: current[key].filter((item) => item !== value) }));
  }

  function clearFilters() {
    const reset = { ...initialCategoryFilters, brands: [], uses: [], cpus: [], screens: [] };
    setFilterDraft(reset);
    setAppliedFilters(reset);
  }

  function applyFilters() {
    setAppliedFilters({ ...filterDraft });
    setPage(1);
  }

  return (
    <div className="storefront category-page" data-node-id="299:403">
      <div className="category-page__container">
        <BreadcrumbNav />
        <CategoryHeading sortBy={sortBy} onSortChange={setSortBy} />
        <ActiveFilterBar chips={activeChips} onClearAll={clearFilters} />
        <div className="category-page__layout" data-node-id="299:462">
          <CategoryFilters
            options={options}
            count={filterCount}
            filters={filterDraft}
            onChange={(key, value) => setFilterDraft((current) => ({ ...current, [key]: value }))}
            onApply={applyFilters}
          />
          <div className="category-page__catalog" data-node-id="299:594">
              {error ? (
                <div className="category-page__message category-page__message--error" role="alert">
                  <p>Không thể tải sản phẩm. Vui lòng thử lại.</p>
                </div>
              ) : loading ? (
                <div className="category-page__message">
                  <p>Đang tải sản phẩm…</p>
                </div>
              ) : products.length === 0 ? (
                <div className="category-page__message">
                  <p>Không tìm thấy sản phẩm phù hợp. Hãy thử bỏ bớt bộ lọc.</p>
                </div>
              ) : (
                <>
                  <CategoryProductGrid products={products} />
                  <CategoryPagination page={page} onPageChange={setPage} total={total} shown={products.length} />
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
