import mapPinIcon from '../../../assets/account/map-pin.svg';
import building2Icon from '../../../assets/account/building-2.svg';
import houseIcon from '../../../assets/account/house.svg';

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
}) {
  // Visual icon selection
  const icon = address.isDefault ? building2Icon : houseIcon || mapPinIcon;

  return (
    <div className="address-card">
      <div className="address-card__icon-wrap">
        <img src={icon} alt="" className="address-card__type-icon" width="20" height="20" />
      </div>

      <div className="address-card__content">
        <div className="address-card__title-row">
          <p className="address-card__title">
            {address.isDefault ? 'Địa chỉ mặc định' : 'Địa chỉ nhận hàng'}
          </p>
          {address.isDefault && (
            <div className="address-card__default-badge">
              <span>Mặc định</span>
            </div>
          )}
        </div>

        <div className="address-card__recipient-row">
          <span className="address-card__recipient-name">{address.recipientName}</span>
          <span className="address-card__recipient-sep" aria-hidden="true">|</span>
          <span className="address-card__recipient-phone">{address.recipientPhone}</span>
        </div>

        <p className="address-card__address-text">{address.addressText}</p>

        {!address.isDefault && (
          <button
            type="button"
            className="address-card__set-default-btn"
            onClick={() => onSetDefault(address)}
            disabled={isSettingDefault}
          >
            {isSettingDefault ? 'Đang đặt…' : 'Đặt làm địa chỉ mặc định'}
          </button>
        )}
      </div>

      <div className="address-card__actions">
        <button
          type="button"
          className="address-card__action-btn address-card__action-btn--edit"
          onClick={() => onEdit(address)}
        >
          Chỉnh sửa
        </button>
        {!address.isDefault && (
          <button
            type="button"
            className="address-card__action-btn address-card__action-btn--delete"
            onClick={() => onDelete(address)}
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
}

