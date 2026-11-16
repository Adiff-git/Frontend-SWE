// Preview policy and synthetic records; no live API contract is implied.
export const orderStates = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', packing: 'Đang đóng gói', shipping: 'Đang giao hàng', completed: 'Hoàn tất', cancelled: 'Đã hủy' };
export const nextOrderState = { pending: 'confirmed', confirmed: 'packing', packing: 'shipping', shipping: 'completed' };
export function createOperations() {
  const customers = ['Nguyễn Tuấn Anh', 'Lê Hoàng Linh', 'Phạm Thanh Tú', 'Trần Minh Khoa', 'Đỗ Ngọc Mai', 'Vũ Đức Huy'].map((name, i) => ({ id: `customer-${i + 1}`, name, email: `khach${i + 1}@example.com`, phone: `090000000${i}`, joined: `2026-10-${String(10 + i).padStart(2, '0')}`, address: 'Địa chỉ giao hàng minh họa · TP. Hồ Chí Minh', locked: i === 5, version: 1, history: [] }));
  const states = Object.keys(orderStates);
  return {
    customers,
    orders: Array.from({ length: 18 }, (_, i) => ({ id: `CT-${9821 - i}`, customerId: customers[i % 6].id, status: states[i % 6], method: i % 2 ? 'Chuyển khoản mẫu' : 'COD', paid: i % 2 === 1, date: `2026-11-${String(1 + i % 15).padStart(2, '0')}`, version: 1, shippingFee: 30000, discount: 0, tracking: '', items: [{ productId: `product-${i % 8 + 1}`, sku: `SKU-SNAPSHOT-${i + 1}`, name: ['iPhone 15 Pro Max', 'MacBook Pro 14 M3 Pro', 'Samsung Galaxy S24 Ultra', 'iPad Air M2', 'Củ sạc Apple 20W', 'Sony WH-1000XM5', 'Apple Watch Series 9', 'Dell UltraSharp'][i % 8], quantity: 1, price: [29990000,49990000,31490000,16990000,490000,6490000,9990000,12990000][i % 8] }], history: [{ at: '2026-11-01T03:00:00Z', text: 'Đơn hàng mẫu được tạo', actor: 'Khách hàng mẫu' }] })),
    reviews: customers.map((c, i) => ({ id: `review-${i}`, customerId: c.id, productId: `product-${i + 1}`, rating: i === 5 ? 1 : 5 - i % 2, text: ['Màn hình đẹp, dùng mượt. Đóng gói cẩn thận.', 'Máy hoạt động ổn định, đúng cấu hình.', 'Camera rõ, pin dùng tốt.', 'Sản phẩm phù hợp công việc.', 'Phụ kiện nhỏ gọn, dễ sử dụng.', 'Bình luận chứa nội dung quảng cáo không liên quan.'][i], status: i < 2 ? 'pending' : i === 5 ? 'hidden' : 'approved', version: 1, history: [] })),
    promotions: [{ id: 'promo-1', name: 'Chạm tháng 11', code: 'CHAM11', type: 'percent', amount: 10, cap: 500000, minimum: 1000000, limit: 100, perCustomer: 1, used: 8, from: '2026-11-01T00:00', to: '2026-11-30T23:59', enabled: true, scope: '', group: 'all', noStack: true, version: 1 }],
    settings: { version: 1, name: 'Chạm Tech', email: 'support@example.com', phone: '0900000000', branch: 'Chi nhánh minh họa · TP. Hồ Chí Minh', shippingFee: 30000, freeShipping: 5000000, featured: ['product-1', 'product-2'], banners: [{ id: 'banner-1', title: 'Chạm công nghệ, mở trải nghiệm', link: '/products', active: true }] },
  };
}
export const orderTotal = order => order.items.reduce((sum, item) => sum + item.quantity * item.price, 0) - order.discount + order.shippingFee;
export function transitionOrder(order, target, reason, tracking) {
  if (target === 'cancelled') {
    if (!['pending', 'confirmed', 'packing'].includes(order.status)) throw new Error('Không thể hủy đơn đã bàn giao hoặc kết thúc.');
    if (!reason.trim()) throw new Error('Nhập lý do hủy đơn.');
  } else {
    if (nextOrderState[order.status] !== target) throw new Error('Trạng thái đã đổi. Hãy kiểm tra thao tác được phép.');
    if (target === 'shipping' && !tracking.trim()) throw new Error('Nhập mã vận đơn mẫu trước khi bàn giao.');
    if (target === 'shipping' && order.method !== 'COD' && !order.paid) throw new Error('Đơn trả trước cần xác nhận thanh toán. Không thể xác nhận thanh toán thật trong bản xem trước.');
  }
  return { ...order, status: target, tracking: tracking || order.tracking, version: order.version + 1, history: [...order.history, { at: new Date().toISOString(), actor: 'Mai Linh · mẫu', text: target === 'cancelled' ? `Hủy đơn: ${reason}` : orderStates[target] }] };
}
export function promotionStatus(promo, now = '2026-11-16T12:00') {
  if (!promo.enabled) return { key: 'disabled', label: 'Đã tắt', tone: 'neutral' };
  if (Number(promo.used) >= Number(promo.limit)) return { key: 'exhausted', label: 'Hết lượt', tone: 'warning' };
  if (promo.from > now) return { key: 'scheduled', label: 'Đã lên lịch', tone: 'brand' };
  if (promo.to < now) return { key: 'expired', label: 'Hết hạn', tone: 'neutral' };
  return { key: 'active', label: 'Đang bật', tone: 'success' };
}
export function formatDateTime(value) {
  const [date, time] = String(value || '').split('T');
  return date ? `${date.split('-').reverse().join('/')}${time ? ` ${time}` : ''}` : '';
}
export function validatePromotion(draft, promotions) {
  if (!draft.name.trim() || !/^[A-Za-z0-9_-]+$/.test(draft.code.trim())) throw new Error('Nhập tên và mã duy nhất chỉ gồm chữ không dấu, số, gạch nối hoặc gạch dưới.');
  if (promotions.some(p => p.id !== draft.id && p.code.toLowerCase() === draft.code.trim().toLowerCase())) throw new Error('Mã khuyến mãi đã tồn tại.');
  const numericKeys = draft.type === 'percent' ? ['amount', 'cap', 'minimum', 'limit', 'perCustomer'] : ['amount', 'minimum', 'limit', 'perCustomer'];
  for (const key of numericKeys) if (draft[key] === '' || !Number.isSafeInteger(Number(draft[key])) || Number(draft[key]) < 0) throw new Error('Các giá trị tiền và giới hạn phải là số nguyên không âm.');
  if (Number(draft.amount) <= 0 || (draft.type === 'percent' && Number(draft.amount) > 100) || Number(draft.limit) < Math.max(1, draft.used) || Number(draft.perCustomer) < 1) throw new Error('Kiểm tra mức giảm, giới hạn sử dụng và số lượt đã dùng.');
  if (!draft.from || !draft.to || draft.from >= draft.to) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu (UTC+7).');
}
