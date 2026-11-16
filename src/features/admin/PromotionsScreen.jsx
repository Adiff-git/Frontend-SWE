import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { money } from './catalogModel';
import { formatDateTime, promotionStatus, validatePromotion } from './operationsModel';
import { AdminTable, Alert, Badge, Empty, PageHeading, Panel } from './shared';
import useDraftNavigation, { clearDraft, readDraft } from './useDraftNavigation';
const emptyPromo = () => ({ id: '', name: '', code: '', type: 'percent', amount: 10, cap: 500000, minimum: 1000000, limit: 100, perCustomer: 1, used: 0, from: '2026-11-16T00:00', to: '2026-11-30T23:59', enabled: true, scope: '', group: 'all', noStack: true, version: 0 });
export default function PromotionsScreen({ create = false }) {
  const { promotionId } = useParams(); const { catalog, mutate, scenario } = useAdmin(); const navigate = useNavigate();
  const record = catalog.promotions.find(p => p.id === promotionId); const key = `promotion-${promotionId || 'new'}`;
  const [draft, setDraft] = useState(() => structuredClone(readDraft(key) || record || emptyPromo()));
  const [baseline] = useState(() => JSON.stringify(record || emptyPromo()));
  const [error, setError] = useState(''); const [search, setSearch] = useState(''); const [leaveTo, setLeaveTo] = useState(null); const discard = useRef(false);
  const editing = create || Boolean(promotionId);
  const dirty = editing && JSON.stringify(draft) !== baseline;
  useDraftNavigation(key, draft, dirty, discard);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = e => { e.preventDefault(); e.returnValue = ''; };
    const click = e => {
      const link = e.target.closest('a[href]');
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || link.target === '_blank') return;
      const target = new URL(link.href);
      if (target.origin === window.location.origin && `${target.pathname}${target.search}` !== `${window.location.pathname}${window.location.search}`) {
        e.preventDefault(); e.stopPropagation(); setLeaveTo(`${target.pathname}${target.search}${target.hash}`);
      }
    };
    window.addEventListener('beforeunload', beforeUnload); document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', click, true); };
  }, [dirty]);
  const change = (field, value) => { setDraft(prev => ({ ...prev, [field]: value })); setError(''); };
  const save = e => {
    e.preventDefault();
    try {
      validatePromotion(draft, catalog.promotions);
      if (draft.scope && !catalog.categories.some(c => c.id === draft.scope)) throw new Error('Danh mục không còn tồn tại.');
      const normalized = { ...draft, id: draft.id || crypto.randomUUID(), name: draft.name.trim(), code: draft.code.trim(), version: draft.version + 1, ...Object.fromEntries(['amount', 'minimum', 'limit', 'perCustomer'].map(k => [k, Number(draft[k])])), cap: draft.type === 'percent' ? Number(draft.cap) : 0 };
      mutate(current => { if (draft.id && current.promotions.find(p => p.id === draft.id)?.version !== draft.version) throw new Error('Chương trình đã thay đổi. Tải lại để kiểm tra.'); return { ...current, promotions: draft.id ? current.promotions.map(p => p.id === draft.id ? normalized : p) : [...current.promotions, normalized] }; });
      clearDraft(key); discard.current = true; navigate('/admin/promotions');
    } catch (err) { setError(err.message); }
  };
  if (scenario === 'forbidden') return <Empty title="Không có quyền xem khuyến mãi" />; if (scenario === 'loading') return <div className="admin-loading" role="status">Đang tải khuyến mãi…</div>;
  if (promotionId && !record) return <Empty title="Không tìm thấy khuyến mãi"><Link className="admin-text-link" to="/admin/promotions">Về danh sách</Link></Empty>;
  if (editing) {
    const example = 6000000; const discount = draft.type === 'percent' ? Math.min(example * Number(draft.amount) / 100, Number(draft.cap)) : Math.min(example, Number(draft.amount));
    const leave = () => { if (dirty) setLeaveTo('/admin/promotions'); else navigate('/admin/promotions'); };
    return <>
      <PageHeading title={record ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'} description="Ưu đãi trong bản xem trước; không ảnh hưởng đơn hàng thật."><Button size="compact" emphasis="outline" onClick={leave}>Về danh sách</Button></PageHeading>
      <form className="admin-editor" onSubmit={save} noValidate>
        <div className="admin-editor-main">{error && <Alert>{error}</Alert>}<Panel title="Thông tin chương trình"><div className="admin-field-grid"><FormField label="Tên chương trình *" value={draft.name} error={error && !draft.name.trim() ? 'Nhập tên chương trình.' : undefined} onChange={e => change('name', e.target.value)} /><FormField label="Mã ưu đãi *" value={draft.code} onChange={e => change('code', e.target.value)} /><FormField as="select" label="Loại ưu đãi" value={draft.type} onChange={e => change('type', e.target.value)}><option value="percent">Theo phần trăm</option><option value="fixed">Số tiền cố định</option></FormField><FormField label={draft.type === 'percent' ? 'Mức giảm (%)' : 'Mức giảm (VND)'} type="number" value={draft.amount} onChange={e => change('amount', e.target.value)} />{draft.type === 'percent' && <FormField label="Giảm tối đa (VND)" type="number" value={draft.cap} onChange={e => change('cap', e.target.value)} />}</div></Panel><Panel title="Điều kiện áp dụng"><div className="admin-field-grid">{[['minimum', 'Đơn tối thiểu (VND)'], ['limit', 'Tổng lượt sử dụng'], ['perCustomer', 'Lượt tối đa mỗi khách']].map(([field, label]) => <FormField key={field} label={label} type="number" value={draft[field]} onChange={e => change(field, e.target.value)} />)}<FormField as="select" label="Phạm vi danh mục" value={draft.scope} onChange={e => change('scope', e.target.value)}><option value="">Tất cả sản phẩm</option>{catalog.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FormField><FormField as="select" label="Nhóm khách hàng" value={draft.group} onChange={e => change('group', e.target.value)}><option value="all">Tất cả khách đang hoạt động</option><option value="new">Khách hàng mới (mẫu)</option></FormField></div><label><input type="checkbox" checked={draft.noStack} onChange={e => change('noStack', e.target.checked)} /> Không kết hợp với mã khác (quy tắc mẫu)</label></Panel><Panel title="Thời gian & trạng thái" description="Múi giờ Việt Nam UTC+7."><div className="admin-field-grid"><FormField label="Bắt đầu" type="datetime-local" value={draft.from} onChange={e => change('from', e.target.value)} /><FormField label="Kết thúc" type="datetime-local" value={draft.to} onChange={e => change('to', e.target.value)} /></div><label><input type="checkbox" checked={draft.enabled} onChange={e => change('enabled', e.target.checked)} /> Bật chương trình trong bản xem trước</label></Panel></div>
        <Panel title="Xem trước ưu đãi"><div className="admin-form"><Badge tone="brand">{draft.code || 'MÃ ƯU ĐÃI'}</Badge><p className="admin-helper">Đã dùng {draft.used} / {draft.limit} lượt (mẫu)</p><dl className="admin-key-values"><div><dt>Ví dụ giỏ hàng</dt><dd>{money(example)}</dd></div><div><dt>Giảm minh họa</dt><dd>{money(Number.isFinite(discount) ? discount : 0)}</dd></div></dl><p className="admin-info">Phép tính minh họa, chưa xét toàn bộ điều kiện hay phí giao hàng. Backend sẽ quyết định giá và quyền sử dụng thật.</p></div></Panel>
        <div className="admin-save-bar"><span>{dirty ? 'Thay đổi chưa được lưu' : 'Thay đổi chỉ áp dụng dữ liệu mẫu'}</span><div className="admin-actions"><Button size="compact" emphasis="outline" onClick={leave}>Hủy</Button><Button size="compact" type="submit">Lưu khuyến mãi mẫu</Button></div></div>
      </form>
      <Dialog open={Boolean(leaveTo)} title="Rời đi và bỏ thay đổi?" onClose={() => setLeaveTo(null)}><p>Nội dung chưa lưu sẽ bị bỏ. Bạn có thể ở lại để tiếp tục chỉnh sửa.</p><div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={() => setLeaveTo(null)}>Ở lại</Button><Button size="compact" onClick={() => { clearDraft(key); discard.current = true; navigate(leaveTo); }}>Rời đi</Button></div></Dialog>
    </>;
  }
  const rows = (scenario === 'empty' ? [] : catalog.promotions).filter(p => `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading title="Khuyến mãi" description="Thiết lập phạm vi, thời gian và giới hạn cho từng chiến dịch."><Link className="admin-link-button" to="/admin/promotions/new">Thêm khuyến mãi</Link></PageHeading><Panel title="Chương trình ưu đãi"><div className="admin-toolbar"><input className="admin-search-input" aria-label="Tìm khuyến mãi" placeholder="Tên chương trình hoặc mã…" value={search} onChange={e => setSearch(e.target.value)} /></div>{rows.length ? <AdminTable label="Chương trình ưu đãi" columns={[{ label: 'Chương trình' }, { label: 'Ưu đãi' }, { label: 'Thời gian UTC+7' }, { label: 'Sử dụng' }, { label: 'Trạng thái' }]}>{rows.map(p => { const st = promotionStatus(p); return <tr key={p.id}><td><Link className="admin-text-link" to={`/admin/promotions/${p.id}/edit`}>{p.name}</Link><small className="admin-block-muted">{p.code}</small></td><td>{p.type === 'percent' ? `${p.amount}% · Tối đa ${money(p.cap)}` : money(p.amount)}</td><td>{formatDateTime(p.from)}<small className="admin-block-muted">đến {formatDateTime(p.to)}</small></td><td>{p.used}/{p.limit}</td><td><Badge tone={st.tone}>{st.label}</Badge></td></tr>; })}</AdminTable> : <Empty title="Chưa có chương trình phù hợp"><Button size="compact" emphasis="outline" onClick={() => setSearch('')}>Xóa bộ lọc</Button></Empty>}</Panel></>;
}
