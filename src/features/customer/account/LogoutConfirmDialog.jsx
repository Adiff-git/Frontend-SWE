import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';
import './LogoutConfirmDialog.css';

export default function LogoutConfirmDialog({ open, onClose, onConfirm, pending }) {
  return (
    <Dialog open={open} onClose={onClose} title="Đăng xuất khỏi tài khoản?" maxWidth={520}>
      <p className="logout-dialog__description">
        Bạn có thể đăng nhập lại bất cứ lúc nào để quản lý đơn hàng và địa chỉ nhận hàng.
      </p>
      <div className="logout-dialog__actions">
        <Button
          type="button"
          variant="secondary"
          className="logout-dialog__stay-btn"
          onClick={onClose}
          disabled={pending}
        >
          Ở lại
        </Button>
        <Button
          type="button"
          className="logout-dialog__confirm-btn"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </Button>
      </div>
    </Dialog>
  );
}

