import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import FormField from '../../../components/FormField';
import {
  correctAdminInventory,
  getAdminInventoryVariant,
  replenishAdminInventory,
} from '../../../api/adminInventory';
import useAuth from '../../../hooks/useAuth';
import { STOCK_STATUS_LABELS } from '../adminErrors';
import { AdminErrorAlert } from './LiveShared';
import { useLiveAdmin } from './liveAdminContext';

const POSITIVE_INT = /^[1-9][0-9]*$/;
const NONZERO_INT = /^-?[1-9][0-9]*$/;

export default function LiveStockDialog({ variantId, initialVariant, onClose, onSaved }) {
  const { generation } = useAuth();
  const { notify } = useLiveAdmin();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('replenish');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [operationId, setOperationId] = useState(() => crypto.randomUUID());
  const [validationError, setValidationError] = useState('');

  const detailQuery = useQuery({
    queryKey: ['admin', 'inventory', 'detail', variantId, generation],
    queryFn: ({ signal }) => getAdminInventoryVariant(variantId, { signal }),
    initialData: initialVariant,
    retry: false,
  });

  const variant = detailQuery.data;

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmedDelta = delta.trim();
      if (mode === 'replenish') {
        if (!POSITIVE_INT.test(trimmedDelta)) {
          throw new Error('Số lượng nhập thêm phải là số nguyên dương (vd: 10).');
        }
        return replenishAdminInventory(variantId, {
          operationId,
          delta: trimmedDelta,
          reason,
        });
      }
      if (!NONZERO_INT.test(trimmedDelta)) {
        throw new Error('Số lượng điều chỉnh phải là số nguyên khác 0 (vd: 5 hoặc -2).');
      }
      if (!reason.trim()) {
        throw new Error('Điều chỉnh tồn kho bắt buộc phải nhập lý do.');
      }
      return correctAdminInventory(variantId, {
        operationId,
        delta: trimmedDelta,
        reason,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      notify(`Đã cập nhật tồn kho SKU ${variant?.sku || ''}: còn ${result.onHandAfter} (khả dụng ${result.availableAfter}).`);
      onSaved?.(result);
      onClose();
    },
  });

  const submit = (event) => {
    event.preventDefault();
    setValidationError('');
    const trimmedDelta = delta.trim();
    if (mode === 'replenish' && !POSITIVE_INT.test(trimmedDelta)) {
      setValidationError('Số lượng nhập thêm phải là số nguyên dương (vd: 10).');
      return;
    }
    if (mode === 'correct') {
      if (!NONZERO_INT.test(trimmedDelta)) {
        setValidationError('Số lượng điều chỉnh phải là số nguyên khác 0 (vd: 5 hoặc -2).');
        return;
      }
      if (!reason.trim()) {
        setValidationError('Điều chỉnh kiểm kê bắt buộc phải nhập lý do.');
        return;
      }
    }
    mutation.mutate();
  };

  let previewAfter = null;
  if (variant?.onHand != null && NONZERO_INT.test(delta.trim())) {
    if (mode === 'replenish' && POSITIVE_INT.test(delta.trim())) {
      try {
        previewAfter = (BigInt(variant.onHand) + BigInt(delta.trim())).toString();
      } catch {
        previewAfter = null;
      }
    } else if (mode === 'correct') {
      try {
        previewAfter = (BigInt(variant.onHand) + BigInt(delta.trim())).toString();
      } catch {
        previewAfter = null;
      }
    }
  }

  return (
    <Dialog open title="Cập nhật tồn kho biến thể" onClose={onClose} maxWidth={620}>
      <form className="admin-form" onSubmit={submit} noValidate>
        <div>
          <h3>{variant?.productName || 'Biến thể'}</h3>
          <p className="admin-helper">
            SKU: <strong>{variant?.sku || variantId}</strong> · Trạng thái: {STOCK_STATUS_LABELS[variant?.stockStatus] || variant?.stockStatus || '—'}
          </p>
        </div>

        <div className="admin-stock-summary">
          <span>Hiện có <strong>{variant?.onHand ?? '—'}</strong></span>
          <span>Đã giữ chỗ <strong>{variant?.reserved ?? '—'}</strong></span>
          <span>Có thể bán <strong>{variant?.available ?? '—'}</strong></span>
        </div>

        <FormField
          as="select"
          label="Loại thao tác"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setOperationId(crypto.randomUUID());
            setValidationError('');
            mutation.reset();
          }}
        >
          <option value="replenish">Nhập kho bổ sung (POST /replenishments)</option>
          <option value="correct">Điều chỉnh kiểm kê +/- (POST /corrections)</option>
        </FormField>

        <FormField
          label={mode === 'replenish' ? 'Số lượng nhập thêm *' : 'Mức thay đổi (+/-) *'}
          placeholder={mode === 'replenish' ? 'Ví dụ: 15' : 'Ví dụ: -2 hoặc 5'}
          value={delta}
          onChange={(e) => {
            setDelta(e.target.value);
            setOperationId(crypto.randomUUID());
            setValidationError('');
          }}
          required
        />

        {previewAfter !== null && (
          <p className="admin-stock-result">
            Dự kiến hiện có sau thao tác: <strong>{previewAfter}</strong>
          </p>
        )}

        <FormField
          as="textarea"
          rows={3}
          label={mode === 'correct' ? 'Lý do điều chỉnh *' : 'Ghi chú nhập kho (không bắt buộc)'}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setOperationId(crypto.randomUUID());
            setValidationError('');
          }}
          required={mode === 'correct'}
        />

        {detailQuery.error && <AdminErrorAlert error={detailQuery.error} onReload={() => detailQuery.refetch()} />}
        {validationError && <AdminErrorAlert error={validationError} />}
        {mutation.error && <AdminErrorAlert error={mutation.error} onReload={() => detailQuery.refetch()} />}

        <div className="admin-actions">
          <button
            type="button"
            className="admin-text-link"
            onClick={() => detailQuery.refetch()}
            disabled={detailQuery.isFetching}
          >
            {detailQuery.isFetching ? 'Đang tải lại…' : 'Tải lại số liệu tồn kho'}
          </button>
        </div>

        <div className="admin-dialog-actions">
          <Button type="button" size="compact" emphasis="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" size="compact" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu…' : 'Xác nhận'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
