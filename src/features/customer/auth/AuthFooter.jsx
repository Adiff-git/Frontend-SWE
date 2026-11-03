import { Link } from 'react-router-dom'
import logo from '../../../assets/auth/logo.png'

function AuthFooter() {
  return (
    <footer className="auth-layout__footer">
      <div className="auth-layout__footer-columns">
        <div className="auth-layout__brand">
          <Link className="auth-layout__logo" to="/" aria-label="Chạm Tech — Trang chủ"><img src={logo} alt="Chạm Tech" /></Link>
          <p>Thiết bị công nghệ &amp; phần cứng cao cấp. Trải nghiệm mua sắm rõ ràng, tinh tế.</p>
        </div>
        <nav className="auth-layout__support" aria-label="Hỗ trợ khách hàng">
          <h2>Hỗ trợ khách hàng</h2>
          <span>Hướng dẫn mua hàng trực tuyến</span>
          <Link to="/profile/orders">Tra cứu &amp; theo dõi đơn hàng</Link>
          <Link to="/products">Tìm kiếm và lọc sản phẩm</Link>
        </nav>
        <div className="auth-layout__contact">
          <h2>Liên hệ Chạm Tech</h2>
          <a href="tel:18006868">1800 6868 · 08:30 – 21:30</a>
          <p>Hỗ trợ thông tin sản phẩm và đơn hàng</p>
        </div>
      </div>
      <div className="auth-layout__copyright"><span>© 2026 Chạm Tech</span><span>Thanh toán COD</span></div>
    </footer>
  )
}

export default AuthFooter
