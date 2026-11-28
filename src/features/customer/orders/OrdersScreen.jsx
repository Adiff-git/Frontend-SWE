import { useMemo, useState } from 'react';
import { ORDER_FIXTURES } from './ordersFixture';
import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';
import searchIcon from '../../../assets/auth/search.svg';
import chevronRightIcon from '../../../assets/account/chevron-right.svg';
import truckIcon from '../../../assets/account/truck.svg';
import infoIcon from '../../../assets/account/info.svg';
import './OrdersScreen.css';

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

const isDevPreview = Boolean(
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_MOCK === 'true'),
);

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  const tabCounts = useMemo(() => {
    if (!isDevPreview) return { ALL: 0, PENDING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 };
    const counts = { ALL: ORDER_FIXTURES.length, PENDING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 };
    for (const ord of ORDER_FIXTURES) {
      if (counts[ord.status] !== undefined) {
        counts[ord.status] += 1;
      }
    }
    return counts;
  }, []);

  const filteredOrders = useMemo(() => {
    if (!isDevPreview) return [];
    const q = searchQuery.trim().toLowerCase();
    return ORDER_FIXTURES.filter((ord) => {
      if (activeTab !== 'ALL' && ord.status !== activeTab) {
        return false;
      }
      if (!q) return true;
      const matchId = ord.id.toLowerCase().includes(q);
      const matchItem = ord.items.some((item) => item.name.toLowerCase().includes(q));
      return matchId || matchItem;
    });
  }, [activeTab, searchQuery]);

  const handleActionClick = (actionName, orderId) => {
    setActionNotice({
      title: `${actionName} #${orderId}`,
      message:
        'Hệ thống theo dõi và xử lý đơn hàng đang trong quá trình phát triển backend. Tính năng này sẽ sẵn sàng khi dịch vụ đơn hàng chính thức được triển khai.',
    });
  };

  if (!isDevPreview) {
    return (
      <div className="orders-screen">
        <div className="orders-screen__header">
          <h1 className="orders-screen__title">Đơn hàng của tôi</h1>
          <p className="orders-screen__subtitle">
            Theo dõi trạng thái và xem lại những sản phẩm bạn đã đặt mua.
          </p>
        </div>

        <div className="orders-screen__unavailable">
          <img src={infoIcon} alt="" className="orders-screen__unavailable-icon" width="32" height="32" />
          <h2 className="orders-screen__unavailable-title">Dịch vụ đơn hàng hiện chưa khả dụng</h2>
          <p className="orders-screen__unavailable-desc">
            Tính năng tra cứu đơn hàng trực tuyến đang được đồng bộ với hệ thống quản lý vận hành. Vui lòng liên hệ tổng đài <strong>1800 6868</strong> (miễn phí) để được hỗ trợ kiểm tra đơn hàng trực tiếp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-screen">
      {/* Page Title */}
      <div className="orders-screen__header">
        <h1 className="orders-screen__title">Đơn hàng của tôi</h1>
        <p className="orders-screen__subtitle">
          Theo dõi trạng thái và xem lại những sản phẩm bạn đã đặt mua.
        </p>
      </div>

      {/* Dev preview banner */}
      <div className="orders-screen__fixture-notice">
        <img src={infoIcon} alt="" className="orders-screen__fixture-icon" width="18" height="18" />
        <p className="orders-screen__fixture-text">
          <strong>Bản xem trước giao diện:</strong> Dữ liệu đơn hàng mẫu đang trong quá trình phát triển backend.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="orders-screen__filter-wrap">
        {/* Status Tabs */}
        <div className="orders-screen__tabs" role="tablist" aria-label="Lọc đơn hàng theo trạng thái">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`orders-screen__tab ${isActive ? 'orders-screen__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="orders-screen__search-wrap">
          <img src={searchIcon} alt="" className="orders-screen__search-icon" width="18" height="18" />
          <input
            type="text"
            className="orders-screen__search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm"
          />
        </div>
      </div>

      {/* Order Cards List */}
      <div className="orders-screen__list">
        {filteredOrders.length === 0 ? (
          <div className="orders-screen__empty">
            <p className="orders-screen__empty-title">Không tìm thấy đơn hàng phù hợp</p>
            <p className="orders-screen__empty-desc">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang tab trạng thái khác.
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div key={ord.id} className="order-card">
              {/* Order Info Row */}
              <div className="order-card__header">
                <span className="order-card__id">#{ord.id}</span>
                <span className="order-card__date">
                  Đặt ngày {ord.createdAt} · {ord.items.length} sản phẩm
                </span>
                <div className="order-card__badge">
                  <span>{ord.statusLabel}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-card__items">
                {ord.items.map((item) => (
                  <div key={item.id} className="order-card__item">
                    <div className="order-card__item-img-wrap">
                      <img src={item.image} alt={item.name} className="order-card__item-img" />
                    </div>
                    <div className="order-card__item-info">
                      <p className="order-card__item-name">{item.name}</p>
                      <p className="order-card__item-variant">{item.variant}</p>
                    </div>
                    <span className="order-card__item-price">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Payment and Total Row */}
              <div className="order-card__total-row">
                <p className="order-card__payment-info">{ord.paymentText}</p>
                <div className="order-card__total-wrap">
                  <span className="order-card__total-label">Thành tiền:</span>
                  <span className="order-card__total-price">{ord.totalPrice}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="order-card__actions">
                <button
                  type="button"
                  className="order-card__detail-btn"
                  onClick={() => handleActionClick('Chi tiết đơn', ord.id)}
                >
                  <span>Xem chi tiết</span>
                  <img src={chevronRightIcon} alt="" width="16" height="16" />
                </button>

                {ord.status === 'SHIPPING' && (
                  <Button
                    type="button"
                    className="order-card__action-btn"
                    onClick={() => handleActionClick('Theo dõi đơn', ord.id)}
                  >
                    <img src={truckIcon} alt="" width="18" height="18" />
                    <span>Theo dõi đơn hàng</span>
                  </Button>
                )}

                {ord.status === 'DELIVERED' && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="order-card__action-btn"
                    onClick={() => handleActionClick('Mua lại', ord.id)}
                  >
                    Mua lại
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Dialog for in-progress features */}
      <Dialog
        open={Boolean(actionNotice)}
        onClose={() => setActionNotice(null)}
        title={actionNotice?.title || 'Thông báo'}
        maxWidth={460}
      >
        <p style={{ margin: '0 0 20px', color: '#5f5f66', fontSize: '14px', lineHeight: 1.55 }}>
          {actionNotice?.message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="button" onClick={() => setActionNotice(null)}>
            Đã hiểu
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

