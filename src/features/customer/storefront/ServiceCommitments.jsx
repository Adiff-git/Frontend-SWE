import { IconArrowRight, IconShoppingBag } from "@tabler/icons-react";
import "./ServiceCommitments.css";

export default function ServiceCommitments() {
  return (
    <section className="services" id="services" data-node-id="3:9616" aria-label="Cam kết dịch vụ">
      <article className="service-card">
        <span className="service-card__icon"><IconShoppingBag size={22} /></span>
        <div><h3>100% Chính hãng</h3><p>Ủy quyền chính thức, nguyên seal, kích hoạt bảo hành điện tử chính ngạch 12 tháng.</p></div>
      </article>
      <article className="service-card service-card--wide">
        <span className="service-card__icon"><IconArrowRight size={22} /></span>
        <div><h3>Theo dõi đơn hàng</h3><p>Xem trạng thái xử lý, giao hàng và thanh toán của từng đơn trong tài khoản.</p></div>
      </article>
    </section>
  );
}
