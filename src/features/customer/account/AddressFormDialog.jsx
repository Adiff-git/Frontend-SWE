import { useState } from 'react';
import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';
import { validateAddress } from './addressValidation';

function AddressForm({ initialData, onSubmit, onClose, isPending }) {
  const [form, setForm] = useState(() => ({
    recipientName: initialData?.recipientName || '',
    recipientPhone: initialData?.recipientPhone || '',
    addressText: initialData?.addressText || '',
    isDefault: Boolean(initialData?.isDefault),
  }));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setServerError(null);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateAddress(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setServerError(null);
    try {
      await onSubmit({
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        addressText: form.addressText.trim(),
        isDefault: form.isDefault,
      });
      onClose();
    } catch (err) {
      const fieldErrors = err?.fieldErrors;
      const hasFieldErrors =
        fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0;

      if (hasFieldErrors) {
        setErrors(fieldErrors);
        setServerError(err?.message || 'Vui lòng kiểm tra lại thông tin không hợp lệ.');
      } else if (err?.status === 403) {
        setServerError('Tài khoản không có quyền quản lý địa chỉ nhận hàng.');
      } else if (err?.status === 404) {
        setServerError('Địa chỉ nhận hàng không tồn tại hoặc đã bị xóa.');
      } else if (err?.status === 409) {
        setServerError(err?.message || 'Yêu cầu địa chỉ bị xung đột dữ liệu.');
      } else {
        setServerError(
          err?.message || 'Không thể lưu địa chỉ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        );
      }
    }
  };

  const isEditing = Boolean(initialData?.id);

  return (
    <form onSubmit={handleSubmit} className="address-form-dialog" noValidate>
      {serverError && (
        <div className="address-form-dialog__alert" role="alert">
          {serverError}
        </div>
      )}

      <div className="address-form-dialog__field">
        <label htmlFor="address-recipientName" className="address-form-dialog__label">
          Họ và tên người nhận <span className="address-form-dialog__req">*</span>
        </label>
        <input
          id="address-recipientName"
          type="text"
          className={`address-form-dialog__input ${
            errors.recipientName ? 'address-form-dialog__input--error' : ''
          }`}
          value={form.recipientName}
          onChange={(e) => handleChange('recipientName', e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
          disabled={isPending}
          aria-invalid={Boolean(errors.recipientName)}
          aria-describedby={errors.recipientName ? 'address-recipientName-error' : undefined}
        />
        {errors.recipientName && (
          <span id="address-recipientName-error" className="address-form-dialog__error">
            {errors.recipientName}
          </span>
        )}
      </div>

      <div className="address-form-dialog__field">
        <label htmlFor="address-recipientPhone" className="address-form-dialog__label">
          Số điện thoại người nhận <span className="address-form-dialog__req">*</span>
        </label>
        <input
          id="address-recipientPhone"
          type="tel"
          className={`address-form-dialog__input ${
            errors.recipientPhone ? 'address-form-dialog__input--error' : ''
          }`}
          value={form.recipientPhone}
          onChange={(e) => handleChange('recipientPhone', e.target.value)}
          placeholder="Ví dụ: 0988123456"
          disabled={isPending}
          aria-invalid={Boolean(errors.recipientPhone)}
          aria-describedby={errors.recipientPhone ? 'address-recipientPhone-error' : undefined}
        />
        {errors.recipientPhone && (
          <span id="address-recipientPhone-error" className="address-form-dialog__error">
            {errors.recipientPhone}
          </span>
        )}
      </div>

      <div className="address-form-dialog__field">
        <label htmlFor="address-addressText" className="address-form-dialog__label">
          Địa chỉ chi tiết <span className="address-form-dialog__req">*</span>
        </label>
        <textarea
          id="address-addressText"
          rows={3}
          className={`address-form-dialog__textarea ${
            errors.addressText ? 'address-form-dialog__textarea--error' : ''
          }`}
          value={form.addressText}
          onChange={(e) => handleChange('addressText', e.target.value)}
          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
          disabled={isPending}
          aria-invalid={Boolean(errors.addressText)}
          aria-describedby={errors.addressText ? 'address-addressText-error' : undefined}
        />
        {errors.addressText && (
          <span id="address-addressText-error" className="address-form-dialog__error">
            {errors.addressText}
          </span>
        )}
      </div>

      <label className="address-form-dialog__checkbox-label">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => handleChange('isDefault', e.target.checked)}
          disabled={isPending || (isEditing && initialData?.isDefault)}
          className="address-form-dialog__checkbox"
        />
        <span>Đặt làm địa chỉ mặc định</span>
      </label>

      <div className="address-form-dialog__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Đang lưu…' : 'Lưu địa chỉ'}
        </Button>
      </div>
    </form>
  );
}

export default function AddressFormDialog({
  open,
  onClose,
  initialData = null,
  onSubmit,
  isPending,
}) {
  const isEditing = Boolean(initialData?.id);
  const title = isEditing ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={540}
      dismissible={!isPending}
    >
      {open && (
        <AddressForm
          key={initialData?.id || 'new'}
          initialData={initialData}
          onSubmit={onSubmit}
          onClose={onClose}
          isPending={isPending}
        />
      )}
    </Dialog>
  );
}
