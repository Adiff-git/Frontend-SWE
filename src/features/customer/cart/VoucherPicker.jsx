import './VoucherPicker.css';

export default function VoucherPicker({
  entries = [],
  appliedVoucher,
  clearedReason,
  busy = false,
  isLoading = false,
  isError = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onApply,
  onRemove,
  onLoadMore,
}) {
  return (
    <section className="voucher-picker" aria-labelledby="voucher-picker-title">
      <div className="voucher-picker__head">
        <h2 id="voucher-picker-title">Mã giảm giá của bạn</h2>
        {appliedVoucher && (
          <button type="button" disabled={busy} onClick={onRemove}>
            Bỏ mã {appliedVoucher.code}
          </button>
        )}
      </div>
      {clearedReason && <p className="voucher-picker__reason">{clearedReason}</p>}
      {isLoading && <p>Đang tải mã giảm giá...</p>}
      {isError && <p>Không tải được danh sách mã giảm giá.</p>}
      {!isLoading && !isError && entries.length === 0 && <p>Bạn chưa có mã giảm giá khả dụng.</p>}
      <div className="voucher-picker__list">
        {entries.map((voucher) => (
          <article key={voucher.walletEntitlementId} className="voucher-picker__item">
            <div>
              <strong>{voucher.code}</strong>
              <span>{voucher.title}</span>
              <p>{voucher.discountText}</p>
              {!voucher.applicable && voucher.ineligibilityReason && (
                <small>{voucher.ineligibilityReason}</small>
              )}
            </div>
            <button
              type="button"
              disabled={busy || !voucher.applicable}
              onClick={() => onApply?.({ walletEntitlementId: voucher.walletEntitlementId })}
            >
              {appliedVoucher?.walletEntitlementId === voucher.walletEntitlementId ? 'Đang áp dụng' : 'Áp dụng'}
            </button>
          </article>
        ))}
      </div>
      {hasNextPage && (
        <button className="voucher-picker__more" type="button" disabled={isFetchingNextPage} onClick={onLoadMore}>
          {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm mã'}
        </button>
      )}
    </section>
  );
}
