import { useListState } from './useListState';
import { useEffect, useRef, useState } from 'react';
import useDraftNavigation, { clearDraft, readDraft } from './useDraftNavigation';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { categoryContains } from './catalogModel';
import { AdminTable, Alert, Badge, Empty, PageHeading, Pagination, Panel } from './shared';

export default function TaxonomyScreen({ kind }) {
  const { catalog, mutate, scenario } = useAdmin();
  const { params, update, requestedPage, size, clear } = useListState();
  const category = kind === 'categories';
  const noun = category ? 'danh mục' : 'thương hiệu';
  const [draft, setDraft] = useState(() => readDraft(kind)?.draft || null);
  const [baseline, setBaseline] = useState(() => readDraft(kind)?.baseline || '');
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState([]);
  const dirty = draft && JSON.stringify(draft) !== baseline;
  const discard = useRef(false);
  const inspectorRef = useRef(null);
  useDraftNavigation(kind, { draft, baseline }, Boolean(dirty), discard);
  useEffect(() => { if (!dirty) return; const handler = event => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler); }, [dirty]);
  const choose = item => { if (dirty) { setPending(item); return; } setDraft(structuredClone(item)); setBaseline(JSON.stringify(item)); setError(''); if (window.innerWidth < 1024) requestAnimationFrame(() => inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); };
  const countProducts = item => catalog.products.filter(p => category ? categoryContains(catalog.categories, item.id, p.categoryId) : p.brandId === item.id).length;
  const rows = [];
  const visit = (parentId = '', depth = 0) => { catalog.categories.filter(c => c.parentId === parentId).forEach(c => { rows.push({ ...c, depth }); if (!collapsed.includes(c.id) || params.get('q')) visit(c.id, depth + 1); }); };
  if (category) visit(); else rows.push(...catalog.brands);
  const filtered = (scenario === 'empty' ? [] : rows).filter(item => item.name.toLowerCase().includes((params.get('q') || '').toLowerCase()));
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(filtered.length / size)));
  const save = event => {
    event.preventDefault();
    try {
      if (!draft.name.trim()) throw new Error(`Nhập tên ${noun}.`);
      if (catalog[kind].some(item => item.id !== draft.id && item.name.trim().toLowerCase() === draft.name.trim().toLowerCase())) throw new Error(`Tên ${noun} đã tồn tại.`);
      if (category && draft.parentId && categoryContains(catalog.categories, draft.id, draft.parentId)) throw new Error('Không thể đặt danh mục con làm danh mục cha.');
      if (!draft.active && draft.id && (countProducts(draft) || (category && catalog.categories.some(c => c.parentId === draft.id)))) throw new Error(`Chưa thể ẩn ${noun} còn sản phẩm hoặc danh mục con. Hãy chuyển các liên kết trước.`);
      const saved = { ...draft, name: draft.name.trim(), id: draft.id || crypto.randomUUID() };
      mutate(current => ({ ...current, [kind]: draft.id ? current[kind].map(item => item.id === draft.id ? saved : item) : [...current[kind], saved] }));
      clearDraft(kind); setDraft(saved); setBaseline(JSON.stringify(saved)); setError('');
    } catch (err) { setError(err.message); }
  };
  return <><PageHeading title={`Quản lý ${noun}`} description={category ? 'Tổ chức cây danh mục để tìm đúng sản phẩm.' : 'Quản lý thương hiệu và trạng thái trong danh mục mẫu.'}><Button size="compact" onClick={() => choose({ id: '', name: '', active: true, ...(category ? { parentId: '' } : {}) })}>Thêm {noun}</Button></PageHeading>
    <div className="admin-split"><Panel title={category ? 'Cây danh mục' : 'Danh sách thương hiệu'} description={`${catalog[kind].length} ${noun} trong bản xem trước`}><div className="admin-toolbar"><input className="admin-search-input" aria-label={`Tìm ${noun}`} placeholder={`Tìm tên ${noun}…`} value={params.get('q') || ''} onChange={e => update('q', e.target.value)} /></div>{scenario === 'loading' ? <p role="status" className="admin-loading">Đang tải…</p> : scenario === 'forbidden' ? <Empty title="Không có quyền truy cập" description="Kết thúc tình huống để tiếp tục." /> : !filtered.length ? <Empty title="Không có kết quả" description="Thử từ khóa khác hoặc thêm bản ghi mới."><Button emphasis="outline" size="compact" onClick={clear}>Xóa bộ lọc</Button></Empty> : <><AdminTable label={`Danh sách ${noun}`} columns={[{ label: `Tên ${noun}` }, { label: 'Sản phẩm' }, { label: 'Trạng thái' }, { label: 'Thao tác' }]}>{filtered.slice((page - 1) * size, page * size).map(item => <tr key={item.id}><td><div className="admin-taxonomy-name" style={{ paddingInlineStart: `${(item.depth || 0) * 18}px` }}>{category && catalog.categories.some(c => c.parentId === item.id) && <button aria-label={`${collapsed.includes(item.id) ? 'Mở' : 'Thu gọn'} ${item.name}`} aria-expanded={!collapsed.includes(item.id)} onClick={() => setCollapsed(previous => previous.includes(item.id) ? previous.filter(id => id !== item.id) : [...previous, item.id])}>{collapsed.includes(item.id) ? '+' : '−'}</button>}<button className="admin-text-link" onClick={() => choose(item)}>{item.name}</button></div></td><td>{countProducts(item)}</td><td><Badge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Hiển thị' : 'Đã ẩn'}</Badge></td><td><button className="admin-text-link" onClick={() => choose(item)}>Chỉnh sửa</button></td></tr>)}</AdminTable><Pagination count={filtered.length} size={size} page={page} onPage={n => update('page', n)} onSize={n => update('size', n)} /></>}</Panel>
      <Panel title={draft ? `${draft.id ? 'Chỉnh sửa' : 'Thêm'} ${noun}` : `Thông tin ${noun}`}><div ref={inspectorRef}>{!draft ? <p>Chọn một {noun} để xem và chỉnh sửa, hoặc thêm bản ghi mới.</p> : <form className="admin-form" onSubmit={save} noValidate><FormField label={`Tên ${noun} *`} value={draft.name} error={error && !draft.name.trim() ? error : undefined} onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))} />{category && <FormField as="select" label="Danh mục cha" value={draft.parentId} onChange={e => setDraft(prev => ({ ...prev, parentId: e.target.value }))}><option value="">Không có — Danh mục gốc</option>{catalog.categories.filter(c => c.active && c.id !== draft.id && !categoryContains(catalog.categories, draft.id, c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FormField>}<FormField as="select" label="Trạng thái" value={draft.active ? 'active' : 'inactive'} onChange={e => setDraft(prev => ({ ...prev, active: e.target.value === 'active' }))}><option value="active">Hiển thị</option><option value="inactive">Ẩn</option></FormField><p className="admin-info">Giữ nguyên liên kết sản phẩm và lịch sử. Chưa hỗ trợ xóa vĩnh viễn.</p>{error && <Alert>{error}</Alert>}<div className="admin-actions"><Button size="compact" emphasis="outline" onClick={() => { if (dirty) setPending('cancel'); else setDraft(null); }}>Hủy</Button><Button size="compact" type="submit">Lưu thay đổi</Button></div></form>}</div></Panel></div>
    <Dialog open={Boolean(pending)} title="Bỏ thay đổi chưa lưu?" onClose={() => setPending(null)}><p>Bản nháp hiện tại sẽ bị bỏ khi chuyển sang bản ghi khác.</p><div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={() => setPending(null)}>Ở lại</Button><Button size="compact" onClick={() => { const next = pending === 'cancel' ? null : structuredClone(pending); setDraft(next); setBaseline(JSON.stringify(next)); setPending(null); setError(''); }}>Bỏ thay đổi</Button></div></Dialog>
  </>;
}
