import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { money } from './catalogModel';
import { nextOrderState, orderStates, orderTotal, transitionOrder } from './operationsModel';
import { AdminTable, Alert, Badge, Empty, PageHeading, Pagination, Panel } from './shared';
import { useListState } from './useListState';

export default function OrdersScreen() {
  const { orderId } = useParams();
  const { catalog, mutate, scenario } = useAdmin();
  const location = useLocation();
  const { params, update, requestedPage, size, clear } = useListState();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [tracking, setTracking] = useState('');
  const [error, setError] = useState('');
  const order = catalog.orders.find(o => o.id === orderId);
  const customer = catalog.customers.find(c => c.id === order?.customerId);
  const perform = e => {
    e.preventDefault();
    try {
      mutate(current => ({ ...current, orders: current.orders.map(o => { if (o.id !== order.id) return o; if (o.version !== action.version) throw new Error('Đơn hàng đã thay đổi. Đóng hộp thoại và kiểm tra lại.'); return transitionOrder(o, action.target, reason, tracking); }) })); setAction(null); setError('');
    } catch (err) { setError(err.message); }
  };
  if (scenario === 'forbidden') return <Empty title="Không có quyền xem đơn hàng" description="Tài khoản hiện tại không có quyền xem đơn hàng." />;
  if (scenario === 'loading') return <div className="admin-loading" role="status">Đang tải đơn hàng…</div>;
  if (orderId && !order) return <Empty title="Không tìm thấy đơn hàng"><Link to="/admin/orders">Về danh sách</Link></Empty>;
  if (order) return <>
    <PageHeading title={`Đơn hàng #${order.id}`} description={`Ngày đặt ${order.date.split('-').reverse().join('/')}`}><Link className="admin-link-button admin-link-button--outline" to={location.state?.returnTo?.startsWith('/admin/orders?') ? location.state.returnTo : '/admin/orders'}>Về danh sách</Link></PageHeading>
    <div className="admin-actions"><Badge tone="brand">{orderStates[order.status]}</Badge><Badge tone={order.paid ? 'success' : 'warning'}>{order.method} · {order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Badge></div>
    <div className="admin-split"><div className="admin-form"><Panel title="Sản phẩm trong đơn"><AdminTable label="Sản phẩm trong đơn" columns={[{label:'Sản phẩm / SKU'},{label:'Số lượng'},{label:'Đơn giá'},{label:'Thành tiền'}]}>{order.items.map(i => <tr key={i.sku}><td>{i.name}<small className="admin-block-muted">{i.sku}</small></td><td>{i.quantity}</td><td>{money(i.price)}</td><td>{money(i.price * i.quantity)}</td></tr>)}</AdminTable><dl className="admin-key-values"><div><dt>Giảm giá</dt><dd>{money(order.discount)}</dd></div><div><dt>Phí giao hàng</dt><dd>{money(order.shippingFee)}</dd></div><div><dt>Tổng thanh toán</dt><dd><strong>{money(orderTotal(order))}</strong></dd></div></dl></Panel><Panel title="Giao hàng"><p>{customer?.name} · {customer?.phone}</p><p className="admin-helper">{customer?.address}</p><p className="admin-helper">Mã vận đơn: {order.tracking || 'Chưa bàn giao'}</p></Panel><Panel title="Lịch sử xử lý"><ol className="admin-timeline">{order.history.map((entry, i) => <li key={i}><strong>{entry.text}</strong><small>{new Date(entry.at).toLocaleString('vi-VN')} · {entry.actor}</small></li>)}</ol></Panel></div>
    <div className="admin-form"><Panel title="Khách hàng"><p>{customer?.name}</p><p className="admin-helper">{customer?.email}</p><Link className="admin-text-link" to={`/admin/customers/${customer?.id}`}>Xem hồ sơ khách hàng</Link></Panel><Panel title="Thao tác tiếp theo">{nextOrderState[order.status] ? <Button size="compact" onClick={() => { setAction({ target: nextOrderState[order.status], version: order.version }); setTracking(''); setError(''); }}>Chuyển sang {orderStates[nextOrderState[order.status]].toLowerCase()}</Button> : <p>Đơn đã kết thúc xử lý.</p>}{['pending','confirmed','packing'].includes(order.status) && <Button size="compact" emphasis="outline" intent="danger" onClick={() => { setAction({target:'cancelled',version:order.version}); setReason(''); setError(''); }}>Hủy đơn hàng</Button>}</Panel></div></div>
    <Dialog open={Boolean(action)} title={action?.target === 'cancelled' ? `Hủy đơn hàng #${order.id}?` : `Xác nhận ${orderStates[action?.target]?.toLowerCase() || 'thay đổi'}`} onClose={() => setAction(null)}><form className="admin-form" onSubmit={perform} noValidate>{action?.target === 'cancelled' && <FormField as="textarea" label="Lý do hủy *" value={reason} error={error && !reason.trim() ? error : undefined} onChange={e => { setReason(e.target.value); setError(''); }} required />}{action?.target === 'shipping' && <FormField label="Mã vận đơn *" value={tracking} error={error && !tracking.trim() ? error : undefined} onChange={e => { setTracking(e.target.value); setError(''); }} required />}{error && <Alert>{error}</Alert>}<div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={() => setAction(null)}>Giữ nguyên</Button><Button size="compact" type="submit" intent={action?.target === 'cancelled' ? 'danger' : 'brand'}>Xác nhận thay đổi</Button></div></form></Dialog>
  </>;
  const rows = (scenario === 'empty' ? [] : catalog.orders).filter(o => {const c=catalog.customers.find(c=>c.id===o.customerId); return `${o.id} ${c?.name} ${c?.phone}`.toLowerCase().includes(search.toLowerCase()) && (!params.get('status') || o.status === params.get('status')) && (!params.get('from') || o.date>=params.get('from')) && (!params.get('to') || o.date<=params.get('to'));});
  const page=Math.min(requestedPage, Math.max(1,Math.ceil(rows.length/size)));
  return <><PageHeading title="Đơn hàng" /><div className="admin-tabs">{[['','Tất cả'],['pending','Chờ xác nhận'],['confirmed','Đã xác nhận'],['packing','Đóng gói'],['shipping','Đang giao'],['completed','Hoàn tất'],['cancelled','Đã hủy']].map(([value,label])=><button key={value} aria-pressed={(params.get('status')||'')===value} onClick={()=>update('status',value)}>{label}</button>)}</div><Panel title="Danh sách đơn hàng" actions={<Badge tone="brand">{rows.length} đơn</Badge>}><div className="admin-toolbar"><input className="admin-search-input" aria-label="Tìm đơn hàng" placeholder="Mã đơn, tên khách hoặc số điện thoại…" value={search} onChange={e=>{setSearch(e.target.value);update('page','');}} /><label>Từ ngày <input type="date" value={params.get('from')||''} onChange={e=>update('from',e.target.value)} /></label><label>Đến ngày <input type="date" value={params.get('to')||''} onChange={e=>update('to',e.target.value)} /></label></div>{rows.length ? <><AdminTable label="Danh sách đơn hàng" columns={[{label:'Mã đơn'},{label:'Khách hàng'},{label:'Ngày đặt'},{label:'Tổng tiền'},{label:'Thanh toán'},{label:'Trạng thái'}]}>{rows.slice((page-1)*size,page*size).map(o=><tr key={o.id}><td><Link className="admin-text-link" to={`/admin/orders/${o.id}`} state={{returnTo:`/admin/orders?${params}`}}>{o.id}</Link></td><td>{catalog.customers.find(c=>c.id===o.customerId)?.name}</td><td>{o.date.split('-').reverse().join('/')}</td><td>{money(orderTotal(o))}</td><td>{o.paid?`${o.method} · Đã thanh toán`:`${o.method} · Chưa thu`}</td><td><Badge tone={o.status==='completed'?'success':'brand'}>{orderStates[o.status]}</Badge></td></tr>)}</AdminTable><Pagination count={rows.length} page={page} size={size} onPage={n=>update('page',n)} onSize={n=>update('size',n)} /></> : <Empty title="Không có đơn hàng phù hợp"><Button size="compact" emphasis="outline" onClick={()=>{clear();setSearch('');}}>Xóa bộ lọc</Button></Empty>}</Panel></>;
}
