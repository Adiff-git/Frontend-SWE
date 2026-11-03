import { Outlet } from 'react-router-dom'
import AuthHeader from '../features/customer/auth/AuthHeader'
import AuthFooter from '../features/customer/auth/AuthFooter'
import './AuthLayout.css'

function AuthLayout() {
  return (
    <div className="auth-layout" lang="vi">
      <a className="auth-layout__skip" href="#auth-main">Đến nội dung chính</a>
      <AuthHeader />
      <main id="auth-main" className="auth-layout__main"><Outlet /></main>
      <AuthFooter />
    </div>
  )
}

export default AuthLayout
