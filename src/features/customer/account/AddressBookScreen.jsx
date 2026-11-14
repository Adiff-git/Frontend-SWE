import { useCallback, useState } from 'react';
import useAddresses from './useAddresses';
import AddressCard from './AddressCard';
import AddressFormDialog from './AddressFormDialog';
import AddressDeleteDialog from './AddressDeleteDialog';
import Button from '../../../components/Button';
import plusIcon from '../../../assets/account/plus.svg';
import infoIcon from '../../../assets/account/info.svg';
import './AddressBookScreen.css';

const MAX_ADDRESSES = 20;

export default function AddressBookScreen() {
  const {
    addresses,
    count,
    isLoading,
    isError,
    error,
    refetch,
    invalidate,
    createAddress,
    isCreating,
    updateAddress,
    isUpdating,
    deleteAddress,
    isDeleting,
    setDefault,
  } = useAddresses();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [notice, setNotice] = useState(null);

  const handleOpenAdd = useCallback(() => {
    setEditingAddress(null);
    setFormDialogOpen(true);
    setNotice(null);
  }, []);

  const handleOpenEdit = useCallback((addr) => {
    setEditingAddress(addr);
    setFormDialogOpen(true);
    setNotice(null);
  }, []);

  const handleOpenDelete = useCallback((addr) => {
    setDeletingTarget(addr);
    setDeleteError(null);
    setDeleteDialogOpen(true);
    setNotice(null);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setFormDialogOpen(false);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingTarget(null);
    setDeleteError(null);
  }, []);

  const handleFormSubmit = async (payload) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
        setNotice({ type: 'success', text: 'Cập nhật địa chỉ nhận hàng thành công.' });
      } else {
        await createAddress(payload);
        setNotice({ type: 'success', text: 'Thêm địa chỉ nhận hàng mới thành công.' });
      }
    } catch (err) {
      if (err?.status === 404) {
        invalidate();
      }
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeleteError(null);
    try {
      await deleteAddress(deletingTarget.id);
      setDeleteDialogOpen(false);
      setDeletingTarget(null);
      setNotice({ type: 'success', text: 'Đã xóa địa chỉ nhận hàng.' });
    } catch (err) {
      if (err?.status === 404) {
        invalidate();
        setDeleteDialogOpen(false);
        setDeletingTarget(null);
        setNotice({
          type: 'error',
          text: 'Địa chỉ này không còn tồn tại trên hệ thống (có thể đã bị xóa ở phiên khác).',
        });
      } else {
        setDeleteError(err?.message || 'Không thể xóa địa chỉ này. Vui lòng thử lại.');
      }
    }
  };

  const handleSetDefault = async (addr) => {
    setSettingDefaultId(addr.id);
    setNotice(null);
    try {
      await setDefault(addr);
      setNotice({
        type: 'success',
        text: `Đã đặt "${addr.recipientName}" làm địa chỉ mặc định.`,
      });
    } catch (err) {
      if (err?.status === 404) {
        invalidate();
        setNotice({
          type: 'error',
          text: 'Địa chỉ này không còn tồn tại trên hệ thống (có thể đã bị xóa ở phiên khác).',
        });
      } else {
        setNotice({
          type: 'error',
          text: err?.message || 'Không thể đổi địa chỉ mặc định. Vui lòng thử lại.',
        });
      }
    } finally {
      setSettingDefaultId(null);
    }
  };

  const isLimitReached = count >= MAX_ADDRESSES;

  return (
    <div className="address-screen">
      {/* Page Title & Add Button */}
      <div className="address-screen__header">
        <div className="address-screen__header-info">
          <h1 className="address-screen__title">Sổ địa chỉ nhận hàng</h1>
          <p className="address-screen__subtitle">
            {count > 0
              ? `Bạn đã lưu ${count} địa chỉ. Chọn địa chỉ để nhận hàng nhanh chóng.`
              : 'Quản lý danh sách địa chỉ nhận hàng để thanh toán nhanh chóng hơn.'}
          </p>
        </div>
        <Button
          type="button"
          className="address-screen__add-btn"
          onClick={handleOpenAdd}
          disabled={isLimitReached || isLoading}
          title={isLimitReached ? `Tối đa ${MAX_ADDRESSES} địa chỉ` : undefined}
        >
          <img src={plusIcon} alt="" className="address-screen__add-icon" width="18" height="18" />
          <span>Thêm địa chỉ mới</span>
        </Button>
      </div>

      {isLimitReached && (
        <div className="address-screen__limit-notice" role="note">
          Bạn đã đạt số lượng tối đa {MAX_ADDRESSES} địa chỉ. Vui lòng xóa bớt địa chỉ cũ để thêm địa chỉ mới.
        </div>
      )}

      {notice && (
        <div
          className={`address-screen__alert address-screen__alert--${notice.type}`}
          role="status"
          aria-live="polite"
        >
          {notice.text}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="address-screen__loading">
          <p>Đang tải danh sách địa chỉ…</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="address-screen__error" role="alert">
          <p>{error?.message || 'Không thể tải danh sách địa chỉ.'}</p>
          <Button type="button" variant="secondary" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && count === 0 && (
        <div className="address-screen__empty">
          <p className="address-screen__empty-title">Bạn chưa có địa chỉ nhận hàng nào</p>
          <p className="address-screen__empty-desc">
            Thêm địa chỉ nhận hàng để việc đặt hàng và thanh toán diễn ra thuận tiện nhất.
          </p>
          <Button type="button" onClick={handleOpenAdd}>
            Thêm địa chỉ đầu tiên
          </Button>
        </div>
      )}

      {/* Address cards list */}
      {!isLoading && !isError && count > 0 && (
        <div className="address-screen__list">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onSetDefault={handleSetDefault}
              isSettingDefault={settingDefaultId === addr.id}
            />
          ))}
        </div>
      )}

      {/* Bottom info banner */}
      <div className="address-screen__info-note">
        <img src={infoIcon} alt="" className="address-screen__info-icon" width="18" height="18" />
        <p className="address-screen__info-text">
          Địa chỉ mặc định sẽ được tự động chọn khi bạn thanh toán đơn hàng mới.
        </p>
      </div>

      {/* Add / Edit Form Modal */}
      <AddressFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        initialData={editingAddress}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <AddressDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        address={deletingTarget}
        isPending={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
