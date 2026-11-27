import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import { formatAdminError } from '../adminErrors';

export function AdminErrorAlert({ error, onReload }) {
  if (!error) return null;
  const parsed = typeof error === 'string' ? { message: error, details: [], isStale: false } : formatAdminError(error);
  return (
    <div className="admin-alert" role="alert">
      <strong>{parsed.message}</strong>
      {parsed.details.length > 0 && (
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {parsed.details.map((line, idx) => (
            <li key={`${idx}-${line}`}>{line}</li>
          ))}
        </ul>
      )}
      {parsed.isStale && onReload && (
        <div style={{ marginTop: 10 }}>
          <Button type="button" size="compact" emphasis="outline" onClick={onReload}>
            Tải lại dữ liệu mới nhất
          </Button>
        </div>
      )}
    </div>
  );
}

export function LivePendingScreen({ title, contractNote }) {
  return (
    <div className="admin-panel">
      <div className="admin-empty">
        <h2>{title}</h2>
        <p>
          {contractNote ||
            'Backend nhánh draft/version-1 hiện chưa cung cấp endpoint quản trị cho mục này. Các phân hệ đã gắn API thật gồm Sản phẩm, Tồn kho, Danh mục, Thương hiệu và Thống kê hành vi.'}
        </p>
        <div className="admin-actions">
          <Link className="admin-link-button" to="/admin/products">Quản lý sản phẩm</Link>
          <Link className="admin-link-button admin-link-button--outline" to="/admin/inventory">Quản lý tồn kho</Link>
          <Link className="admin-link-button admin-link-button--outline" to="/admin/statistics">Thống kê hành vi</Link>
        </div>
      </div>
    </div>
  );
}
