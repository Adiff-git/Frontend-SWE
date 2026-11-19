import { asset } from './adminAssets';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminProvider from './AdminProvider';
import { useAdmin } from './adminContext';
import { Empty, Icon } from './shared';
import ProductsScreen from './ProductsScreen';
import ProductEditor from './ProductEditor';
import TaxonomyScreen from './TaxonomyScreen';
import OverviewScreen from './OverviewScreen';
import OrdersScreen from './OrdersScreen';
import CustomersScreen from './CustomersScreen';
import SettingsScreen from './SettingsScreen';
import ReviewsScreen from './ReviewsScreen';
import PromotionsScreen from './PromotionsScreen';
import StatisticsScreen from './StatisticsScreen';
import ImportScreen from './ImportScreen';
import './admin.css';

const navigation = [['products', 'Sản phẩm'], ['categories', 'Danh mục'], ['brands', 'Thương hiệu'], ['orders', 'Đơn hàng'], ['customers', 'Khách hàng'], ['promotions', 'Khuyến mãi'], ['reviews', 'Đánh giá'], ['statistics', 'Thống kê'], ['settings', 'Cài đặt cửa hàng']];
function Workspace() {
  const { pathname } = useLocation();
  const { notice, setNotice } = useAdmin();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const menuButton = useRef(null);
  const active = navigation.find(([key]) => pathname.includes(`/admin/${key}`))?.[1] || 'Quản trị';
  useEffect(() => {
    if (!menu) return;
    const first = menuRef.current?.querySelector('a'); first?.focus();
    const handler = e => {
      if (e.key === 'Escape') { setMenu(false); menuButton.current?.focus(); }
      if (e.key === 'Tab') {
        const links = menuRef.current?.querySelectorAll('a');
        if (e.shiftKey && document.activeElement === links?.[0]) { e.preventDefault(); links[links.length - 1]?.focus(); }
        else if (!e.shiftKey && document.activeElement === links?.[links.length - 1]) { e.preventDefault(); links[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    const mq = window.matchMedia('(min-width: 1024px)');
    const onResize = e => { if (e.matches) setMenu(false); };
    mq.addEventListener('change', onResize);
    return () => { document.removeEventListener('keydown', handler); mq.removeEventListener('change', onResize); };
  }, [menu]);
  return <div className="admin-app">
    <a className="admin-skip" href="#admin-main">Đến nội dung chính</a>
    {menu && <button className="admin-nav-backdrop" aria-label="Đóng điều hướng" onClick={() => { setMenu(false); menuButton.current?.focus(); }} />}
    <aside className={`admin-sidebar${menu ? ' admin-sidebar--open' : ''}`} ref={menuRef} aria-label="Điều hướng quản trị">
      <Link to="/admin/products" className="admin-logo" onClick={() => setMenu(false)}><span className="admin-logo-mark"><img src={asset('e2594.png')} alt="Chạm Tech" /></span></Link>
      <nav>{navigation.map(([key, label]) => <NavLink key={key} to={`/admin/${key}`} onClick={() => setMenu(false)}><Icon name={key} />{label}</NavLink>)}</nav>
      <div className="admin-workspace-note"><Link to="/">Xem cửa hàng</Link></div>
    </aside>
    <div className="admin-workspace" inert={menu || undefined}>
      <header className="admin-header"><button className="admin-menu-button" ref={menuButton} onClick={() => setMenu(true)} aria-expanded={menu} aria-label="Mở điều hướng">Menu</button><span>Quản trị <span aria-hidden="true">/</span> {active}</span><div className="admin-identity"><span className="admin-avatar">ML</span><div><strong>Mai Linh</strong><small>Quản trị viên</small></div></div></header>
      <main id="admin-main" className="admin-main" tabIndex={-1}>
        <Routes>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<ProductsScreen />} />
          <Route path="products/overview" element={<OverviewScreen />} />
          <Route path="products/import" element={<ImportScreen />} />
          <Route path="products/new" element={<ProductEditor key={pathname} />} />
          <Route path="products/:productId/edit" element={<ProductEditor key={pathname} />} />
          <Route path="categories" element={<TaxonomyScreen kind="categories" key="categories" />} />
          <Route path="brands" element={<TaxonomyScreen kind="brands" key="brands" />} />
          <Route path="orders" element={<OrdersScreen key={pathname} />} />
          <Route path="orders/:orderId" element={<OrdersScreen key={pathname} />} />
          <Route path="customers" element={<CustomersScreen key={pathname} />} />
          <Route path="customers/:customerId" element={<CustomersScreen key={pathname} />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="reviews" element={<ReviewsScreen />} />
          <Route path="promotions" element={<PromotionsScreen key={pathname} />} />
          <Route path="promotions/new" element={<PromotionsScreen create key={pathname} />} />
          <Route path="promotions/:promotionId/edit" element={<PromotionsScreen key={pathname} />} />
          <Route path="statistics" element={<StatisticsScreen />} />
          <Route path="*" element={<Empty title="Không tìm thấy màn hình" description="Chọn một mục trong điều hướng hoặc quay về danh sách sản phẩm."><Link className="admin-text-link" to="/admin/products">Quay về sản phẩm</Link></Empty>} />
        </Routes>
      </main>
    </div>
    <div className="admin-notification" role="status" aria-live="polite">{notice && <div><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Đóng thông báo">Đóng</button></div>}</div>
  </div>;
}
export default function AdminWorkspace() { return <AdminProvider><Workspace /></AdminProvider>; }
