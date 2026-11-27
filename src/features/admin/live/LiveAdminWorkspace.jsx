import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { listAdminProducts } from '../../../api/adminCatalog';
import Button from '../../../components/Button';
import useAuth from '../../../hooks/useAuth';
import { asset } from '../adminAssets';
import { Empty, Icon } from '../shared';
import { LiveAdminContext } from './liveAdminContext';
import LiveInventoryScreen from './LiveInventoryScreen';
import LiveProductEditor from './LiveProductEditor';
import LiveProductsScreen from './LiveProductsScreen';
import { AdminErrorAlert, LivePendingScreen } from './LiveShared';
import LiveStatisticsScreen from './LiveStatisticsScreen';
import LiveTaxonomyScreen from './LiveTaxonomyScreen';

const LIVE_NAVIGATION = [
  ['products', 'Sản phẩm', 'products'],
  ['inventory', 'Tồn kho', 'products'],
  ['categories', 'Danh mục', 'categories'],
  ['brands', 'Thương hiệu', 'brands'],
  ['statistics', 'Thống kê hành vi', 'statistics'],
  ['orders', 'Đơn hàng', 'orders'],
  ['customers', 'Khách hàng', 'customers'],
  ['promotions', 'Khuyến mãi', 'promotions'],
  ['reviews', 'Đánh giá', 'reviews'],
  ['settings', 'Cài đặt cửa hàng', 'settings'],
];

