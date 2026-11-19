import { useListState } from './useListState';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { useAdmin } from './adminContext';
import { categoryContains, money, stockTotal, PREVIEW_DATE } from './catalogModel';
import { AdminTable, Badge, Empty, PageHeading, Pagination, Panel } from './shared';

const formatDate = iso => iso.split('-').reverse().join('/');
export default function OverviewScreen() {
  const { catalog, scenario, setScenario } = useAdmin();
  const { params, update, updateMany, size, requestedPage } = useListState();
  const [range, setRange] = useState({ from: params.get('from') || '2026-11-01', to: params.get('to') || PREVIEW_DATE });
  const [validRange, setValidRange] = useState(range);
  const [error, setError] = useState('');
  const completedOrders = scenario === 'empty' ? [] : catalog.orders.filter(o => o.status === 'completed' && o.date >= validRange.from && o.date <= validRange.to);
  const rows = (scenario === 'empty' ? [] : catalog.products).filter(p => p.name.toLowerCase().includes((params.get('q') || '').toLowerCase()) && (!params.get('category') || categoryContains(catalog.categories, params.get('category'), p.categoryId))).map(p => {
    let units = 0; let revenue = 0;
    completedOrders.forEach(o => {
      const subtotal = o.items.reduce((s, i) => s + i.quantity * i.price, 0);
      o.items.filter(i => i.productId === p.id).forEach(i => {
        const line = i.quantity * i.price;
        units += i.quantity;
        revenue += line - (subtotal ? Math.round(o.discount * (line / subtotal)) : 0);
      });
    });
    return { ...p, units, revenue };
  }).sort((a, b) => params.get('sort') === 'units' ? b.units - a.units : b.revenue - a.revenue);
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(rows.length / size)));
  if (scenario === 'forbidden') return <Empty title="Không có quyền xem báo cáo" description="Tài khoản hiện tại không có quyền truy cập báo cáo này." />;
  if (scenario === 'loading') return <div className="admin-loading" role="status">Đang tải báo cáo…</div>;
  if (scenario === 'error') return <Empty title="Không thể tải tổng quan sản phẩm" description="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."><Button size="compact" emphasis="outline" onClick={() => setScenario('normal')}>Thử lại</Button></Empty>;
  return <><PageHeading title="Tổng quan sản phẩm"><Link className="admin-link-button admin-link-button--outline" to="/admin/products">Danh sách sản phẩm</Link></PageHeading><Panel title="Kỳ báo cáo" description={`Cập nhật đến ${formatDate(PREVIEW_DATE)}`}><form noValidate className="admin-toolbar" onSubmit={e => { e.preventDefault(); if (!range.from || !range.to || range.from > range.to) { setError('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu. Báo cáo trước vẫn được giữ.'); return; } setValidRange(range); updateMany({ from: range.from, to: range.to }); setError(''); }}><label>Từ ngày <input type="date" aria-label="Từ ngày" value={range.from} onChange={e => setRange(prev => ({ ...prev, from: e.target.value }))} /></label><label>Đến ngày <input type="date" aria-label="Đến ngày" value={range.to} onChange={e => setRange(prev => ({ ...prev, to: e.target.value }))} /></label><button className="admin-link-button" type="submit">Áp dụng kỳ báo cáo</button></form>{error && <p className="admin-alert" role="alert">{error}</p>}</Panel>
    <div className="admin-metrics admin-metrics--three">{[['Sản phẩm trong phạm vi', rows.length], ['Số lượng đã bán', rows.reduce((sum, p) => sum + p.units, 0)], ['Doanh thu', money(rows.reduce((sum, p) => sum + p.revenue, 0))]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{formatDate(validRange.from)} – {formatDate(validRange.to)}</small></div>)}</div><Panel title="Doanh số theo sản phẩm"><div className="admin-toolbar"><input className="admin-search-input" aria-label="Tìm trong tổng quan" placeholder="Tìm tên sản phẩm…" value={params.get('q') || ''} onChange={e => update('q', e.target.value)} /><select aria-label="Danh mục báo cáo" value={params.get('category') || ''} onChange={e => update('category', e.target.value)}><option value="">Tất cả danh mục</option>{catalog.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{!rows.length ? <Empty title="Không có dữ liệu" description="Thử thay đổi từ khóa hoặc bộ lọc." /> : <><AdminTable label="Doanh số theo sản phẩm" columns={[{ label: 'Sản phẩm' }, { label: 'Tồn kho' }, { label: 'Đã bán', action: () => update('sort', 'units'), sortDirection: params.get('sort') === 'units' ? 'descending' : 'none' }, { label: 'Doanh thu (VND)', action: () => update('sort', 'revenue'), sortDirection: params.get('sort') !== 'units' ? 'descending' : 'none' }]}>{rows.slice((page - 1) * size, page * size).map(p => <tr key={p.id}><td><Link className="admin-text-link" to={`/admin/products/${p.id}/edit`} state={{ returnTo: `/admin/products/overview?${params}` }}>{p.name}</Link>{p.status === 'inactive' && <Badge>Ngừng bán</Badge>}</td><td>{stockTotal(p)}</td><td>{p.units}</td><td>{money(p.revenue)}</td></tr>)}</AdminTable><Pagination count={rows.length} page={page} size={size} onPage={n => update('page', n)} onSize={n => update('size', n)} /></>}</Panel></>;
}
