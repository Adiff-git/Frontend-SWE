import { Link, useLocation } from 'react-router-dom'
import product from '../../../assets/auth/product.png'
import AuthForm from './AuthForm'
import './AuthScreen.css'

function AuthScreen({ mode }) {
  const signup = mode === 'signup'
  const location = useLocation()
  // Keep a safe internal destination when switching between the two forms.
  const from = location.state?.from
  const candidate = typeof from === 'object' && from !== null
    ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`
    : from || new URLSearchParams(location.search).get('redirect')
  const destination = typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')
    ? candidate : '/'
  return (
    <section className="auth-screen" aria-label={signup ? 'Đăng ký tài khoản' : 'Đăng nhập tài khoản'}>
      <aside className="auth-screen__context" aria-label="Tài khoản Chạm Tech">
        <span className="auth-screen__badge">TÀI KHOẢN CHẠM TECH</span>
        <h2 className="auth-screen__headline">
          {signup ? <>Một tài khoản.<br />Trọn hành trình mua sắm.</> : <>Trở lại giỏ hàng.<br />Tiếp tục lựa chọn của bạn.</>}
        </h2>
        <div className="auth-screen__product"><img src={product} alt="iPhone màu bạc" /></div>
        <div className="auth-screen__context-bottom">
          {!signup && <Link to="/cart">Xem giỏ hàng của bạn</Link>}
        </div>
      </aside>
      <AuthForm key={mode} signup={signup} destination={destination} />
    </section>
  )
}

export default AuthScreen
