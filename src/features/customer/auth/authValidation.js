const length = (value) => [...value].length;
const passwordBytes = (value) => new TextEncoder().encode(value).length;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuth(values, signup) {
  const errors = {};
  const email = (values.email || '').trim();

  if (!email) {
    errors.email = 'Vui lòng nhập email.';
  } else if (signup && !EMAIL_REGEX.test(email)) {
    errors.email = 'Email không hợp lệ. Ví dụ: bạn@example.com';
  } else if (length(email) > 254) {
    errors.email = 'Email quá dài.';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (signup && length(values.password) < 8) {
    errors.password = 'Mật khẩu cần ít nhất 8 ký tự.';
  } else if (passwordBytes(values.password) > 72) {
    errors.password = 'Mật khẩu quá dài (tối đa 72 byte UTF-8).';
  }

  if (signup && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
  }

  if (signup && length((values.displayName || '').trim()) > 100) {
    errors.displayName = 'Tên hiển thị không được quá 100 ký tự.';
  }

  return errors;
}

export function authErrorMessage(error, signup) {
  if (error.code === 'ACCOUNT_CONNECTION_REQUIRED') return 'Hãy đăng nhập tài khoản hiện có rồi liên kết Google trong hồ sơ.';
  if (error.code === 'EMAIL_VERIFICATION_REQUIRED') return 'Vui lòng xác thực email để hoàn tất thao tác.';
  if (error.code === 'SESSION_RECOVERY_REQUIRED' || error.code === 'SESSION_CHANGED') return 'Phiên đăng nhập cần được xác nhận lại. Vui lòng đăng nhập.';
  if (error.status === 401) return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
  if (error.status === 409 && signup) return 'Email đã được sử dụng hoặc yêu cầu đang xung đột. Vui lòng kiểm tra lại.';
  if (error.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.';
  if (error.status === 0) {
    return signup
      ? 'Chưa xác nhận được kết quả đăng ký. Nếu đã gửi yêu cầu, hãy thử đăng nhập trước khi đăng ký lại.'
      : 'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.';
  }
  if (error.status === 400) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường bên dưới.';
  return 'Hiện chưa thể xử lý yêu cầu. Vui lòng thử lại sau.';
}
