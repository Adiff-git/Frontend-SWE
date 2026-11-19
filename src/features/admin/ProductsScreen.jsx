import { useListState } from './useListState';
import { asset } from './adminAssets';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { categoryContains, money, statusLabels, stockTotal } from './catalogModel';
import { AdminTable, Alert, Badge, Empty, Icon, PageHeading, Pagination, Panel } from './shared';
import StockDialog from './StockDialog';

export default function ProductsScreen() {
  const { catalog, mutate, scenario } = useAdmin();
  const { params, update, size, requestedPage, clear } = useListState();
  const location = useLocation();
  const [stockId, setStockId] = useState(null);
  const [deactivateId, setDeactivateId] = useState(null);
  const [quick, setQuick] = useState(null);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const query = (params.get('q') || '').trim().toLocaleLowerCase('vi');
  const sort = params.get('sort') || 'name';
  const rows = (scenario === 'empty' ? [] : catalog.products).filter(p => (!query || `${p.name} ${p.code} ${p.variants.map(v => v.sku).join(' ')}`.toLocaleLowerCase('vi').includes(query)) && (!params.get('category') || categoryContains(catalog.categories, params.get('category'), p.categoryId)) && (!params.get('brand') || p.brandId === params.get('brand')) && (!params.get('status') || p.status === params.get('status')) && (!params.get('stock') || (params.get('stock') === 'out' ? stockTotal(p) === 0 : stockTotal(p) > 0 && stockTotal(p) < 5))).sort((a, b) => sort === 'price' ? a.variants[0].price - b.variants[0].price : sort === 'stock' ? stockTotal(a) - stockTotal(b) : a.name.localeCompare(b.name, 'vi'));
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(rows.length / size)));
  const returnTo = `${location.pathname}${location.search}`;
  const stockProduct = catalog.products.find(p => p.id === stockId);
  const deactivate = () => {
    try { mutate(current => ({ ...current, products: current.products.map(p => p.id === deactivateId ? { ...p, status: 'inactive', version: p.version + 1 } : p) })); setDeactivateId(null); setError(''); } catch (err) { setError(err.message); }
  };
  const quickSave = event => {
    event.preventDefault();
    try {
      if (price === '' || !Number.isSafeInteger(Number(price)) || Number(price) < 0) throw new Error('Giá bán phải là số nguyên không âm.');
      mutate(current => ({ ...current, products: current.products.map(p => { if (p.id !== quick.id) return p; if (p.version !== quick.version) throw new Error('Sản phẩm đã thay đổi. Mở lại chỉnh giá để đối chiếu.'); return { ...p, version: p.version + 1, variants: p.variants.map(v => v.id === quick.variantId ? { ...v, price: Number(price) } : v) }; }) })); setQuick(null); setError('');
    } catch (err) { setError(err.message); }
  };
  return <>
    <PageHeading title="Quản lý sản phẩm"><Link className="admin-link-button admin-link-button--outline" to="/admin/products/import">Nhập CSV</Link><Link className="admin-link-button admin-link-button--outline" to="/admin/products/overview">Tổng quan sản phẩm</Link><Link className="admin-link-button" to="/admin/products/new" state={{ returnTo }}><Icon name="plus" />Thêm sản phẩm</Link></PageHeading>
    <div className="admin-metrics">{[['Tổng sản phẩm', catalog.products.length], ['Đang kinh doanh', catalog.products.filter(p => p.status === 'active').length], ['Sắp hết hàng', catalog.products.filter(p => stockTotal(p) > 0 && stockTotal(p) < 5).length, 'Dưới 5 sản phẩm'], ['Hết hàng', catalog.products.filter(p => stockTotal(p) === 0).length]].map(([label, value, hint]) => <div key={label}><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>)}</div>
    <Panel title="Danh sách sản phẩm" actions={<Badge tone="brand">{rows.length} sản phẩm</Badge>}>
      <div className="admin-toolbar"><label className="admin-search"><Icon name="search" /><input aria-label="Tìm sản phẩm" placeholder="Tìm theo tên sản phẩm, mã SKU…" value={params.get('q') || ''} onChange={e => update('q', e.target.value)} /></label><select aria-label="Danh mục" value={params.get('category') || ''} onChange={e => update('category', e.target.value)}><option value="">Tất cả danh mục</option>{catalog.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Thương hiệu" value={params.get('brand') || ''} onChange={e => update('brand', e.target.value)}><option value="">Tất cả thương hiệu</option>{catalog.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><select aria-label="Tồn kho" value={params.get('stock') || ''} onChange={e => update('stock', e.target.value)}><option value="">Tất cả tồn kho</option><option value="low">Sắp hết hàng</option><option value="out">Hết hàng</option></select></div>
      <div className="admin-tabs" aria-label="Lọc trạng thái">{[['', 'Tất cả'], ['active', 'Đang bán'], ['draft', 'Bản nháp'], ['inactive', 'Ngừng kinh doanh']].map(([key, label]) => <button key={key} aria-pressed={(params.get('status') || '') === key} onClick={() => update('status', key)}>{label}</button>)}</div>
      {scenario === 'loading' ? <div className="admin-loading" role="status">Đang tải danh sách sản phẩm…</div> : scenario === 'forbidden' ? <Empty title="Không có quyền xem sản phẩm" description="Tài khoản hiện tại không có quyền xem danh sách sản phẩm." /> : rows.length === 0 ? <Empty title={query || params.size ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'} description="Thử từ khóa khác, xóa bộ lọc hoặc thêm sản phẩm đầu tiên."><Button size="compact" emphasis="outline" onClick={clear}>Xóa bộ lọc</Button></Empty> : <>
        <AdminTable label="Danh sách sản phẩm" columns={[{ label: 'Sản phẩm / SKU', action: () => update('sort', 'name'), sortDirection: sort === 'name' ? 'ascending' : 'none' }, { label: 'Danh mục' }, { label: 'Giá bán (VND)', action: () => update('sort', 'price'), sortDirection: sort === 'price' ? 'ascending' : 'none' }, { label: 'Tồn kho', action: () => update('sort', 'stock'), sortDirection: sort === 'stock' ? 'ascending' : 'none' }, { label: 'Trạng thái' }, { label: 'Thao tác' }]}>
          {rows.slice((page - 1) * size, page * size).map(p => <tr key={p.id}><td><div className="admin-product-cell"><img src={asset(p.images[0]?.source) || p.images[0]?.source} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /><div><Link to={`/admin/products/${p.id}/edit`} state={{ returnTo }}>{p.name}</Link><small>{p.variants[0]?.label}</small><small>{p.code} · {p.variants.length} SKU</small></div></div></td><td>{catalog.categories.find(c => c.id === p.categoryId)?.name || 'Chưa phân loại'}</td><td><button className="admin-inline-edit" onClick={() => { setQuick({ id: p.id, version: p.version, variantId: p.variants[0].id }); setPrice(String(p.variants[0].price)); setError(''); }} aria-label={`Chỉnh giá ${p.name}`}>{money(p.variants[0].price)}<Icon name="edit" /></button></td><td><button className="admin-inline-edit" onClick={() => setStockId(p.id)} aria-label={`Điều chỉnh tồn kho ${p.name}`}>{stockTotal(p)} cái<Icon name="edit" /></button></td><td><Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{statusLabels[p.status]}</Badge></td><td><div className="admin-row-actions"><Link to={`/admin/products/${p.id}/edit`} state={{ returnTo }} aria-label={`Sửa ${p.name}`}><Icon name="edit" /></Link>{p.status !== 'inactive' && <button onClick={() => { setDeactivateId(p.id); setError(''); }}>Ngừng bán</button>}</div></td></tr>)}
        </AdminTable><Pagination count={rows.length} page={page} size={size} onPage={n => update('page', n)} onSize={n => update('size', n)} />
      </>}
    </Panel>
    {stockProduct && <StockDialog key={stockProduct.id} product={stockProduct} onClose={() => setStockId(null)} />}
    <Dialog open={Boolean(deactivateId)} title="Ngừng kinh doanh sản phẩm?" onClose={() => setDeactivateId(null)}><p>{catalog.products.find(p => p.id === deactivateId)?.name} sẽ chuyển sang trạng thái ngừng kinh doanh. Thông tin sản phẩm và lịch sử vẫn được giữ lại.</p>{error && <Alert>{error}</Alert>}<div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={() => setDeactivateId(null)}>Giữ lại</Button><Button size="compact" intent="danger" onClick={deactivate}>Ngừng kinh doanh</Button></div></Dialog>
    <Dialog open={Boolean(quick)} title="Cập nhật nhanh giá bán" onClose={() => setQuick(null)}><form className="admin-form" onSubmit={quickSave} noValidate><p>Chỉ cập nhật SKU {catalog.products.find(p => p.id === quick?.id)?.variants.find(v => v.id === quick?.variantId)?.sku}. Các biến thể khác giữ nguyên.</p><FormField label="Giá bán (VND)" type="number" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} />{error && <Alert>{error}</Alert>}<div className="admin-dialog-actions"><Button emphasis="outline" size="compact" onClick={() => setQuick(null)}>Hủy</Button><Button type="submit" size="compact">Lưu giá mới</Button></div></form></Dialog>
  </>;
}
