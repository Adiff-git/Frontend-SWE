import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getSafeReturnDestination } from '../features/customer/auth/navigation';
import Button from './Button';
import './ProtectedRoute.css';

export default function GuestRoute() {
  const { status, error, isCompletingAuth, retryBootstrap, logout } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="route-guard route-guard--loading" role="status" aria-live="polite">
        <div className="route-guard__spinner" aria-hidden="true" />
        <p>Đang tải…</p>
      </div>
    );
  }

  if (status === 'error') {
    const isForbidden = error?.type === 'forbidden' || error?.status === 403;
    return (
      <div className="route-guard route-guard--error" role="alert">
        <div className="route-guard__card">
          <h2>{isForbidden ? 'Phiên đăng nhập bị giới hạn' : 'Không thể kết nối đến máy chủ'}</h2>
          <p>
            {isForbidden
              ? 'Tài khoản của bạn bị hạn chế quyền truy cập thông tin.'
              : 'Đã xảy ra lỗi trong quá trình xác thực phiên đăng nhập.'}
          </p>
          <div className="route-guard__actions">
            {!isForbidden && <Button onClick={retryBootstrap}>Thử lại</Button>}
            <Button variant="secondary" onClick={logout}>Đăng nhập tài khoản khác</Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    // If user is currently viewing the post-signup/login completion screen, allow form to stay mounted
    if (isCompletingAuth) {
      return <Outlet />;
    }
    const safeDestination = getSafeReturnDestination(location.state?.from, location.search);
    return <Navigate to={safeDestination} replace />;
  }

  return <Outlet />;
}

