import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../../components/Button'
import FormField from '../../../components/FormField'
import PasswordField from './PasswordField'
import useAuthForm from './useAuthForm'

function AuthForm({ signup, destination }) {
  const form = useAuthForm(signup)
  const successHeading = useRef(null)
  useEffect(() => {
    if (form.authenticated) successHeading.current?.focus()
  }, [form.authenticated])
  const title = signup ? 'Tạo tài khoản' : 'Đăng nhập'
  const fieldProps = (name) => ({ name, value: form.values[name], error: form.errors[name], onChange: form.change, onBlur: form.blur, disabled: form.pending })

  if (form.authenticated) {
    return (
      <div className="auth-form auth-form--success">
        <div className="auth-form__notice auth-form__notice--success" role="status">
          <h1 ref={successHeading} tabIndex={-1}>{signup ? 'Tạo tài khoản thành công' : 'Đăng nhập thành công'}</h1>
          <p>Bạn đã đăng nhập. Tiếp tục khám phá sản phẩm tại Chạm Tech.</p>
        </div>
        {form.profile.isPending && <p role="status">Đang lưu tên hiển thị…</p>}
        {form.profile.isError && (
          <div className="auth-form__notice" role="alert">
            <p>Tài khoản đã được tạo nhưng chưa lưu được tên hiển thị. Bạn có thể tiếp tục mua sắm hoặc thử lưu lại.</p>
            <Button onClick={form.retryProfile}>Lưu lại tên hiển thị</Button>
          </div>
        )}
        <Link className="auth-form__continue" to={destination}>{destination === '/' ? 'Tiếp tục mua sắm' : 'Tiếp tục'}</Link>
      </div>
    )
  }

  return (
    <div className="auth-form">
      {!signup && <p className="auth-form__eyebrow">CHÀO MỪNG TRỞ LẠI</p>}
      <h1>{title}</h1>
      <form className={`auth-form__fields${signup ? ' auth-form__fields--signup' : ''}`} onSubmit={form.submit} noValidate aria-busy={form.pending}>
        {signup && <FormField {...fieldProps('displayName')} label="Tên hiển thị (tùy chọn)" placeholder="Nguyễn Tuấn Anh" autoComplete="nickname" />}
        <FormField {...fieldProps('username')} label="Tên đăng nhập" placeholder={signup ? 'Nhập tên đăng nhập' : 'Nhập tên đăng nhập hoặc email'}
          autoComplete="username" autoCapitalize="none" spellCheck={false} required hint={signup ? 'Từ 4–50 ký tự, không chứa @.' : undefined} />
        <PasswordField {...fieldProps('password')} label="Mật khẩu" placeholder="Nhập mật khẩu" required
          autoComplete={signup ? 'new-password' : 'current-password'} hint={signup ? 'Tối thiểu 8 ký tự.' : undefined} />
        {signup && <PasswordField {...fieldProps('confirmPassword')} label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" required autoComplete="new-password" />}
        {!signup && (
          <label className="auth-form__remember">
            <input type="checkbox" name="remember" checked={form.values.remember} onChange={form.change} disabled={form.pending} />
            Ghi nhớ
          </label>
        )}
        {form.error && (
          <div className="auth-form__notice" role="alert">
            <strong>{signup ? 'Chưa thể đăng ký' : 'Không thể đăng nhập'}</strong><p>{form.error}</p>
          </div>
        )}
        <Button type="submit" loading={form.pending}>{form.pending ? 'Đang xử lý…' : signup ? 'Đăng ký' : 'Đăng nhập'}</Button>
        <span className="auth-form__live" role="status">{form.pending ? 'Đang xử lý yêu cầu. Vui lòng chờ.' : ''}</span>
      </form>
      <p className="auth-form__switch">
        {signup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
        <Link to={signup ? '/login' : '/signup'} state={{ from: destination }}>{signup ? 'Đăng nhập' : 'Đăng ký'}</Link>
      </p>
      <div className="auth-form__divider" />
    </div>
  )
}

export default AuthForm
