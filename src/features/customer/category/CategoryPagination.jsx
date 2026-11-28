import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import "./CategoryPagination.css";

export default function CategoryPagination({ page, onPageChange, total, shown }) {
  const pages = [1, 2, 3, "…", 22];
  return (
    <nav className="category-pagination" aria-label="Phân trang">
      <p>Hiển thị {shown ? (page - 1) * 6 + 1 : 0}-{Math.min(page * 6, total)} trên tổng số {total} máy tính xách tay</p>
      <div className="category-pagination__controls">
        <button aria-label="Trang trước" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}><IconChevronLeft size={16} /></button>
        {pages.map((item, index) => item === "…"
          ? <span className="category-pagination__ellipsis" key={`ellipsis-${index}`}>…</span>
          : <button className={page === item ? "category-pagination__page--active" : ""} key={item} onClick={() => onPageChange(item)} aria-current={page === item ? "page" : undefined}>{item}</button>)}
        <button aria-label="Trang sau" onClick={() => onPageChange(Math.min(22, page + 1))}><IconChevronRight size={16} /></button>
      </div>
    </nav>
  );
}