function getInitials(user) {
  const name = (user?.displayName || user?.username || 'AD').trim();
  const parts = name.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function LiveWorkspaceShell({ user, logout }) {
  const { pathname } = useLocation();
  const [notice, setNotice] = useState('');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const menuButton = useRef(null);

  const active = LIVE_NAVIGATION.find(([key]) => pathname.includes(`/admin/${key}`))?.[1] || 'Quản trị';

  const notify = useCallback((message) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!menu) return;
    const first = menuRef.current?.querySelector('a');
    first?.focus();
    const handler = (e) => {
      if (e.key === 'Escape') {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    const mq = window.matchMedia('(min-width: 1024px)');
    const onResize = (e) => {
      if (e.matches) setMenu(false);
    };
    mq.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', handler);
      mq.removeEventListener('change', onResize);
    };
  }, [menu]);

  return (
    <LiveAdminContext.Provider value={{ notice, setNotice, notify }}>
      <div className="admin-app">
        <a className="admin-skip" href="#admin-main">Đến nội dung chính</a>
        {menu && (
          <button
            className="admin-nav-backdrop"
            aria-label="Đóng điều hướng"
            onClick={() => {
              setMenu(false);
              menuButton.current?.focus();
            }}
          />
        )}
        <aside className={`admin-sidebar${menu ? ' admin-sidebar--open' : ''}`} ref={menuRef} aria-label="Điều hướng quản trị">
          <Link to="/admin/products" className="admin-logo" onClick={() => setMenu(false)}>
            <span className="admin-logo-mark"><img src={asset('e2594.png')} alt="Chạm Tech" /></span>
          </Link>
          <nav>
            {LIVE_NAVIGATION.map(([key, label, iconName]) => (
              <NavLink key={key} to={`/admin/${key}`} onClick={() => setMenu(false)}>
                <Icon name={iconName} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-workspace-note">
            <Link to="/">Xem cửa hàng</Link>
          </div>
        </aside>

        <div className="admin-workspace" inert={menu || undefined}>
          <header className="admin-header">
            <button
              className="admin-menu-button"
              ref={menuButton}
              onClick={() => setMenu(true)}
              aria-expanded={menu}
              aria-label="Mở điều hướng"
            >
              Menu
            </button>
            <span>Quản trị <span aria-hidden="true">/</span> {active}</span>
            <div className="admin-identity">
              <span className="admin-avatar">{getInitials(user)}</span>
              <div>
                <strong>{user?.displayName || user?.username}</strong>
                <small>Quản trị viên (API thật)</small>
              </div>
              <Button type="button" size="compact" emphasis="outline" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </header>

          <main id="admin-main" className="admin-main" tabIndex={-1}>
            <Routes>
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<LiveProductsScreen />} />
              <Route path="products/new" element={<LiveProductEditor key="new" />} />
              <Route path="products/:productId/edit" element={<LiveProductEditor key={pathname} />} />
              <Route path="inventory" element={<LiveInventoryScreen />} />
              <Route path="categories" element={<LiveTaxonomyScreen kind="categories" key="categories" />} />
              <Route path="brands" element={<LiveTaxonomyScreen kind="brands" key="brands" />} />
              <Route path="statistics" element={<LiveStatisticsScreen />} />
              <Route path="orders/*" element={<LivePendingScreen title="Đơn hàng" />} />
              <Route path="customers/*" element={<LivePendingScreen title="Khách hàng" />} />
              <Route path="promotions/*" element={<LivePendingScreen title="Khuyến mãi" />} />
              <Route path="reviews" element={<LivePendingScreen title="Đánh giá" />} />
              <Route path="settings" element={<LivePendingScreen title="Cài đặt cửa hàng" />} />
              <Route path="products/overview" element={<LivePendingScreen title="Tổng quan doanh số sản phẩm" />} />
              <Route path="products/import" element={<LivePendingScreen title="Nhập CSV sản phẩm" />} />
              <Route
                path="*"
                element={
                  <Empty title="Không tìm thấy màn hình" description="Chọn một mục trong điều hướng hoặc quay về danh sách sản phẩm.">
                    <Link className="admin-text-link" to="/admin/products">Quay về sản phẩm</Link>
                  </Empty>
                }
              />
            </Routes>
          </main>
        </div>

        <div className="admin-notification" role="status" aria-live="polite">
          {notice && (
            <div>
              <span>{notice}</span>
              <button onClick={() => setNotice('')} aria-label="Đóng thông báo">Đóng</button>
            </div>
          )}
        </div>
      </div>
    </LiveAdminContext.Provider>
  );
}

export default function LiveAdminWorkspace() {
  const { user, status, error, generation, retryBootstrap, logout } = useAuth();

  const probeQuery = useQuery({
    queryKey: ['admin', 'access', generation],
    queryFn: ({ signal }) => listAdminProducts({ page: 0, size: 1 }, { signal }),
    enabled: status === 'authenticated',
    retry: false,
    staleTime: 60 * 1000,
  });

  if (status === 'checking') {
    return (
      <div className="route-guard route-guard--loading" role="status" aria-live="polite">
        <div className="route-guard__spinner" aria-hidden="true" />
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  if (status === 'guest') {
    return (
      <div className="route-guard" role="alert">
        <div className="route-guard__card">
          <h2>Yêu cầu đăng nhập quản trị viên</h2>
          <p>Khu vực quản trị kết nối API thật yêu cầu tài khoản có quyền ROLE_ADMIN.</p>
          <div className="route-guard__actions">
            <Link className="admin-link-button" to="/login">Đăng nhập</Link>
            <Link className="admin-link-button admin-link-button--outline" to="/">Về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="route-guard route-guard--error" role="alert">
        <div className="route-guard__card">
          <h2>Lỗi xác thực phiên làm việc</h2>
          <p>{error?.message || 'Không thể kiểm tra tài khoản hiện tại.'}</p>
          <div className="route-guard__actions">
            <Button onClick={retryBootstrap}>Thử lại</Button>
            <Button emphasis="outline" onClick={logout}>Đăng xuất</Button>
          </div>
        </div>
      </div>
    );
  }

  if (probeQuery.isPending) {
    return (
      <div className="route-guard route-guard--loading" role="status" aria-live="polite">
        <div className="route-guard__spinner" aria-hidden="true" />
        <p>Đang xác minh quyền quản trị viên…</p>
      </div>
    );
  }

  if (probeQuery.error) {
    const isDenied = probeQuery.error.status === 403 || probeQuery.error.status === 401;
    return (
      <div className="route-guard route-guard--error" role="alert">
        <div className="route-guard__card">
          <h2>{isDenied ? 'Không có quyền quản trị viên' : 'Không thể kết nối API quản trị'}</h2>
          <AdminErrorAlert error={probeQuery.error} />
          <div className="route-guard__actions">
            {!isDenied && <Button onClick={() => probeQuery.refetch()}>Thử lại</Button>}
            <Button emphasis="outline" onClick={logout}>Đăng xuất / Đổi tài khoản</Button>
            <Link className="admin-link-button admin-link-button--outline" to="/">Về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  return <LiveWorkspaceShell user={user} logout={logout} />;
}
