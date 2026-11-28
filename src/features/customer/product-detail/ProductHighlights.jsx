import { IconBatteryCharging, IconCamera, IconCpu, IconDeviceMobile } from "@tabler/icons-react";
import "./ProductHighlights.css";

const icons = { chip: IconCpu, camera: IconCamera, phone: IconDeviceMobile, battery: IconBatteryCharging };

export default function ProductHighlights({ highlights = [] }) {
  return <section className="product-highlights" data-node-id="299:1615">
    <p className="product-detail__eyebrow">ĐỘT PHÁ CÔNG NGHỆ</p>
    <h2 className="product-detail__section-title">Sức mạnh hội tụ trên iPhone 15 Pro Max</h2>
    <div className="product-highlights__grid">{highlights.map((item) => {
      const Icon = icons[item.icon];
      return <article className="product-highlights__card" key={item.title}><div className="product-highlights__icon"><Icon size={22} stroke={1.6} /></div><p className="product-highlights__eyebrow">{item.eyebrow}</p><h3>{item.title}</h3><p className="product-highlights__description">{item.description}</p></article>;
    })}</div>
  </section>;
}
