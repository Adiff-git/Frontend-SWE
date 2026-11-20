import "./StorefrontFooter.css";

export default function StorefrontFooter() {
  return (
    <footer className="storefront-footer" data-node-id="212:46">
      <div className="storefront-footer__inner">
        <div className="storefront-footer__brand">
          <img src="/storefront/cham-tech-logo.png" alt="Chạm Tech" />
          <p>Thiết bị công nghệ &amp; phần cứng cao cấp. Trải nghiệm mua sắm rõ ràng, tinh tế.</p>
        </div>
        <div className="storefront-footer__column">
          <h2>Hỗ trợ khách hàng</h2>
          <a href="#featured-products">Hướng dẫn mua hàng trực tuyến</a>
          <a href="#services">Tra cứu &amp; theo dõi đơn hàng</a>
          <a href="#featured-products">Tìm kiếm và lọc sản phẩm</a>
        </div>
        <div className="storefront-footer__column">
          <h2>Liên hệ Chạm Tech</h2>
          <strong>1800 6868 · 08:30 – 21:30</strong>
          <span>Hỗ trợ thông tin sản phẩm và đơn hàng</span>
        </div>
        <div className="storefront-footer__copyright">© 2026 Chạm Tech</div>
      </div>
    </footer>
  );
}
