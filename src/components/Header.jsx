import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useLogoutConfirmation from '../features/customer/account/useLogoutConfirmation';
import logo from '../assets/auth/logo.png';
import grid from '../assets/auth/grid.svg';
import search from '../assets/auth/search.svg';
import bag from '../assets/auth/bag.svg';
import userIcon from '../assets/auth/user.svg';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, retryBootstrap } = useAuth();
  const { requestLogout } = useLogoutConfirmation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const triggerRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on route change without triggering cascading render in effect
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setDropdownOpen(false);
  }

  // Click outside and Escape key handling for accessible disclosure
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  function submitSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.toString().trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
  }

  function handleLogout() {
    setDropdownOpen(false);
    requestLogout();
  }

  const displayName = user?.displayName || user?.username || 'Tài khoản';

  return (
    <header className="header" role="banner">
      <Link className="header__logo" to="/" aria-label="Chạm Tech — Trang chủ">
        <img src={logo} alt="Chạm Tech" />
      </Link>

      <Link className="header__category" to="/products">
        <img src={grid} alt="" width="18" height="18" />
        <span>Danh mục</span>
      </Link>

      <nav className="header__nav" aria-label="Điều hướng chính">
        <Link to="/">Trang chủ</Link>
        <Link to="/products">Sản phẩm</Link>
        <Link to="/profile/orders">Tra cứu đơn</Link>
      </nav>

      <form className="header__search" role="search" onSubmit={submitSearch}>
        <button type="submit" aria-label="Tìm kiếm">
          <img src={search} alt="" width="18" height="18" />
        </button>
        <input name="q" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm" type="search" />
      </form>

      <Link className="header__cart" to="/cart" aria-label="Giỏ hàng">
        <img src={bag} alt="" width="20" height="20" />
      </Link>

      {/* Account Section */}
      <div className="header__account-wrap" ref={containerRef}>
        {status === 'checking' && (
          <div className="header__account header__account--checking" aria-label="Đang kiểm tra tài khoản">
            <span className="header__account-skeleton" aria-hidden="true" />
          </div>
        )}

        {status === 'guest' && (
          <Link
            className="header__account header__account--guest"
            to="/login"
            state={{ from: location }}
            aria-label="Đăng nhập tài khoản"
          >
            <img src={userIcon} alt="" width="18" height="18" />
            <span>Đăng nhập</span>
          </Link>
        )}

        {status === 'error' && (
          <div className="header__account header__account--error">
            <button
              type="button"
              className="header__account-btn"
              onClick={retryBootstrap}
              title="Không thể tải phiên. Bấm để thử lại."
            >
              Thử lại
            </button>
            <button
              type="button"
              className="header__account-btn header__account-btn--logout"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        )}

        {status === 'authenticated' && (
          <div className="header__account header__account--authenticated">
            <button
              ref={triggerRef}
              type="button"
              className="header__account-trigger"
              aria-expanded={dropdownOpen}
              aria-controls="header-account-menu"
              aria-label={`Tài khoản của ${displayName}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <img
                src={user?.profileImageUrl && user.profileImageUrl !== failedImageUrl ? user.profileImageUrl : userIcon}
                alt=""
                width="18"
                height="18"
                className="header__avatar"
                onError={() => setFailedImageUrl(user?.profileImageUrl)}
              />
              <span className="header__account-name">{displayName}</span>
              <svg
                className={`header__chevron${dropdownOpen ? ' header__chevron--open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div id="header-account-menu" className="header__dropdown">
                <div className="header__dropdown-header">
                  <span className="header__dropdown-user">{displayName}</span>
                  {user?.email && <span className="header__dropdown-email">{user.email}</span>}
                </div>
                <div className="header__dropdown-divider" />
                <Link
                  to="/profile/info"
                  className="header__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Thông tin tài khoản
                </Link>
                <Link
                  to="/profile/orders"
                  className="header__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Đơn mua của tôi
                </Link>
                <Link
                  to="/profile/addresses"
                  className="header__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Sổ địa chỉ nhận hàng
                </Link>
                <div className="header__dropdown-divider" />
                <button
                  type="button"
                  className="header__dropdown-item header__dropdown-item--logout"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
