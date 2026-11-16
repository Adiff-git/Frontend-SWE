import { useState } from 'react';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import FormField from '../../components/FormField';
import { useAdmin } from './adminContext';
import { adjustedStock } from './catalogModel';
import { Alert } from './shared';

export default function StockDialog({ product, onClose }) {
  const { catalog, mutate } = useAdmin();
  const [variantId, setVariantId] = useState(product.variants[0]?.id || '');
  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [baseline, setBaseline] = useState(product.version);
  const variant = product.variants.find(v => v.id === variantId);
  let next = null;
  try { if (variant && quantity !== '') next = adjustedStock(variant, mode, quantity); } catch { /* Validation is displayed on submit. */ }
  const save = event => {
    event.preventDefault();
    try {
      if (!reason.trim()) throw new Error('Nhập lý do điều chỉnh tồn kho.');
      const stock = adjustedStock(variant, mode, quantity);
      mutate(current => {
        const latest = current.products.find(p => p.id === product.id);
        if (!latest || latest.version !== baseline) throw new Error('Tồn kho đã thay đổi. Tải lại số liệu trước khi xác nhận.');
        return { ...current, products: current.products.map(p => p.id === product.id ? { ...p, version: p.version + 1, variants: p.variants.map(v => v.id === variantId ? { ...v, stock } : v) } : p), adjustments: [...current.adjustments, { productId: product.id, variantId, before: variant.stock, after: stock, reason: reason.trim(), at: new Date().toISOString() }] };
      });
      onClose();
    } catch (err) { setError(err.message); }
  };
  return <Dialog open title="Điều chỉnh tồn kho" onClose={onClose} maxWidth={620}><form className="admin-form" onSubmit={save} noValidate>
    <div><h3>{product.name}</h3><p>Thay đổi trong bản xem trước · Không cập nhật kho thật</p></div>
    <FormField as="select" label="Biến thể" value={variantId} onChange={e => setVariantId(e.target.value)}>{product.variants.map(v => <option key={v.id} value={v.id}>{v.sku} · {v.label}</option>)}</FormField>
    <div className="admin-stock-summary"><span>Hiện có <strong>{variant?.stock}</strong></span><span>Đã giữ chỗ <strong>{variant?.reserved}</strong></span><span>Có thể bán <strong>{variant ? variant.stock - variant.reserved : 0}</strong></span></div>
    <FormField as="select" label="Loại điều chỉnh" value={mode} onChange={e => setMode(e.target.value)}><option value="add">Nhập kho bổ sung</option><option value="remove">Xuất hỏng / Hao hụt</option><option value="set">Kiểm kê — đặt số lượng</option></FormField>
    <FormField label={mode === 'set' ? 'Số lượng sau kiểm kê' : 'Số lượng điều chỉnh'} type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
    <p className="admin-stock-result">Tồn kho sau điều chỉnh: <strong>{next === null ? '—' : `${next} sản phẩm`}</strong></p>
    <FormField as="textarea" rows={3} label="Lý do điều chỉnh *" value={reason} onChange={e => setReason(e.target.value)} required />
    {error && <Alert>{error}</Alert>}
    <button className="admin-text-link" type="button" onClick={() => { const latest = catalog.products.find(p => p.id === product.id); setBaseline(latest?.version); setError('Đã đối chiếu phiên bản đã lưu trong bản xem trước. Kiểm tra lại số lượng trước khi xác nhận.'); }}>Đối chiếu dữ liệu đã lưu</button>
    <div className="admin-dialog-actions"><Button size="compact" emphasis="outline" onClick={onClose}>Hủy</Button><Button size="compact" type="submit">Xác nhận điều chỉnh</Button></div>
  </form></Dialog>;
}
