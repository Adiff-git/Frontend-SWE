import { asset } from './adminAssets';
import { previewUrl, releaseUrl } from './previewMedia';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { stockTotal, validateProduct } from './catalogModel';
import { Alert, Badge, Empty, PageHeading, Panel } from './shared';
import useDraftNavigation, { clearDraft, readDraft } from './useDraftNavigation';

const newProduct = () => ({ id: '', name: '', code: '', description: '', categoryId: '', brandId: '', status: 'draft', version: 0, images: [], specifications: [], variants: [{ id: crypto.randomUUID(), sku: '', label: '', price: '', stock: '0', reserved: 0 }] });
export default function ProductEditor() {
  const { productId } = useParams();
  const { catalog, mutate } = useAdmin();
  const record = catalog.products.find(p => p.id === productId);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = /^\/admin\/products(?:\/overview)?(?:\?|$)/.test(location.state?.returnTo || '') ? location.state.returnTo : '/admin/products';
  const draftKey = productId || 'new';
  const savedDraft = readDraft(draftKey);
  const [draft, setDraft] = useState(() => structuredClone(savedDraft?.draft || savedDraft || record || newProduct()));
  const [baseline, setBaseline] = useState(() => savedDraft?.baseline || JSON.stringify(record || draft));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [leaveTo, setLeaveTo] = useState(null);
  const [reload, setReload] = useState(false);
  const formRef = useRef(null);
  const urls = useRef(new Set(draft.images.filter(img => img.source.startsWith('blob:') && !record?.images.some(saved => saved.source === img.source)).map(img => img.source)));
  const dirty = JSON.stringify(draft) !== baseline;
  const discardRef = useRef(false);
  useDraftNavigation(draftKey, { draft, baseline }, dirty, discardRef);
  useEffect(() => { const owned = urls.current; return () => { if (discardRef.current) owned.forEach(url => releaseUrl(url)); }; }, []);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = e => { e.preventDefault(); e.returnValue = ''; };
    const click = e => {
      const link = e.target.closest('a[href]');
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey || link.target === '_blank') return;
      const target = new URL(link.href);
      if (target.origin === window.location.origin) {
        if (target.pathname === window.location.pathname && target.search === window.location.search) return;
        e.preventDefault(); e.stopPropagation(); setLeaveTo(`${target.pathname}${target.search}${target.hash}`);
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', click, true); };
  }, [dirty]);
  const change = (key, value) => { setDraft(prev => ({ ...prev, [key]: value })); setErrors(prev => ({ ...prev, [key]: undefined, ...(key === 'variants' ? { variantFields: undefined } : {}), ...(key === 'specifications' ? { specFields: undefined } : {}) })); setSaveError(''); };
  const variantChange = (id, key, value) => change('variants', draft.variants.map(v => v.id === id ? { ...v, [key]: value } : v));
  const save = event => {
    event.preventDefault();
    const nextErrors = validateProduct(draft, catalog);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    try {
      const normalized = { ...draft, id: draft.id || crypto.randomUUID(), name: draft.name.trim(), code: draft.code.trim(), version: draft.version + 1, variants: draft.variants.map(v => ({ ...v, sku: v.sku.trim(), price: Number(v.price), stock: Number(v.stock) })) };
      mutate(current => {
        const latest = current.products.find(p => p.id === draft.id);
        if (draft.id && latest?.version !== draft.version) throw new Error('Sản phẩm đã thay đổi. Tải lại phiên bản đã lưu trước khi chỉnh sửa tiếp.');
        // Object URLs saved in the in-memory catalog stay alive until reset or page unload.
        return { ...current, products: draft.id ? current.products.map(p => p.id === draft.id ? normalized : p) : [normalized, ...current.products] };
      });
      draft.images.forEach(img => urls.current.delete(img.source));
      clearDraft(draftKey);
      discardRef.current = true;
      navigate(returnTo);
    } catch (err) { setSaveError(err.message); }
  };
  const upload = async event => {
    const selected = [...event.target.files]; event.target.value = '';
    const images = [];
    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setSaveError('Chỉ xem trước ảnh JPG, PNG hoặc WebP.'); continue; }
      try { const bitmap = await createImageBitmap(file); bitmap.close(); const url = previewUrl(file); urls.current.add(url); images.push({ id: crypto.randomUUID(), source: url, name: file.name }); } catch { setSaveError(`Không thể đọc ảnh ${file.name}. Chọn tệp ảnh khác.`); }
    }
    setDraft(prev => ({ ...prev, images: [...prev.images, ...images] }));
  };
  if (productId && !record) return <Empty title="Không tìm thấy sản phẩm" description="Sản phẩm không còn trong bộ dữ liệu mẫu."><Button onClick={() => navigate(returnTo)}>Về danh sách</Button></Empty>;
  const leave = () => { if (dirty) setLeaveTo(returnTo); else navigate(returnTo); };
  return <>
    <PageHeading title={productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'} description="Thông tin, hình ảnh, cấu hình và tồn kho trong một biểu mẫu."><Button size="compact" emphasis="outline" onClick={leave}>Về danh sách sản phẩm</Button></PageHeading>
    <form ref={formRef} className="admin-editor" onSubmit={save} noValidate>
      <div className="admin-editor-main">
        {saveError && <Alert>{saveError}</Alert>}
        <Panel title="Thông tin chung" description="Thông tin hiển thị của sản phẩm."><div className="admin-form"><FormField label="Tên sản phẩm *" value={draft.name} error={errors.name} onChange={e => change('name', e.target.value)} required /><FormField label="Mã sản phẩm *" value={draft.code} error={errors.code} onChange={e => change('code', e.target.value)} required /><FormField as="textarea" rows={4} label="Mô tả sản phẩm" value={draft.description} onChange={e => change('description', e.target.value)} /></div></Panel>
        <Panel title="Hình ảnh sản phẩm" description="JPG, PNG, WebP · Xem trước cục bộ, chưa tải lên máy chủ."><label className="admin-upload">Chọn ảnh<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} /></label><div className="admin-gallery">{draft.images.map((img, index) => <div key={img.id}><img src={asset(img.source) || img.source} alt={img.name} /><small>{img.name}</small>{index === 0 ? <Badge tone="brand">Ảnh chính</Badge> : <button type="button" className="admin-text-link" onClick={() => change('images', [img, ...draft.images.filter(i => i.id !== img.id)])}>Đặt làm ảnh chính</button>}<div className="admin-actions"><button type="button" disabled={index === 0} onClick={() => { const next = [...draft.images]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change('images', next); }}>Đưa lên</button><button type="button" onClick={() => { if (urls.current.has(img.source)) { releaseUrl(img.source); urls.current.delete(img.source); } change('images', draft.images.filter(i => i.id !== img.id)); }}>Gỡ ảnh</button></div></div>)}</div>{!draft.images.length && <p>Chưa chọn ảnh. Có thể bổ sung sau.</p>}</Panel>
        <Panel title="Biến thể, giá và tồn kho" description="Mỗi SKU là duy nhất. Giá VND nguyên, không âm; tồn kho không thấp hơn lượng giữ chỗ." actions={<Button size="compact" emphasis="outline" onClick={() => change('variants', [...draft.variants, { id: crypto.randomUUID(), sku: '', label: '', price: '', stock: '0', reserved: 0 }])}>Thêm biến thể</Button>}>
          {errors.variants && <Alert>{errors.variants}</Alert>}{draft.variants.map((v, i) => { const vf = errors.variantFields?.[v.id] || {}; return <fieldset className="admin-variant" key={v.id}><legend>Biến thể {i + 1}</legend><div className="admin-field-grid"><FormField label="SKU *" value={v.sku} error={vf.sku} onChange={e => variantChange(v.id, 'sku', e.target.value)} /><FormField label="Cấu hình *" value={v.label} error={vf.label} onChange={e => variantChange(v.id, 'label', e.target.value)} /><FormField label="Giá bán (VND) *" type="number" min="0" step="1" value={v.price} error={vf.price} onChange={e => variantChange(v.id, 'price', e.target.value)} /><FormField label="Tồn kho *" type="number" min={v.reserved} step="1" value={v.stock} error={vf.stock} hint={`Đã giữ chỗ: ${v.reserved}`} onChange={e => variantChange(v.id, 'stock', e.target.value)} /></div><Button size="compact" emphasis="outline" disabled={draft.variants.length === 1 || Boolean(record?.variants.some(saved => saved.id === v.id))} onClick={() => change('variants', draft.variants.filter(other => other.id !== v.id))}>Gỡ biến thể mới</Button></fieldset>; })}</Panel>
        <Panel title="Thông số kỹ thuật" description="Giá trị minh họa; lược đồ thông số thật cần xác minh với backend." actions={<Button size="compact" emphasis="outline" onClick={() => change('specifications', [...draft.specifications, { id: crypto.randomUUID(), name: '', value: '' }])}>Thêm thông số</Button>}>{errors.specifications && <Alert>{errors.specifications}</Alert>}<div className="admin-form">{draft.specifications.map(s => { const sf = errors.specFields?.[s.id] || {}; return <div className="admin-spec-row" key={s.id}><FormField label="Thông số" value={s.name} error={sf.name} onChange={e => change('specifications', draft.specifications.map(item => item.id === s.id ? { ...item, name: e.target.value } : item))} /><FormField label="Giá trị" value={s.value} error={sf.value} onChange={e => change('specifications', draft.specifications.map(item => item.id === s.id ? { ...item, value: e.target.value } : item))} /><Button emphasis="outline" size="compact" onClick={() => change('specifications', draft.specifications.filter(item => item.id !== s.id))}>Gỡ</Button></div>; })}</div></Panel>
      </div>
      <aside className="admin-editor-aside"><Panel title="Phân loại"><div className="admin-form"><FormField as="select" label="Danh mục *" value={draft.categoryId} error={errors.categoryId} onChange={e => change('categoryId', e.target.value)}><option value="">Chọn danh mục</option>{catalog.categories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FormField><FormField as="select" label="Thương hiệu *" value={draft.brandId} error={errors.brandId} onChange={e => change('brandId', e.target.value)}><option value="">Chọn thương hiệu</option>{catalog.brands.filter(b => b.active).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</FormField></div></Panel><Panel title="Trạng thái hiển thị"><FormField as="select" label="Trạng thái" value={draft.status} onChange={e => change('status', e.target.value)}><option value="draft">Bản nháp</option><option value="active">Đang bán</option><option value="inactive">Ngừng kinh doanh</option></FormField><p className="admin-helper">Chỉ thay đổi trạng thái trong dữ liệu mẫu.</p></Panel><Panel title="Kiểm tra trước khi lưu"><div className="admin-form"><span>{draft.images.length} ảnh · {draft.variants.length} SKU</span><span>Tổng tồn kho: {stockTotal(draft)}</span><Badge tone={dirty ? 'warning' : 'neutral'}>{dirty ? 'Có thay đổi chưa lưu' : 'Chưa có thay đổi'}</Badge>{record && <button type="button" className="admin-text-link" onClick={() => setReload(true)}>Tải lại phiên bản đã lưu</button>}</div></Panel></aside>
      <div className="admin-save-bar"><span>{saveError || (dirty ? 'Thay đổi chưa được lưu' : 'Đang xem dữ liệu mẫu')}</span><div className="admin-actions"><Button size="compact" emphasis="outline" onClick={leave}>Hủy</Button><Button size="compact" type="submit">{productId ? 'Lưu thay đổi' : 'Lưu sản phẩm'}</Button></div></div>
    </form>
    <Dialog open={Boolean(leaveTo)} title={dirty ? 'Rời đi và bỏ thay đổi?' : 'Về danh sách sản phẩm?'} onClose={() => setLeaveTo(null)}><p>{dirty ? 'Nội dung chưa lưu sẽ bị bỏ. Bạn có thể ở lại để tiếp tục chỉnh sửa.' : 'Dữ liệu đã lưu sẽ được giữ nguyên.'}</p><div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={() => setLeaveTo(null)}>Ở lại</Button><Button size="compact" onClick={() => { clearDraft(draftKey); discardRef.current = true; navigate(leaveTo); }}>Rời đi</Button></div></Dialog>
    <Dialog open={reload} title="Tải lại và bỏ bản nháp?" onClose={() => setReload(false)}><p>Thao tác này khôi phục bản đã lưu trong phiên xem trước.</p><div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={() => setReload(false)}>Giữ bản nháp</Button><Button size="compact" onClick={() => { setDraft(structuredClone(record)); setBaseline(JSON.stringify(record)); setSaveError(''); setErrors({}); setReload(false); }}>Tải lại dữ liệu</Button></div></Dialog>
  </>;
}
