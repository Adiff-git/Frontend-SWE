const PHONE_REGEX = /^0\d{9}$/;

export function countCodePoints(str) {
  if (typeof str !== 'string') return 0;
  return [...str].length;
}

export function validateAddress(values) {
  const errors = {};

  const name = (values.recipientName || '').trim();
  if (!name) {
    errors.recipientName = 'Họ và tên người nhận không được để trống.';
  } else if (countCodePoints(name) > 100) {
    errors.recipientName = 'Họ và tên người nhận không được vượt quá 100 ký tự.';
  }

  const phone = (values.recipientPhone || '').trim();
  if (!phone) {
    errors.recipientPhone = 'Số điện thoại người nhận không được để trống.';
  } else if (!PHONE_REGEX.test(phone)) {
    errors.recipientPhone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (VD: 0988123456).';
  }

  const address = (values.addressText || '').trim();
  if (!address) {
    errors.addressText = 'Địa chỉ chi tiết không được để trống.';
  } else if (countCodePoints(address) > 1000) {
    errors.addressText = 'Địa chỉ chi tiết không được vượt quá 1000 ký tự.';
  }

  return errors;
}
