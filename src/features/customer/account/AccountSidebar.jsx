import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import useLogoutConfirmation from './useLogoutConfirmation';
import { getInitials } from './accountUtils';
import badgeCheckIcon from '../../../assets/account/badge-check.svg';
import packageIcon from '../../../assets/account/package.svg';
import mapPinIcon from '../../../assets/account/map-pin.svg';
import logOutIcon from '../../../assets/account/log-out.svg';
import headsetIcon from '../../../assets/account/headset.svg';
import './AccountSidebar.css';

export default function AccountSidebar() {
  const { user } = useAuth();
  const { requestLogout } = useLogoutConfirmation();
  const location = useLocation();
  const [failedImageUrl, setFailedImageUrl] = useState(null);

  const displayName = user?.displayName || user?.username || 'Người dùng';
  const subtext = user?.phoneNumber || user?.email || '';
  const initials = getInitials(displayName);

  const isProfileActive =
    location.pathname === '/profile' || location.pathname === '/profile/info';

  return (
    <aside className="account-sidebar" aria-label="Điều hướng tài khoản">
      {/* Customer profile card */}
      <div className="account-sidebar__card account-sidebar__identity">
        <div className="account-sidebar__avatar-wrap">
          {user?.profileImageUrl && user.profileImageUrl !== failedImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt=""
              className="account-sidebar__avatar-img"
              onError={() => setFailedImageUrl(user.profileImageUrl)}
            />
          ) : (
            <span className="account-sidebar__avatar-text">{initials}</span>
          )}
        </div>
        <div className="account-sidebar__identity-details">
          <p className="account-sidebar__name">{displayName}</p>
          {subtext && <p className="account-sidebar__subtext">{subtext}</p>}
        </div>
      </div>

      {/* Nav menu card */}
      <nav className="account-sidebar__card account-sidebar__menu" aria-label="Menu tài khoản">
        <NavLink
          to="/profile/info"
          className={({ isActive }) =>
            `account-sidebar__link ${isActive || isProfileActive ? 'account-sidebar__link--active' : ''}`
          }
          end
        >
          <img src={badgeCheckIcon} alt="" className="account-sidebar__icon" width="20" height="20" />
          <span className="account-sidebar__label">Hồ sơ của tôi</span>
          {(isProfileActive) && <span className="account-sidebar__dot" aria-hidden="true" />}
        </NavLink>

        <NavLink
          to="/profile/orders"
          className={({ isActive }) =>
            `account-sidebar__link ${isActive ? 'account-sidebar__link--active' : ''}`
          }
        >
          <img src={packageIcon} alt="" className="account-sidebar__icon" width="20" height="20" />
          <span className="account-sidebar__label">Đơn hàng của tôi</span>
          {location.pathname === '/profile/orders' && (
            <span className="account-sidebar__dot" aria-hidden="true" />
          )}
        </NavLink>

        <NavLink
          to="/profile/addresses"
          className={({ isActive }) =>
            `account-sidebar__link ${isActive ? 'account-sidebar__link--active' : ''}`
          }
        >
          <img src={mapPinIcon} alt="" className="account-sidebar__icon" width="20" height="20" />
          <span className="account-sidebar__label">Sổ địa chỉ nhận hàng</span>
          {location.pathname === '/profile/addresses' && (
            <span className="account-sidebar__dot" aria-hidden="true" />
          )}
        </NavLink>

        <div className="account-sidebar__divider" />

        <button
          type="button"
          className="account-sidebar__link account-sidebar__logout-btn"
          onClick={requestLogout}
        >
          <img src={logOutIcon} alt="" className="account-sidebar__icon" width="20" height="20" />
          <span className="account-sidebar__label">Đăng xuất</span>
        </button>
      </nav>

      {/* Support box card */}
      <div className="account-sidebar__card account-sidebar__support">
        <div className="account-sidebar__support-header">
          <img src={headsetIcon} alt="" className="account-sidebar__icon" width="20" height="20" />
          <span className="account-sidebar__support-title">Cần Chạm hỗ trợ?</span>
        </div>
        <div className="account-sidebar__support-body">
          <p className="account-sidebar__support-line">Gọi 1800 6868 (miễn phí)</p>
          <p className="account-sidebar__support-line">08:30 – 21:30 hàng ngày</p>
        </div>
      </div>
    </aside>
  );
}
