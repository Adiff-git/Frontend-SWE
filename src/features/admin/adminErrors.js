export const money = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

export const PRODUCT_STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đang bán',
  UNPUBLISHED: 'Tạm ẩn',
  ARCHIVED: 'Đã lưu trữ',
};

export const PRODUCT_STATUS_TONES = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  UNPUBLISHED: 'neutral',
  ARCHIVED: 'neutral',
};

export const STOCK_STATUS_LABELS = {
  IN_STOCK: 'Còn hàng',
  OUT_OF_STOCK: 'Hết hàng',
  UNAVAILABLE: 'Chưa có tồn kho',
};

const CODE_MESSAGES = {
  CATALOG_STALE_VERSION: 'Dữ liệu đã thay đổi trên máy chủ. Tải lại phiên bản mới nhất trước khi lưu.',
  CATALOG_INVALID_TRANSITION: 'Không thể chuyển trạng thái sản phẩm từ trạng thái hiện tại.',
  CATALOG_DEPENDENCY_CONFLICT: 'Không thể xóa vì vẫn còn sản phẩm hoặc danh mục con liên kết.',
  CATALOG_NAME_CONFLICT: 'Tên đã tồn tại trong phạm vi này.',
  CATALOG_SKU_CONFLICT: 'Mã SKU đã tồn tại.',
  CATALOG_OPTION_CONFLICT: 'Tổ hợp thuộc tính biến thể bị trùng hoặc thiếu khi sản phẩm có nhiều biến thể.',
  CATALOG_GALLERY_CONFLICT: 'Thao tác thư viện ảnh xung đột với trạng thái hiện tại.',
  CATALOG_PUBLICATION_INVALID: 'Sản phẩm chưa đủ điều kiện đăng bán.',
  CATALOG_VALIDATION_FAILED: 'Dữ liệu không hợp lệ theo quy tắc nghiệp vụ.',
  CATALOG_CONCURRENT_CONFLICT: 'Dữ liệu đang được cập nhật đồng thời. Vui lòng tải lại và thử lại.',
  CATALOG_RESOURCE_NOT_FOUND: 'Không tìm thấy bản ghi yêu cầu.',
  INVENTORY_ARCHIVED: 'Không thể điều chỉnh tồn kho cho sản phẩm đã lưu trữ.',
  INVENTORY_BALANCE_UNAVAILABLE: 'Biến thể chưa có bản ghi tồn kho khả dụng.',
  INVENTORY_RESERVATION_FLOOR: 'Số lượng điều chỉnh làm tồn kho xuống thấp hơn lượng đang giữ chỗ.',
  INVENTORY_OPERATION_CONFLICT: 'Mã thao tác (operationId) đã được dùng với dữ liệu khác.',
  INVENTORY_CONCURRENT_CONFLICT: 'Xung đột cập nhật tồn kho đồng thời. Vui lòng thử lại.',
  INVENTORY_INVALID_QUANTITY: 'Số lượng phải là số nguyên khác 0 hợp lệ.',
  INVENTORY_INVALID_REASON: 'Lý do điều chỉnh không hợp lệ hoặc vượt quá 500 ký tự.',
};

/**
 * Format an ApiError or generic Error into a safe Vietnamese message and optional detail lines.
 */
export function formatAdminError(err) {
  if (!err) return { message: 'Đã xảy ra lỗi không xác định.', details: [], isStale: false };
  const code = err.code || err.data?.code;
  const details = [];

  if (Array.isArray(err.violations) && err.violations.length > 0) {
    err.violations.forEach((v) => {
      details.push([v.path, v.message || v.code].filter(Boolean).join(': '));
    });
  } else if (Array.isArray(err.data?.violations) && err.data.violations.length > 0) {
    err.data.violations.forEach((v) => {
      details.push([v.path, v.message || v.code].filter(Boolean).join(': '));
    });
  }

  if (err.fieldErrors && typeof err.fieldErrors === 'object') {
    Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
      if (Array.isArray(msgs)) {
        msgs.forEach((m) => details.push(`${field}: ${m}`));
      }
    });
  }

  if (code === 'INVENTORY_RESERVATION_FLOOR' && err.data) {
    const { onHand, reserved, available } = err.data;
    if (onHand !== undefined || reserved !== undefined) {
      details.push(`Hiện có: ${onHand ?? '—'} · Đã giữ chỗ: ${reserved ?? '—'} · Khả dụng: ${available ?? '—'}`);
    }
  }

  if (code === 'CATALOG_STALE_VERSION' && err.data) {
    if (err.data.expectedVersion !== undefined || err.data.currentVersion !== undefined) {
      details.push(`Phiên bản gửi lên: ${err.data.expectedVersion ?? '—'} · Phiên bản hiện tại: ${err.data.currentVersion ?? '—'}`);
    }
    if (err.data.expectedTaxonomyVersion !== undefined || err.data.currentTaxonomyVersion !== undefined) {
      details.push(`Phiên bản phân loại gửi lên: ${err.data.expectedTaxonomyVersion ?? '—'} · Hiện tại: ${err.data.currentTaxonomyVersion ?? '—'}`);
    }
  }

  const baseMessage =
    (code && CODE_MESSAGES[code]) ||
    (err.status === 401 && 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') ||
    (err.status === 403 && 'Tài khoản hiện tại không có quyền quản trị viên (ROLE_ADMIN).') ||
    (err.status === 503 && 'Dịch vụ lưu trữ hoặc hệ thống tạm thời gián đoạn.') ||
    err.message ||
    'Yêu cầu thất bại.';

  return {
    message: baseMessage,
    code,
    details,
    isStale: code === 'CATALOG_STALE_VERSION',
  };
}

