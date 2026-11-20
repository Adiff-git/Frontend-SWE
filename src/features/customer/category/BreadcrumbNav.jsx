import { IconChevronRight, IconHome } from "@tabler/icons-react";
import "./BreadcrumbNav.css";

export default function BreadcrumbNav() {
  return (
    <nav className="category-breadcrumb" data-node-id="299:405" aria-label="Đường dẫn">
      <span className="category-breadcrumb__current"><IconHome size={13} />Trang chủ</span>
      <IconChevronRight className="category-breadcrumb__separator" size={12} />
      <span>Laptop &amp; Máy tính xách tay</span>
    </nav>
  );
}
