import { Link } from 'react-router-dom';
import Button from './Button';
import './ProtectedRoute.css';

export default function AdminBoundary() {
  return (
    <div className="route-guard route-guard--admin-boundary" role="alert">
      <div className="route-guard__card">
        <h2>Cổng quản trị tạm thời đóng</h2>
        <p>
          Hệ thống đang hoàn thiện cơ chế phân quyền quản trị viên (Admin Role).
          Khu vực quản trị tạm thời không khả dụng.
        </p>
        <div className="route-guard__actions">
          <Link to="/">
            <Button>Về trang chủ Chạm Tech</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

