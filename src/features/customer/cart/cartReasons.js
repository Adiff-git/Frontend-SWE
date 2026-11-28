const availabilityMessages = {
  PRODUCT_UNAVAILABLE: 'Sản phẩm hiện không khả dụng',
  PRICE_UNAVAILABLE: 'Chưa có giá cho sản phẩm này',
  INVENTORY_UNAVAILABLE: 'Không xác định được tồn kho',
  INSUFFICIENT_STOCK: 'Số lượng tồn kho không đủ',
};

const voucherMessages = {
  VOUCHER_UNAVAILABLE: 'Mã giảm giá không còn dùng được',
  ENTITLEMENT_UNAVAILABLE: 'Bạn không còn quyền dùng mã này',
  VOUCHER_DISABLED: 'Mã giảm giá đã bị tắt',
  VOUCHER_NOT_STARTED: 'Mã giảm giá chưa bắt đầu',
  VOUCHER_EXPIRED: 'Mã giảm giá đã hết hạn',
  GLOBAL_USAGE_EXHAUSTED: 'Mã giảm giá đã hết lượt sử dụng',
  CUSTOMER_USAGE_EXHAUSTED: 'Bạn đã dùng hết lượt áp dụng mã này',
  NO_ELIGIBLE_ITEMS: 'Không có sản phẩm nào đủ điều kiện',
  MINIMUM_SUBTOTAL_NOT_MET: 'Chưa đạt giá trị tối thiểu để dùng mã',
};

const codeMessages = {
  SESSION_CHANGED: 'Phiên làm việc đã thay đổi. Vui lòng bắt đầu lại.',
  SESSION_RECOVERY_REQUIRED: 'Không xác định được kết quả làm mới phiên. Vui lòng đăng nhập lại.',
  CONTRACT_MISMATCH: 'Phản hồi máy chủ không khớp phiên bản API yêu cầu.',
  INSUFFICIENT_STOCK: 'Số lượng tồn kho không đủ.',
  VOUCHER_INAPPLICABLE: 'Mã giảm giá không áp dụng được cho giỏ hàng hiện tại.',
};

const statusMessages = {
  0: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
  400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Thông tin không còn tồn tại.',
  409: 'Thao tác xung đột với trạng thái hiện tại.',
  422: 'Yêu cầu không đáp ứng điều kiện áp dụng.',
  500: 'Máy chủ đang gặp sự cố. Vui lòng thử lại.',
};

export function mapAvailabilityReason(reason) {
  return availabilityMessages[reason] ?? '';
}

export function mapVoucherReason(reason) {
  return voucherMessages[reason] ?? '';
}

export function mapApiError(error) {
  const code = error?.code ?? error?.data?.code;
  if (codeMessages[code]) return codeMessages[code];
  const reason = error?.data?.reason;
  if (availabilityMessages[reason]) return availabilityMessages[reason];
  if (voucherMessages[reason]) return voucherMessages[reason];
  const fieldErrors = error?.fieldErrors ?? error?.data?.fieldErrors;
  const firstFieldError = fieldErrors && Object.values(fieldErrors).flat()[0];
  if (firstFieldError) return String(firstFieldError);
  if (error?.data?.detail) return String(error.data.detail);
  if (error?.message && error?.status !== undefined) return error.message;
  if (statusMessages[error?.status]) return statusMessages[error.status];
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
