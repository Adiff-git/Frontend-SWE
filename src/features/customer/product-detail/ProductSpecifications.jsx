import { IconBatteryCharging, IconCamera, IconCpu, IconDeviceMobile, IconPackage } from "@tabler/icons-react";
import "./ProductSpecifications.css";

const icons = { chip: IconCpu, camera: IconCamera, phone: IconDeviceMobile, battery: IconBatteryCharging };

export default function ProductSpecifications({ specifications = [] }) {
  return <section className="product-specifications" data-node-id="299:1670">
    <div className="product-specifications__intro">
      <p className="product-detail__eyebrow">THÔNG SỐ KỸ THUẬT</p>
      <h2 className="product-detail__section-title">Chi tiết phần cứng nguyên bản</h2>
      <p className="product-specifications__description">Tất cả cấu hình được kiểm định nghiêm ngặt theo tiêu chuẩn của Apple VN. Bảo chứng nguồn gốc mã máy chính ngạch VN/A.</p>
      <div className="product-specifications__package"><strong><IconPackage size={18} /> Bộ sản phẩm chuẩn gồm:</strong><p>iPhone 15 Pro Max cài sẵn iOS 17+, Cáp sạc bọc dù USB-C sang USB-C (1m), Tài liệu hướng dẫn &amp; Que chọc SIM.</p></div>
    </div>
    <div className="product-specifications__groups">{specifications.length ? specifications.map((group, index) => {
      const Icon = icons[group.icon] ?? IconCpu;
      return <details className="product-specifications__group" key={group.title} defaultOpen={index === 0}><summary><span className="product-specifications__icon"><Icon size={18} /></span><strong>{index + 1}. {group.title}</strong><span className="product-specifications__chevron">⌄</span></summary><dl>{group.items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>;
    }) : <p className="product-specifications__description">Chưa có thông số kỹ thuật.</p>}</div>
  </section>;
}
