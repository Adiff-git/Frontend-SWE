import { Outlet } from 'react-router-dom';
import Header from './Header';
import AuthFooter from '../features/customer/auth/AuthFooter';
import './AuthLayout.css';

function AuthLayout() {
  return (
    <div className="auth-layout" lang="vi">
      <a className="auth-layout__skip" href="#auth-main">
        Đến nội dung chính
      </a>
      <Header />
      <main id="auth-main" className="auth-layout__main">
        <Outlet />
      </main>
      <AuthFooter />
    </div>
  );
}

export default AuthLayout;
