import { Link } from 'react-router-dom';
import logo from '../assets/auth/logo.png';
import './StoreFooter.css';

export default function StoreFooter() {
  return (
    <footer className="store-footer" role="contentinfo">
      <div className="store-footer__columns">
        <div className="store-footer__brand">
          <Link className="store-footer__logo" to="/" aria-label="Chạm Tech — Trang chủ">
            <img src={logo} alt="Chạm Tech" />
          </Link>
          <p>Thiết bị công nghệ &amp; phần cứng cao cấp. Trải nghiệm mua sắm rõ ràng, tinh tế.</p>
        </div>
        <nav className="store-footer__col" aria-label="Hỗ trợ khách hàng">
          <h3>Hỗ trợ khách hàng</h3>
          <Link to="/">Hướng dẫn mua hàng trực tuyến</Link>
          <Link to="/profile/orders">Tra cứu &amp; theo dõi đơn hàng</Link>
          <Link to="/products">Tìm kiếm và lọc sản phẩm</Link>
        </nav>
        <div className="store-footer__col">
          <h3>Liên hệ Chạm Tech</h3>
          <p className="store-footer__phone">1800 6868 · 08:30 – 21:30</p>
          <p>Hỗ trợ thông tin sản phẩm và đơn hàng</p>
        </div>
      </div>
      <div className="store-footer__divider" />
      <div className="store-footer__bottom">
        <span>© 2026 Chạm Tech</span>
      </div>
    </footer>
  );
}

