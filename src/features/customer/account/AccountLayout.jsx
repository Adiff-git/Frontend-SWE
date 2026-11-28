import { Link, Outlet, useLocation } from 'react-router-dom';
import AccountSidebar from './AccountSidebar';
import StoreFooter from '../../../components/StoreFooter';
import houseIcon from '../../../assets/account/house.svg';
import './AccountLayout.css';

const BREADCRUMB_MAP = {
  '/profile': 'Hồ sơ của tôi',
  '/profile/info': 'Hồ sơ của tôi',
  '/profile/orders': 'Đơn hàng của tôi',
  '/profile/addresses': 'Sổ địa chỉ nhận hàng',
};

export default function AccountLayout() {
  const location = useLocation();
  const currentSection = BREADCRUMB_MAP[location.pathname] || 'Tài khoản';

  return (
    <div className="account-layout">
      <div className="account-layout__container">
        {/* Breadcrumb */}
        <nav className="account-layout__breadcrumb" aria-label="Đường dẫn điều hướng">
          <Link to="/" className="account-layout__breadcrumb-link account-layout__breadcrumb-home">
            <img src={houseIcon} alt="" className="account-layout__breadcrumb-icon" width="14" height="14" />
            <span>Trang chủ</span>
          </Link>
          <span className="account-layout__breadcrumb-separator" aria-hidden="true">/</span>
          <Link to="/profile/info" className="account-layout__breadcrumb-link">
            Tài khoản
          </Link>
          <span className="account-layout__breadcrumb-separator" aria-hidden="true">/</span>
          <span className="account-layout__breadcrumb-current" aria-current="page">
            {currentSection}
          </span>
        </nav>

        {/* Content columns */}
        <div className="account-layout__content">
          <AccountSidebar />
          <section className="account-layout__main">
            <Outlet />
          </section>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
}

