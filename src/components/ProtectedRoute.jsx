import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from './Button';
import './ProtectedRoute.css';

export default function ProtectedRoute() {
  const { status, error, retryBootstrap, logout } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="route-guard route-guard--loading" role="status" aria-live="polite">
        <div className="route-guard__spinner" aria-hidden="true" />
        <p>Đang kiểm tra thông tin đăng nhập…</p>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'error') {
    const isForbidden = error?.type === 'forbidden' || error?.status === 403;
    return (
      <div className="route-guard route-guard--error" role="alert">
        <div className="route-guard__card">
          <h2>{isForbidden ? 'Tài khoản không có quyền truy cập' : 'Lỗi kết nối máy chủ'}</h2>
          <p>
            {isForbidden
              ? 'Tài khoản của bạn hiện không có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản khác.'
              : error?.message || 'Không thể xác thực phiên làm việc. Vui lòng kiểm tra lại kết nối.'}
          </p>
          <div className="route-guard__actions">
            {!isForbidden && <Button onClick={retryBootstrap}>Thử lại</Button>}
            <Button variant="secondary" onClick={logout}>Đăng xuất</Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

