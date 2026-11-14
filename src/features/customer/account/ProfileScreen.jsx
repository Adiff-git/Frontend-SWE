import { useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import useProfileForm from './useProfileForm';
import { getInitials } from './accountUtils';
import Button from '../../../components/Button';
import AvatarControls from './AvatarControls';
import calendarDaysIcon from '../../../assets/account/calendar-days.svg';
import mailIcon from '../../../assets/account/mail.svg';
import shieldCheckIcon from '../../../assets/account/shield-check.svg';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const {
    draft,
    errors,
    isDirty,
    isPending,
    statusMessage,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useProfileForm();

  const displayName = user?.displayName || user?.username || 'Người dùng';
  const initials = getInitials(displayName);

  return (
    <div className="profile-screen">
      {/* Page Title */}
      <div className="profile-screen__header">
        <h1 className="profile-screen__title">Hồ sơ của tôi</h1>
        <p className="profile-screen__subtitle">
          Quản lý thông tin cá nhân để trải nghiệm mua sắm thuận tiện hơn.
        </p>
      </div>

      {/* Main Profile Form Card */}
      <div className="profile-screen__card">
        {/* User Summary Row */}
        <div className="profile-screen__user-summary">
          <div className="profile-screen__avatar">
            <div className="profile-screen__avatar-wrap">
              {user?.profileImageUrl && user.profileImageUrl !== failedImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="profile-screen__avatar-img"
                  onError={() => setFailedImageUrl(user.profileImageUrl)}
                />
              ) : (
                <span className="profile-screen__avatar-text">{initials}</span>
              )}
            </div>
            <AvatarControls />
          </div>
          <div className="profile-screen__user-info">
            <h2 className="profile-screen__user-name">{displayName}</h2>
            <p className="profile-screen__user-welcome">
              Chào mừng bạn trở lại với Chạm Tech.
            </p>
          </div>
        </div>

        {/* Status Feedback Message */}
        {statusMessage && (
          <div
            className={`profile-screen__alert profile-screen__alert--${statusMessage.type}`}
            role="status"
            aria-live="polite"
          >
            {statusMessage.text}
          </div>
        )}

        {/* Form Fields */}
        <form className="profile-screen__form" onSubmit={handleSubmit} noValidate>
          {/* Row 1: Name and Phone */}
          <div className="profile-screen__form-row">
            <div className="profile-screen__field">
              <label htmlFor="profile-displayName" className="profile-screen__label">
                Họ và tên
              </label>
              <div
                className={`profile-screen__input-wrap ${
                  errors.displayName ? 'profile-screen__input-wrap--error' : ''
                }`}
              >
                <input
                  id="profile-displayName"
                  type="text"
                  className="profile-screen__input"
                  value={draft.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  onBlur={() => handleBlur('displayName')}
                  placeholder="Nhập họ và tên"
                  disabled={isPending}
                  aria-invalid={Boolean(errors.displayName)}
                  aria-describedby={errors.displayName ? 'profile-displayName-error' : undefined}
                />
              </div>
              {errors.displayName && (
                <span id="profile-displayName-error" className="profile-screen__error-text">
                  {errors.displayName}
                </span>
              )}
            </div>

            <div className="profile-screen__field">
              <label htmlFor="profile-phoneNumber" className="profile-screen__label">
                Số điện thoại
              </label>
              <div
                className={`profile-screen__input-wrap ${
                  errors.phoneNumber ? 'profile-screen__input-wrap--error' : ''
                }`}
              >
                <input
                  id="profile-phoneNumber"
                  type="tel"
                  className="profile-screen__input"
                  value={draft.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  onBlur={() => handleBlur('phoneNumber')}
                  placeholder="0988 123 456"
                  disabled={isPending}
                  aria-invalid={Boolean(errors.phoneNumber)}
                  aria-describedby={
                    errors.phoneNumber ? 'profile-phoneNumber-error' : 'profile-phoneNumber-hint'
                  }
                />
              </div>
              {errors.phoneNumber ? (
                <span id="profile-phoneNumber-error" className="profile-screen__error-text">
                  {errors.phoneNumber}
                </span>
              ) : (
                <span id="profile-phoneNumber-hint" className="profile-screen__hint-text">
                  Số điện thoại dùng để nhận thông tin đơn hàng.
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Gender and Date of Birth */}
          <div className="profile-screen__form-row">
            <div className="profile-screen__field">
              <span className="profile-screen__label">Giới tính</span>
              <div className="profile-screen__radio-group" role="radiogroup" aria-label="Giới tính">
                <label className="profile-screen__radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={draft.gender === 'MALE'}
                    onChange={() => handleChange('gender', 'MALE')}
                    disabled={isPending}
                    className="profile-screen__radio-input"
                  />
                  <span className="profile-screen__radio-control" />
                  <span className="profile-screen__radio-label">Nam</span>
                </label>

                <label className="profile-screen__radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={draft.gender === 'FEMALE'}
                    onChange={() => handleChange('gender', 'FEMALE')}
                    disabled={isPending}
                    className="profile-screen__radio-input"
                  />
                  <span className="profile-screen__radio-control" />
                  <span className="profile-screen__radio-label">Nữ</span>
                </label>

                <label className="profile-screen__radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="OTHER"
                    checked={draft.gender === 'OTHER'}
                    onChange={() => handleChange('gender', 'OTHER')}
                    disabled={isPending}
                    className="profile-screen__radio-input"
                  />
                  <span className="profile-screen__radio-control" />
                  <span className="profile-screen__radio-label">Khác</span>
                </label>
              </div>
              {errors.gender && (
                <span className="profile-screen__error-text">{errors.gender}</span>
              )}
            </div>

            <div className="profile-screen__field">
              <label htmlFor="profile-dateOfBirth" className="profile-screen__label">
                Ngày sinh
              </label>
              <div
                className={`profile-screen__input-wrap ${
                  errors.dateOfBirth ? 'profile-screen__input-wrap--error' : ''
                }`}
              >
                <input
                  id="profile-dateOfBirth"
                  type="date"
                  className="profile-screen__input"
                  value={draft.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  onBlur={() => handleBlur('dateOfBirth')}
                  disabled={isPending}
                  aria-invalid={Boolean(errors.dateOfBirth)}
                  aria-describedby={errors.dateOfBirth ? 'profile-dateOfBirth-error' : undefined}
                />
                <img
                  src={calendarDaysIcon}
                  alt=""
                  className="profile-screen__field-icon"
                  width="18"
                  height="18"
                />
              </div>
              {errors.dateOfBirth && (
                <span id="profile-dateOfBirth-error" className="profile-screen__error-text">
                  {errors.dateOfBirth}
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Email */}
          <div className="profile-screen__field profile-screen__field--full">
            <label htmlFor="profile-email" className="profile-screen__label">
              Email
            </label>
            <div
              className={`profile-screen__input-wrap ${
                errors.email ? 'profile-screen__input-wrap--error' : ''
              }`}
            >
              <input
                id="profile-email"
                type="email"
                className="profile-screen__input"
                value={user?.email || ''}
                readOnly
                placeholder="email@example.com"
                disabled={isPending}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'profile-email-error' : 'profile-email-hint'}
              />
              <img
                src={mailIcon}
                alt=""
                className="profile-screen__field-icon"
                width="18"
                height="18"
              />
            </div>
            {errors.email ? (
              <span id="profile-email-error" className="profile-screen__error-text">
                {errors.email}
              </span>
            ) : (
              <span id="profile-email-hint" className="profile-screen__hint-text">
                Nhận hóa đơn điện tử và cập nhật mới nhất từ Chạm Tech.
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="profile-screen__actions">
            <Button
              type="submit"
              className="profile-screen__submit-btn"
              disabled={!isDirty || isPending}
            >
              {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>

      {/* Security note */}
      <div className="profile-screen__security-note">
        <img
          src={shieldCheckIcon}
          alt=""
          className="profile-screen__security-icon"
          width="18"
          height="18"
        />
        <p className="profile-screen__security-text">
          Thông tin của bạn được bảo mật và chỉ dùng để phục vụ trải nghiệm mua sắm.
        </p>
      </div>
    </div>
  );
}
