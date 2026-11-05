import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../../../components/Button';
import FormField from '../../../components/FormField';
import PasswordField from './PasswordField';
import useAuthForm from './useAuthForm';
import googleIcon from '../../../assets/auth/google.svg';
import circleCheckIcon from '../../../assets/account/circle-check.svg';

function AuthForm({ signup, destination }) {
  const form = useAuthForm(signup, destination);
  const location = useLocation();
  const successHeading = useRef(null);

  useEffect(() => {
    if (form.authenticated) successHeading.current?.focus();
  }, [form.authenticated]);

  const title = signup ? 'Tạo tài khoản' : 'Đăng nhập';
  const fieldProps = (name) => ({
    name,
    value: form.values[name],
    error: form.errors[name],
    onChange: form.change,
    onBlur: form.blur,
    disabled: form.pending,
  });

  if (form.authenticated) {
    return (
      <div className="auth-form auth-form--success">
        <div className="auth-form__notice auth-form__notice--success" role="status">
          <h1 ref={successHeading} tabIndex={-1}>
            {signup ? 'Tạo tài khoản thành công' : 'Đăng nhập thành công'}
          </h1>
          <p>Đang chuyển hướng…</p>
          {form.completionError && <p role="alert">{form.completionError}</p>}
        </div>
        {form.completionError && <Button onClick={form.retryProfile} loading={form.pending}>Thử lưu tên lại</Button>}
        <Link
          className="auth-form__continue"
          to={destination}
          onClick={form.finishCompletion}
        >
          {destination === '/' ? 'Tiếp tục mua sắm' : 'Tiếp tục'}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-form">
      {!signup && <p className="auth-form__eyebrow">CHÀO MỪNG TRỞ LẠI</p>}
      <h1>{title}</h1>
      {form.pendingRegistration && <div className="auth-form__notice" role="status">
        <p>Kiểm tra email {form.values.email} để nhận mã xác nhận. Tài khoản chỉ được tạo sau khi xác nhận thành công.</p>
        <p>Mã hết hạn lúc {new Date(form.pendingRegistration.expiresAt).toLocaleString('vi-VN')}. Nhập lại mật khẩu bạn muốn sử dụng để hoàn tất.</p>
        <Button variant="secondary" onClick={form.resend} disabled={form.pending}>Gửi lại mã</Button>
        <Button variant="secondary" onClick={form.restart} disabled={form.pending}>Đổi email / bắt đầu lại</Button>
      </div>}
      {!signup && location.state?.loggedOut && (
        <div className="auth-form__notice auth-form__notice--logged-out" role="status">
          <img src={circleCheckIcon} alt="" width="18" height="18" />
          <span>Bạn đã đăng xuất thành công.</span>
        </div>
      )}
      {!signup && location.state?.passwordChanged && <p role="status">Mật khẩu đã cập nhật. Vui lòng đăng nhập lại.</p>}
      <form
        className={`auth-form__fields${signup ? ' auth-form__fields--signup' : ''}`}
        onSubmit={form.submit}
        noValidate
        aria-busy={form.pending}
      >
        {signup && (
          <FormField
            {...fieldProps('displayName')}
            label="Tên hiển thị (tùy chọn)"
            placeholder="Nguyễn Tuấn Anh"
            autoComplete="nickname"
          />
        )}
        <FormField
          {...fieldProps('email')}
          label={signup ? 'Email' : 'Email hoặc tên đăng nhập'}
          placeholder={signup ? 'bạn@example.com' : 'Nhập email hoặc tên đăng nhập'}
          type={signup ? 'email' : 'text'}
          autoComplete={signup ? 'email' : 'username'}
          readOnly={Boolean(form.pendingRegistration)}
          autoCapitalize="none"
          spellCheck={false}
          required
          hint={signup ? 'Ví dụ: bạn@example.com' : undefined}
        />
        {form.pendingRegistration && <FormField {...fieldProps('code')} label="Mã xác nhận" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />}
        <PasswordField
          {...fieldProps('password')}
          label="Mật khẩu"
          placeholder={signup ? '••••••••' : 'Nhập mật khẩu'}
          required
          autoComplete={signup ? 'new-password' : 'current-password'}
          hint={signup ? 'Tối thiểu 8 ký tự.' : undefined}
        />
        {signup && (
          <PasswordField
            {...fieldProps('confirmPassword')}
            label="Xác nhận mật khẩu"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        )}
        {!signup && (
          <label className="auth-form__remember">
            <input
              type="checkbox"
              name="remember"
              checked={form.values.remember}
              onChange={form.change}
              disabled={form.pending}
            />
            Ghi nhớ
          </label>
        )}
        {form.error && (
          <div className="auth-form__notice" role="alert">
            <strong>{signup ? 'Chưa thể đăng ký' : 'Không thể đăng nhập'}</strong>
            <p>{form.error}</p>
          </div>
        )}
        <Button type="submit" loading={form.pending}>
          {form.pending ? 'Đang xử lý…' : form.pendingRegistration ? 'Xác nhận và tạo tài khoản' : signup ? 'Đăng ký' : 'Đăng nhập'}
        </Button>
        <button
          type="button"
          className="auth-form__google-btn"
          disabled={form.pending}
          onClick={form.google}
        >
          <img src={googleIcon} alt="" width="18" height="18" />
          <span>{signup ? 'Tiếp tục bằng Google' : 'Đăng nhập bằng Google'}</span>
        </button>
        <span className="auth-form__live" role="status">
          {form.pending ? 'Đang xử lý yêu cầu. Vui lòng chờ.' : ''}
        </span>
      </form>
      <p className="auth-form__switch">
        {signup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
        <Link to={signup ? '/login' : '/signup'} state={{ from: destination }}>
          {signup ? 'Đăng nhập' : 'Đăng ký'}
        </Link>
      </p>
      <div className="auth-form__divider" />
    </div>
  );
}

export default AuthForm;
