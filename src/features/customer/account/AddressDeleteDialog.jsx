import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';

export default function AddressDeleteDialog({
  open,
  onClose,
  onConfirm,
  address,
  isPending,
  error = null,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Xóa địa chỉ nhận hàng?"
      maxWidth={480}
      dismissible={!isPending}
    >
      {error && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-error-subtle, #fff0ee)',
            color: 'var(--color-error, #ba1a1a)',
            border: '1px solid #f5c6cb',
            fontSize: '13px',
          }}
          role="alert"
        >
          {error}
        </div>
      )}
      <p style={{ margin: '0 0 20px', color: '#5f5f66', fontSize: '14px', lineHeight: 1.55 }}>
        Bạn có chắc chắn muốn xóa địa chỉ của <strong>{address?.recipientName}</strong> (
        {address?.addressText})? Thao tác này không thể hoàn tác.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          style={{ backgroundColor: '#ba1a1a', borderColor: '#ba1a1a', color: '#ffffff' }}
        >
          {isPending ? 'Đang xóa…' : 'Xóa địa chỉ'}
        </Button>
      </div>
    </Dialog>
  );
}
