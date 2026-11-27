import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Button from '../../../components/Button';
import FormField from '../../../components/FormField';
import {
  createAdminVariant,
  replaceAdminVariantSpecifications,
  setAdminVariantEnabled,
  updateAdminVariant,
} from '../../../api/adminCatalog';
import {
  money,
  optionsMapToRows,
  rowsToOptionsMap,
  rowsToSpecDocument,
  specDocumentToRows,
} from '../adminErrors';
import { Badge, Panel } from '../shared';
import { AdminErrorAlert } from './LiveShared';
import LiveStockDialog from './LiveStockDialog';
import { useLiveAdmin } from './liveAdminContext';

function createEmptyDraft() {
  return {
    id: '',
    sku: '',
    amount: '',
    enabled: true,
    optionRows: [],
    specRows: [],
  };
}

function variantToDraft(variant) {
  return {
    id: variant.id,
    sku: variant.sku || '',
    amount: String(variant.sellingPrice?.amount ?? ''),
    enabled: Boolean(variant.enabled),
    optionRows: optionsMapToRows(variant.options),
    specRows: specDocumentToRows(variant.technicalSpecifications),
    original: variant,
  };
}

export default function LiveVariantPanel({ product, onUpdated, onReloadProduct }) {
  const { notify } = useLiveAdmin();
  const [draft, setDraft] = useState(null);
  const [formError, setFormError] = useState('');
  const [rowErrors, setRowErrors] = useState({ options: {}, specs: {} });
  const [stockVariantId, setStockVariantId] = useState(null);

  const revisions = {
    expectedVersion: product.version,
    expectedTaxonomyVersion: product.taxonomyVersion,
  };

  const resetMutations = () => {
    saveMutation.reset();
    specOnlyMutation.reset();
    toggleMutation.reset();
    setFormError('');
  };

  const reloadAndReset = () => {
    resetMutations();
    onReloadProduct();
  };

  const saveMutation = useMutation({
    mutationFn: async ({ sku, amount, options, technicalSpecifications }) => {
      if (!draft.id) {
        return createAdminVariant(product.id, {
          ...revisions,
          sku,
          sellingPrice: { amount, currency: 'VND' },
          options,
          technicalSpecifications,
          enabled: draft.enabled,
        });
      }

      const orig = draft.original;
      const patch = { ...revisions };
      if (sku !== orig.sku) patch.sku = sku;
      if (amount !== orig.sellingPrice?.amount) patch.sellingPrice = { amount, currency: 'VND' };
      if (JSON.stringify(options) !== JSON.stringify(orig.options || {})) {
        patch.options = options;
      }
      if (JSON.stringify(technicalSpecifications) !== JSON.stringify(orig.technicalSpecifications || { schema_version: 1, values: {} })) {
        patch.technicalSpecifications = technicalSpecifications;
      }
      return updateAdminVariant(product.id, draft.id, patch);
    },
    onSuccess: (res) => {
      notify(`Đã lưu biến thể ${res.variant?.sku || ''}.`);
      setDraft(null);
      setFormError('');
      setRowErrors({ options: {}, specs: {} });
      onUpdated();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ variant, enabled }) =>
      setAdminVariantEnabled(product.id, variant.id, enabled, revisions),
    onSuccess: (res) => {
      notify(`Đã ${res.variant?.enabled ? 'bật' : 'tắt'} biến thể ${res.variant?.sku || ''}.`);
      onUpdated();
    },
  });

  const specOnlyMutation = useMutation({
    mutationFn: async ({ technicalSpecifications }) =>
      replaceAdminVariantSpecifications(product.id, draft.id, {
        ...revisions,
        technicalSpecifications,
      }),
    onSuccess: (res) => {
      notify(`Đã cập nhật thông số kỹ thuật cho ${res.variant?.sku || ''}.`);
      setDraft(null);
      setFormError('');
      onUpdated();
    },
  });

  const handleSaveVariant = () => {
    resetMutations();
    const sku = draft.sku.trim();
    if (!sku) {
      setFormError('Vui lòng nhập SKU.');
      return;
    }
    if (draft.amount === '' || !/^-?[0-9]+$/.test(draft.amount.trim())) {
      setFormError('Giá bán phải là số nguyên (VND).');
      return;
    }
    const optCheck = rowsToOptionsMap(draft.optionRows);
    const specCheck = rowsToSpecDocument(draft.specRows);
    if (!optCheck.valid || !specCheck.valid) {
      setRowErrors({ options: optCheck.rowErrors, specs: specCheck.rowErrors });
      setFormError('Kiểm tra lại thông tin thuộc tính hoặc thông số kỹ thuật.');
      return;
    }
    const amount = Number(draft.amount.trim());
    if (!Number.isSafeInteger(amount)) {
      setFormError('Giá bán vượt quá giới hạn số nguyên an toàn.');
      return;
    }

    if (draft.id) {
      const orig = draft.original;
      const unchanged =
        sku === orig.sku &&
        amount === orig.sellingPrice?.amount &&
        JSON.stringify(optCheck.options) === JSON.stringify(orig.options || {}) &&
        JSON.stringify(specCheck.document) === JSON.stringify(orig.technicalSpecifications || { schema_version: 1, values: {} });
      if (unchanged) {
        setFormError('Chưa có thay đổi nào trên biến thể.');
        return;
      }
    }

    saveMutation.mutate({
      sku,
      amount,
      options: optCheck.options,
      technicalSpecifications: specCheck.document,
    });
  };

  const handleSaveSpecsOnly = () => {
    resetMutations();
    const specCheck = rowsToSpecDocument(draft.specRows);
    if (!specCheck.valid) {
      setRowErrors((prev) => ({ ...prev, specs: specCheck.rowErrors }));
      setFormError('Kiểm tra lại khóa và giá trị thông số kỹ thuật.');
      return;
    }
    specOnlyMutation.mutate({ technicalSpecifications: specCheck.document });
  };

  const variants = product.variants || [];

  return (
    <Panel
      title="Biến thể & thông số kỹ thuật"
      description="Phiên bản sản phẩm hiện tại dùng để khóa đồng bộ khi lưu."
      actions={
        <Button
          type="button"
          size="compact"
          emphasis="outline"
          onClick={() => {
            setRowErrors({ options: {}, specs: {} });
            resetMutations();
            setDraft(createEmptyDraft());
          }}
        >
          Thêm biến thể
        </Button>
      }
    >
      {toggleMutation.error && (
        <AdminErrorAlert error={toggleMutation.error} onReload={reloadAndReset} />
      )}

      {variants.length === 0 ? (
        <p className="admin-helper">Sản phẩm chưa có biến thể nào. Cần ít nhất 1 biến thể đang bật để đăng bán.</p>
      ) : (
        <div className="admin-form">
          {variants.map((v) => (
            <fieldset className="admin-variant" key={v.id}>
              <legend>
                {v.sku} · {money(v.sellingPrice?.amount)}
              </legend>
              <div className="admin-actions" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="admin-actions">
                  <Badge tone={v.enabled ? 'success' : 'neutral'}>
                    {v.enabled ? 'Đang bật' : 'Đang tắt'}
                  </Badge>
                  {Object.entries(v.options || {}).map(([k, val]) => (
                    <Badge key={k} tone="brand">{k}: {val}</Badge>
                  ))}
                </div>
                <div className="admin-actions">
                  <Button
                    type="button"
                    size="compact"
                    emphasis="outline"
                    onClick={() => setStockVariantId(v.id)}
                  >
                    Tồn kho
                  </Button>
                  <Button
                    type="button"
                    size="compact"
                    emphasis="outline"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate({ variant: v, enabled: !v.enabled })}
                  >
                    {v.enabled ? 'Tắt' : 'Bật'}
                  </Button>
                  <Button
                    type="button"
                    size="compact"
                    onClick={() => {
                      setFormError('');
                      setRowErrors({ options: {}, specs: {} });
                      saveMutation.reset();
                      specOnlyMutation.reset();
                      setDraft(variantToDraft(v));
                    }}
                  >
                    Sửa
                  </Button>
                </div>
              </div>
              {Object.keys(v.technicalSpecifications?.values || {}).length > 0 && (
                <small className="admin-block-muted">
                  Thông số:{' '}
                  {Object.entries(v.technicalSpecifications.values)
                    .map(([k, val]) => `${k}=${typeof val === 'object' ? `${val.value}${val.unit}` : val}`)
                    .join(' · ')}
                </small>
              )}
            </fieldset>
          ))}
        </div>
      )}

      {draft && (
        <fieldset className="admin-variant" style={{ marginTop: 20 }}>
          <legend>{draft.id ? `Chỉnh sửa biến thể: ${draft.sku}` : 'Thêm biến thể mới'}</legend>
          <div className="admin-form">
            <div className="admin-field-grid">
              <FormField
                label="SKU *"
                value={draft.sku}
                onChange={(e) => setDraft((p) => ({ ...p, sku: e.target.value }))}
                required
              />
              <FormField
                label="Giá bán (VND) *"
                type="number"
                step="1"
                value={draft.amount}
                onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
                required
              />
            </div>

            {!draft.id && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft((p) => ({ ...p, enabled: e.target.checked }))}
                />
                Bật biến thể ngay khi tạo
              </label>
            )}

            <div>
              <div className="admin-actions" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>Thuộc tính biến thể (options)</strong>
                <Button
                  type="button"
                  size="compact"
                  emphasis="outline"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      optionRows: [...p.optionRows, { id: crypto.randomUUID(), key: '', value: '' }],
                    }))
                  }
                >
                  Thêm thuộc tính
                </Button>
              </div>
              {draft.optionRows.map((row) => {
                const err = rowErrors.options?.[row.id] || {};
                return (
                  <div className="admin-spec-row" key={row.id} style={{ marginBottom: 8 }}>
                    <FormField
                      label="Tên (vd: color)"
                      value={row.key}
                      error={err.key}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          optionRows: p.optionRows.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r)),
                        }))
                      }
                    />
                    <FormField
                      label="Giá trị (vd: Titan)"
                      value={row.value}
                      error={err.value}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          optionRows: p.optionRows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      size="compact"
                      emphasis="outline"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          optionRows: p.optionRows.filter((r) => r.id !== row.id),
                        }))
                      }
                    >
                      Gỡ
                    </Button>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="admin-actions" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>Thông số kỹ thuật (schema v1)</strong>
                <Button
                  type="button"
                  size="compact"
                  emphasis="outline"
                  onClick={() =>
                    setDraft((p) => ({
                      ...p,
                      specRows: [...p.specRows, { id: crypto.randomUUID(), key: '', type: 'string', value: '', unit: '' }],
                    }))
                  }
                >
                  Thêm thông số
                </Button>
              </div>
              {draft.specRows.map((row) => {
                const err = rowErrors.specs?.[row.id] || {};
                return (
                  <div className="admin-spec-row" key={row.id} style={{ marginBottom: 8, gridTemplateColumns: '1fr 120px 1fr auto' }}>
                    <FormField
                      label="Khóa (a-z0-9_)"
                      value={row.key}
                      error={err.key}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          specRows: p.specRows.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r)),
                        }))
                      }
                    />
                    <FormField
                      as="select"
                      label="Kiểu"
                      value={row.type}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          specRows: p.specRows.map((r) =>
                            r.id === row.id
                              ? { ...r, type: e.target.value, value: e.target.value === 'boolean' ? 'true' : r.value }
                              : r,
                          ),
                        }))
                      }
                    >
                      <option value="string">Chuỗi</option>
                      <option value="number">Số</option>
                      <option value="boolean">Đúng/Sai</option>
                      <option value="quantity">Số + đơn vị</option>
                    </FormField>
                    {row.type === 'boolean' ? (
                      <FormField
                        as="select"
                        label="Giá trị"
                        value={row.value}
                        error={err.value}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            specRows: p.specRows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)),
                          }))
                        }
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </FormField>
                    ) : row.type === 'quantity' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <FormField
                          label="Số"
                          type="number"
                          value={row.value}
                          error={err.value}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              specRows: p.specRows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)),
                            }))
                          }
                        />
                        <FormField
                          label="Đơn vị"
                          value={row.unit}
                          error={err.unit}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              specRows: p.specRows.map((r) => (r.id === row.id ? { ...r, unit: e.target.value } : r)),
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <FormField
                        label="Giá trị"
                        type={row.type === 'number' ? 'number' : 'text'}
                        value={row.value}
                        error={err.value}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            specRows: p.specRows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)),
                          }))
                        }
                      />
                    )}
                    <Button
                      type="button"
                      size="compact"
                      emphasis="outline"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          specRows: p.specRows.filter((r) => r.id !== row.id),
                        }))
                      }
                    >
                      Gỡ
                    </Button>
                  </div>
                );
              })}
            </div>

            {formError && <AdminErrorAlert error={formError} />}
            {saveMutation.error && <AdminErrorAlert error={saveMutation.error} onReload={reloadAndReset} />}
            {specOnlyMutation.error && <AdminErrorAlert error={specOnlyMutation.error} onReload={reloadAndReset} />}

            <div className="admin-actions">
              <Button type="button" size="compact" emphasis="outline" onClick={() => setDraft(null)}>
                Đóng
              </Button>
              <Button
                type="button"
                size="compact"
                disabled={saveMutation.isPending}
                onClick={handleSaveVariant}
              >
                {saveMutation.isPending ? 'Đang lưu…' : draft.id ? 'Lưu biến thể' : 'Tạo biến thể'}
              </Button>
              {draft.id && (
                <Button
                  type="button"
                  size="compact"
                  emphasis="outline"
                  disabled={specOnlyMutation.isPending}
                  onClick={handleSaveSpecsOnly}
                >
                  Chỉ thay thông số (PUT)
                </Button>
              )}
            </div>
          </div>
        </fieldset>
      )}

      {stockVariantId && (
        <LiveStockDialog
          key={stockVariantId}
          variantId={stockVariantId}
          onClose={() => setStockVariantId(null)}
        />
      )}
    </Panel>
  );
}
