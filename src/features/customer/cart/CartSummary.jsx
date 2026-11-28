import CartNotice from './CartNotice.jsx';
import './CartSummary.css';

export default function CartSummary({ cart, busy = false, onCheckout }) {
  const hasSelection = cart.selectedItemCount > 0;

  return (
    <aside className="cart-summary">
      <section className="cart-summary__card" data-node-id="299:345">
        <h2>Tóm tắt giỏ hàng</h2>
        <CartNotice message={cart.voucherSelectionClearedReason} tone="error" />
        <div className="cart-summary__line">
          <span>Tạm tính ({cart.selectedTotalQuantity} sản phẩm đã chọn)</span>
          <strong>{cart.selectedSubtotalDisplay}</strong>
        </div>
        {cart.voucher && (
          <div className="cart-summary__line cart-summary__line--discount">
            <span>Mã {cart.voucher.code}</span>
            <strong>-{cart.voucher.appliedDiscountDisplay}</strong>
          </div>
        )}
        <div className="cart-summary__total">
          <span>Tổng thanh toán</span>
          <strong>{cart.finalTotalDisplay}</strong>
          <p>Phí vận chuyển được xác nhận ở bước đặt hàng.</p>
        </div>
        <button
          className="cart-summary__checkout"
          type="button"
          disabled={!hasSelection || busy}
          onClick={onCheckout}
        >
          Tiếp tục đặt hàng
        </button>
        <div className="cart-summary__login">
          <strong>Đặt hàng sẽ mở bước tiếp theo</strong>
          <p>Chức năng đặt hàng nằm ngoài phạm vi tích hợp giỏ hàng này.</p>
        </div>
      </section>
      <div className="cart-summary__payment" data-node-id="299:361">Thanh toán khi nhận hàng</div>
    </aside>
  );
}
