import { Link } from 'react-router-dom';
import CartItems from './CartItems.jsx';
import CartNotice from './CartNotice.jsx';
import CartSummary from './CartSummary.jsx';
import VoucherPicker from './VoucherPicker.jsx';
import useCart from './useCart.js';
import useVoucherWallet from './useVoucherWallet.js';
import './CartPage.css';

export default function CartPage() {
  const cart = useCart();
  const wallet = useVoucherWallet();
  const message = cart.notice || (cart.isError ? cart.error : '');

  const run = async (action, ...args) => {
    try {
      await action(...args);
    } catch (error) {
      void error;
    }
  };

  function handleCheckout() {
    cart.setNotice('Bước đặt hàng nằm ngoài phạm vi tích hợp giỏ hàng này.');
  }

  async function handleVariantRequest(productId) {
    try {
      await cart.loadVariants(productId);
    } catch {
      cart.setNotice('Không tải được danh sách biến thể.');
    }
  }

  return (
    <main className="cart-page__container">
      <p className="cart-page__breadcrumb">Trang chủ / Giỏ hàng</p>
      <h1 className="cart-page__title">Giỏ hàng của bạn</h1>
      <p className="cart-page__subtitle">Kiểm tra sản phẩm và mã giảm giá trước khi tiếp tục.</p>
      <CartNotice message={message} tone={cart.isError || cart.notice.startsWith('Không') ? 'error' : 'info'} />

      {cart.isLoading ? (
        <div className="cart-page__state" role="status">Đang tải giỏ hàng...</div>
      ) : cart.isError ? (
        <div className="cart-page__state" role="alert">
          Không tải được giỏ hàng.
          <button className="cart-page__retry" type="button" onClick={() => cart.refetch()}>Thử lại</button>
        </div>
      ) : cart.cart.items.length === 0 ? (
        <div className="cart-page__empty">Giỏ hàng của bạn đang trống.</div>
      ) : (
        <>
          <div className="cart-page__layout">
            <CartItems
              cart={cart.cart}
              busy={cart.busy}
              variantOptions={cart.variantOptions}
              onToggleItem={(payload) => run(cart.selectItem, payload)}
              onToggleAll={(selected) => run(cart.selectAll, { selected })}
              onUpdateQuantity={(payload) => run(cart.updateQuantity, payload)}
              onVariantRequest={handleVariantRequest}
              onVariantChange={(payload) => run(cart.changeVariant, payload)}
              onRemoveItem={(payload) => run(cart.removeItem, payload)}
              onRemoveSelected={(itemIds) => run(cart.removeSelected, { itemIds })}
            />
            <CartSummary cart={cart.cart} busy={cart.busy} onCheckout={handleCheckout} />
          </div>
          <VoucherPicker
            entries={wallet.entries}
            appliedVoucher={cart.cart.voucher}
            clearedReason={cart.cart.voucherSelectionClearedReason}
            busy={cart.busy}
            isLoading={wallet.isLoading}
            isError={wallet.isError}
            hasNextPage={wallet.hasNextPage}
            isFetchingNextPage={wallet.isFetchingNextPage}
            onApply={(payload) => run(cart.applyVoucher, payload)}
            onRemove={() => run(cart.removeVoucher)}
            onLoadMore={() => wallet.fetchNextPage()}
          />
        </>
      )}

      <Link className="cart-page__continue" to="/products">Tiếp tục mua sắm</Link>
    </main>
  );
}
