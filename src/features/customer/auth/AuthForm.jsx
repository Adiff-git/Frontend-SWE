import { useEffect, useRef, useState } from 'react';
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

  const [flashMessage, setFlashMessage] = useState(() => {
    if (signup) return null;
    if (location.state?.loggedOut) return 'loggedOut';
    if (location.state?.passwordChanged) return 'passwordChanged';
    return null;
  });

  useEffect(() => {
    if (!flashMessage) return;

    try {
      window.history.replaceState({}, '');
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      setFlashMessage(null);
    }, 4000);

    function handleInteraction(e) {
      if (e.target.closest?.('.auth-form__notice--logged-out')) return;
      setFlashMessage(null);
    }

    const interactionTimeout = setTimeout(() => {
      document.addEventListener('pointerdown', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(interactionTimeout);
      document.removeEventListener('pointerdown', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [flashMessage]);

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
      {flashMessage === 'loggedOut' && (
        <div className="auth-form__notice auth-form__notice--logged-out" role="status">
          <img src={circleCheckIcon} alt="" width="18" height="18" />
          <span>Bạn đã đăng xuất thành công.</span>
        </div>
      )}
      {flashMessage === 'passwordChanged' && (
        <div className="auth-form__notice auth-form__notice--logged-out" role="status">
          <img src={circleCheckIcon} alt="" width="18" height="18" />
          <span>Mật khẩu đã cập nhật. Vui lòng đăng nhập lại.</span>
        </div>
      )}
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
          autoCapitalize="none"
          spellCheck={false}
          required
          hint={signup ? 'Ví dụ: bạn@example.com' : undefined}
        />
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
          {form.pending ? 'Đang xử lý…' : signup ? 'Đăng ký' : 'Đăng nhập'}
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