/**
 * Convert technicalSpecifications document ({ schema_version: 1, values }) into editable rows.
 */
export function specDocumentToRows(doc) {
  const values = doc?.values && typeof doc.values === 'object' ? doc.values : {};
  return Object.entries(values).map(([key, raw]) => {
    if (typeof raw === 'boolean') {
      return { id: crypto.randomUUID(), key, type: 'boolean', value: String(raw), unit: '' };
    }
    if (typeof raw === 'number') {
      return { id: crypto.randomUUID(), key, type: 'number', value: String(raw), unit: '' };
    }
    if (raw && typeof raw === 'object' && 'value' in raw && 'unit' in raw) {
      return { id: crypto.randomUUID(), key, type: 'quantity', value: String(raw.value), unit: String(raw.unit) };
    }
    return { id: crypto.randomUUID(), key, type: 'string', value: String(raw ?? ''), unit: '' };
  });
}

/**
 * Validate and convert editable rows back to { schema_version: 1, values }.
 */
export function rowsToSpecDocument(rows) {
  const values = {};
  const rowErrors = {};
  const seen = new Set();

  for (const row of rows) {
    const key = row.key.trim();
    const rowErr = {};
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      rowErr.key = 'Khóa phải là chữ thường, bắt đầu bằng a-z và chỉ gồm a-z, 0-9, _ (vd: ram_gb).';
    } else if (seen.has(key)) {
      rowErr.key = 'Khóa thông số bị trùng.';
    }
    seen.add(key);

    if (row.type === 'boolean') {
      if (!['true', 'false'].includes(row.value)) rowErr.value = 'Chọn true hoặc false.';
      else values[key] = row.value === 'true';
    } else if (row.type === 'number') {
      const rawValue = String(row.value ?? '').trim();
      const num = Number(rawValue);
      if (!rawValue || !Number.isFinite(num)) rowErr.value = 'Nhập số hợp lệ.';
      else values[key] = num;
    } else if (row.type === 'quantity') {
      const rawValue = String(row.value ?? '').trim();
      const num = Number(rawValue);
      const unit = row.unit.trim();
      if (!rawValue || !Number.isFinite(num)) rowErr.value = 'Nhập số hợp lệ.';
      if (!unit) rowErr.unit = 'Nhập đơn vị (vd: GB, inch).';
      if (!rowErr.value && !rowErr.unit) values[key] = { value: num, unit };
    } else {
      const text = row.value.trim();
      if (!text) rowErr.value = 'Nhập giá trị thông số.';
      else values[key] = text;
    }

    if (Object.keys(rowErr).length) rowErrors[row.id] = rowErr;
  }

  return {
    document: { schema_version: 1, values },
    rowErrors,
    valid: Object.keys(rowErrors).length === 0,
  };
}

export function optionsMapToRows(options) {
  if (!options || typeof options !== 'object') return [];
  return Object.entries(options).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: String(value ?? ''),
  }));
}

export function rowsToOptionsMap(rows) {
  const result = {};
  const rowErrors = {};
  const seen = new Set();

  for (const row of rows) {
    const key = row.key.trim();
    const val = row.value.trim();
    const rowErr = {};
    if (!key) rowErr.key = 'Nhập tên thuộc tính (vd: color, storage).';
    else if (seen.has(key)) rowErr.key = 'Tên thuộc tính bị trùng.';
    seen.add(key);
    if (!val) rowErr.value = 'Nhập giá trị thuộc tính.';
    if (Object.keys(rowErr).length) rowErrors[row.id] = rowErr;
    else result[key] = val;
  }

  return {
    options: result,
    rowErrors,
    valid: Object.keys(rowErrors).length === 0,
  };
}
