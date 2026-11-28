import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import FormField from '../../../components/FormField';
import product from '../../../assets/auth/product.png';
import useSignupVerify from './useSignupVerify';
import './AuthScreen.css';
import './SignupVerifyScreen.css';

export default function SignupVerifyScreen() {
  const {
    stage,
    summary,
    code,
    errors,
    error,
    notice,
    completionError,
    completionErrorKind,
    isSubmitting,
    isResending,
    resendCooldown,
    handleCodeChange,
    handleConfirm,
    handleResend,
    handleCancel,
    retryProfile,
    finish,
  } = useSignupVerify();

  const successHeading = useRef(null);

  useEffect(() => {
    if (stage === 'completed' && completionError) {
      successHeading.current?.focus();
    }
  }, [stage, completionError]);

  if (stage === 'missing') {
    return null;
  }

  return (
    <section className="auth-screen signup-verify-screen" aria-label="Xác thực tài khoản đăng ký">
      {/* Left context column */}
      <aside className="auth-screen__context" aria-label="Ngữ cảnh xác thực">
        <h2 className="auth-screen__headline">
          Xác thực tài khoản.
          <br />
          Hoàn tất hành trình cùng Chạm Tech.
        </h2>
        <div className="auth-screen__product">
          <img src={product} alt="iPhone màu bạc" />
        </div>
        <div className="auth-screen__divider" />
      </aside>

      {/* Right form card */}
      <div className="signup-verify__form">
        <p className="signup-verify__eyebrow">BƯỚC XÁC THỰC EMAIL</p>

        {stage === 'completed' && completionError ? (
          <div className="auth-form auth-form--success">
            <div className="auth-form__notice auth-form__notice--success" role="status">
              <h1 ref={successHeading} tabIndex={-1}>
                Tạo tài khoản thành công
              </h1>
              <p role="alert">{completionError}</p>
            </div>
            {completionErrorKind === 'profile-save' && summary.displayName && (
              <Button onClick={retryProfile} loading={isSubmitting}>
                Thử lưu tên lại
              </Button>
            )}
            <Link
              className="auth-form__continue"
              to={summary.destination}
              onClick={finish}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : stage === 'invalidated' ? (
          <div className="signup-verify__recovery">
            <h1 className="signup-verify__title">Cần xác nhận lại trạng thái tài khoản</h1>
            <div className="auth-form__notice" role="alert">
              <strong>Không thể hoàn tất phiên xác thực hiện tại</strong>
              <p>{error}</p>
            </div>
            <div className="signup-verify__recovery-actions">
              <Link to="/login" className="signup-verify__login-link">
                Chuyển sang Đăng nhập
              </Link>
              <Button variant="secondary" onClick={handleCancel}>
                Bắt đầu đăng ký lại
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="signup-verify__title">Nhập mã xác nhận</h1>
            <p className="signup-verify__desc">
              Mã xác thực gồm 6 chữ số đã được gửi đến email <strong>{summary.email}</strong>.
              Vui lòng nhập mã để hoàn tất đăng ký tài khoản.
            </p>

            {notice && (
              <div className="signup-verify__notice--info" role="status">
                {notice}
              </div>
            )}

            {error && (
              <div className="auth-form__notice" role="alert">
                <strong>Chưa thể xác nhận</strong>
                <p>{error}</p>
              </div>
            )}

            <form className="signup-verify__fields" onSubmit={handleConfirm} noValidate>
              <FormField
                id="verify-code"
                name="code"
                label="Mã xác nhận"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                error={errors.code}
                className="signup-verify__code-input"
                disabled={isSubmitting}
                autoFocus
                required
              />

              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting || code.length !== 6}
                onClick={handleConfirm}
              >
                {isSubmitting ? 'Đang xác thực…' : 'Xác nhận và tạo tài khoản'}
              </Button>

              <div className="signup-verify__resend-wrap">
                <button
                  type="button"
                  className="signup-verify__resend-btn"
                  disabled={isResending || resendCooldown > 0}
                  onClick={handleResend}
                >
                  {resendCooldown > 0
                    ? `Gửi lại mã (${resendCooldown}s)`
                    : isResending
                      ? 'Đang gửi…'
                      : 'Gửi lại mã'}
                </button>

                <button
                  type="button"
                  className="signup-verify__cancel-btn"
                  onClick={handleCancel}
                >
                  Đổi email khác / Bắt đầu lại
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

