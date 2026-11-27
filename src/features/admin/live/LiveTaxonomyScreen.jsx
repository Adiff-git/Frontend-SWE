import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import FormField from '../../../components/FormField';
import {
  createAdminBrand,
  createAdminCategory,
  deleteAdminBrand,
  deleteAdminCategory,
  listAllAdminTaxonomy,
  listAdminBrands,
  listAdminCategories,
  updateAdminBrand,
  updateAdminCategory,
} from '../../../api/adminCatalog';
import useAuth from '../../../hooks/useAuth';
import { AdminTable, Badge, Empty, PageHeading, Pagination, Panel } from '../shared';
import { useListState } from '../useListState';
import { AdminErrorAlert } from './LiveShared';
import { useLiveAdmin } from './liveAdminContext';

const BRAND_CODE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function buildCategoryRows(items, q) {
  if (q) {
    const lower = q.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(lower)).map((c) => ({ ...c, depth: 0 }));
  }
  const byParent = new Map();
  items.forEach((item) => {
    const key = item.parentCategoryId || '';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  });
  const rows = [];
  const visited = new Set();
  const visit = (parentId = '', depth = 0) => {
    (byParent.get(parentId) || []).forEach((item) => {
      if (visited.has(item.id)) return;
      visited.add(item.id);
      rows.push({ ...item, depth });
      visit(item.id, depth + 1);
    });
  };
  visit('', 0);
  // Append any orphan rows whose parent wasn't visited
  items.forEach((item) => {
    if (!visited.has(item.id)) rows.push({ ...item, depth: 0 });
  });
  return rows;
}

export default function LiveTaxonomyScreen({ kind }) {
  const { generation } = useAuth();
  const { notify } = useLiveAdmin();
  const queryClient = useQueryClient();
  const { params, update, requestedPage, size, clear } = useListState();

  const isCategory = kind === 'categories';
  const noun = isCategory ? 'danh mục' : 'thương hiệu';
  const q = params.get('q') || '';

  const [draft, setDraft] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [validationError, setValidationError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', kind, 'all', generation],
    queryFn: ({ signal }) =>
      listAllAdminTaxonomy(isCategory ? listAdminCategories : listAdminBrands, { sort: 'name,asc', signal }),
    retry: false,
  });

  const allItems = listQuery.data?.items || [];
  const taxonomyVersion = listQuery.data?.taxonomyVersion ?? '0';

  const rows = isCategory
    ? buildCategoryRows(allItems, q)
    : allItems.filter((b) => !q || `${b.name} ${b.code}`.toLowerCase().includes(q.toLowerCase()));

  const page = Math.min(requestedPage, Math.max(1, Math.ceil(rows.length / size)));
  const pagedRows = rows.slice((page - 1) * size, page * size);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = draft.name.trim();
      if (!trimmedName) throw new Error(`Vui lòng nhập tên ${noun}.`);

      if (isCategory) {
        if (draft.id) {
          const payload = {
            expectedVersion: draft.version,
            expectedTaxonomyVersion: taxonomyVersion,
          };
          if (trimmedName !== draft.originalName) payload.name = trimmedName;
          const nextParent = draft.parentCategoryId || null;
          if (nextParent !== (draft.originalParentId || null)) payload.parentCategoryId = nextParent;
          if (!('name' in payload) && !('parentCategoryId' in payload)) {
            throw new Error('Chưa có thay đổi nào để lưu.');
          }
          return updateAdminCategory(draft.id, payload);
        }
        return createAdminCategory({
          expectedTaxonomyVersion: taxonomyVersion,
          name: trimmedName,
          parentCategoryId: draft.parentCategoryId || null,
        });
      }

      if (draft.id) {
        if (trimmedName === draft.originalName) throw new Error('Chưa có thay đổi nào để lưu.');
        return updateAdminBrand(draft.id, { expectedVersion: draft.version, name: trimmedName });
      }
      const code = draft.code.trim();
      if (!BRAND_CODE_REGEX.test(code)) {
        throw new Error('Mã thương hiệu chỉ gồm chữ thường a-z, số 0-9 và dấu gạch nối (vd: apple, samsung-mobile).');
      }
      return createAdminBrand({ code, name: trimmedName });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', kind] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      if (isCategory) {
        const saved = res.category;
        queryClient.setQueryData(['admin', kind, 'all', generation], (prev) => {
          if (!prev) return prev;
          const exists = prev.items.some((c) => c.id === saved.id);
          return {
            ...prev,
            taxonomyVersion: res.taxonomyVersion ?? prev.taxonomyVersion,
            items: exists
              ? prev.items.map((c) => (c.id === saved.id ? saved : c))
              : [...prev.items, saved],
          };
        });
        const bindingsMsg = res.affectedBindings?.length
          ? ` (${res.affectedBindings.length} ràng buộc thông số bị ảnh hưởng)`
          : '';
        notify(`Đã lưu danh mục "${saved.name}".${bindingsMsg}`);
        setDraft({
          id: saved.id,
          name: saved.name,
          originalName: saved.name,
          parentCategoryId: saved.parentCategoryId || '',
          originalParentId: saved.parentCategoryId || '',
          version: saved.version,
        });
      } else {
        notify(`Đã lưu thương hiệu "${res.name}".`);
        setDraft({
          id: res.id,
          code: res.code,
          name: res.name,
          originalName: res.name,
          version: res.version,
        });
      }
      setValidationError('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isCategory) {
        return deleteAdminCategory(draft.id, {
          expectedVersion: draft.version,
          expectedTaxonomyVersion: taxonomyVersion,
        });
      }
      return deleteAdminBrand(draft.id, { expectedVersion: draft.version });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', kind] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      notify(`Đã xóa ${noun} "${draft.name}".`);
      setConfirmDelete(false);
      setDraft(null);
      setValidationError('');
    },
  });

  const selectItem = (item) => {
    setValidationError('');
    saveMutation.reset();
    deleteMutation.reset();
    if (isCategory) {
      setDraft({
        id: item.id,
        name: item.name,
        originalName: item.name,
        parentCategoryId: item.parentCategoryId || '',
        originalParentId: item.parentCategoryId || '',
        version: item.version,
      });
    } else {
      setDraft({
        id: item.id,
        code: item.code,
        name: item.name,
        originalName: item.name,
        version: item.version,
      });
    }
  };

  const startNew = () => {
    setValidationError('');
    saveMutation.reset();
    deleteMutation.reset();
    setDraft(
      isCategory
        ? { id: '', name: '', originalName: '', parentCategoryId: '', originalParentId: '', version: '0' }
        : { id: '', code: '', name: '', originalName: '', version: '0' },
    );
  };

  return (
    <>
      <PageHeading title={`Quản lý ${noun}`}>
        <Button size="compact" onClick={startNew}>Thêm {noun}</Button>
      </PageHeading>

      <div className="admin-split">
        <Panel
          title={isCategory ? 'Cây danh mục' : 'Danh sách thương hiệu'}
          description={`${allItems.length} ${noun}${isCategory ? ` · Taxonomy v${taxonomyVersion}` : ''}`}
        >
          <div className="admin-toolbar">
            <input
              className="admin-search-input"
              aria-label={`Tìm ${noun}`}
              placeholder={`Tìm ${noun}…`}
              value={q}
              onChange={(e) => update('q', e.target.value)}
            />
          </div>

          {listQuery.error && <AdminErrorAlert error={listQuery.error} onReload={() => listQuery.refetch()} />}

          {listQuery.isPending ? (
            <div className="admin-loading" role="status">Đang tải…</div>
          ) : rows.length === 0 ? (
            <Empty title={`Chưa có ${noun}`} description="Thử từ khóa khác hoặc tạo bản ghi mới.">
              {q && <Button size="compact" emphasis="outline" onClick={clear}>Xóa bộ lọc</Button>}
            </Empty>
          ) : (
            <>
              <AdminTable
                label={`Danh sách ${noun}`}
                columns={[
                  { label: `Tên ${noun}` },
                  ...(!isCategory ? [{ label: 'Mã (code)' }] : []),
                  { label: 'Phiên bản' },
                  { label: 'Thao tác' },
                ]}
              >
                {pagedRows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div
                        className="admin-taxonomy-name"
                        style={isCategory ? { paddingInlineStart: `${(item.depth || 0) * 18}px` } : undefined}
                      >
                        <button type="button" className="admin-text-link" onClick={() => selectItem(item)}>
                          {item.name}
                        </button>
                      </div>
                    </td>
                    {!isCategory && <td><Badge>{item.code}</Badge></td>}
                    <td>v{item.version}</td>
                    <td>
                      <button type="button" className="admin-text-link" onClick={() => selectItem(item)}>
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </AdminTable>

              <Pagination
                count={rows.length}
                page={page}
                size={size}
                onPage={(n) => update('page', n)}
                onSize={(n) => update('size', n)}
              />
            </>
          )}
        </Panel>

        <Panel title={draft ? `${draft.id ? 'Chỉnh sửa' : 'Thêm'} ${noun}` : `Chi tiết ${noun}`}>
          {!draft ? (
            <p className="admin-helper">Chọn một {noun} từ danh sách hoặc nhấn “Thêm {noun}”.</p>
          ) : (
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                setValidationError('');
                if (!draft.name.trim()) {
                  setValidationError(`Vui lòng nhập tên ${noun}.`);
                  return;
                }
                if (!isCategory && !draft.id && !BRAND_CODE_REGEX.test(draft.code.trim())) {
                  setValidationError('Mã thương hiệu chỉ gồm chữ thường a-z, số 0-9 và dấu gạch nối.');
                  return;
                }
                saveMutation.mutate();
              }}
              noValidate
            >
              {!isCategory && (
                <FormField
                  label="Mã thương hiệu (code) *"
                  value={draft.code}
                  disabled={Boolean(draft.id)}
                  hint={draft.id ? 'Mã thương hiệu không thể sửa sau khi tạo.' : 'Ví dụ: apple, sony-audio'}
                  onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value }))}
                  required
                />
              )}

              <FormField
                label={`Tên ${noun} *`}
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                required
              />

              {isCategory && (
                <FormField
                  as="select"
                  label="Danh mục cha"
                  value={draft.parentCategoryId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, parentCategoryId: e.target.value }))}
                >
                  <option value="">Không có — Danh mục gốc</option>
                  {allItems
                    .filter((c) => c.id !== draft.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </FormField>
              )}

              {validationError && <AdminErrorAlert error={validationError} />}
              {saveMutation.error && (
                <AdminErrorAlert
                  error={saveMutation.error}
                  onReload={() => {
                    saveMutation.reset();
                    listQuery.refetch();
                    setDraft(null);
                  }}
                />
              )}

              <div className="admin-actions">
                <Button type="button" size="compact" emphasis="outline" onClick={() => setDraft(null)}>
                  Đóng
                </Button>
                <Button type="submit" size="compact" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
                {draft.id && (
                  <Button
                    type="button"
                    size="compact"
                    intent="danger"
                    onClick={() => {
                      deleteMutation.reset();
                      setConfirmDelete(true);
                    }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </form>
          )}
        </Panel>
      </div>

      <Dialog
        open={confirmDelete}
        title={`Xóa ${noun}?`}
        onClose={() => {
          deleteMutation.reset();
          setConfirmDelete(false);
        }}
      >
        <p>
          Xác nhận xóa {noun} <strong>{draft?.name}</strong>? Thao tác này sẽ bị từ chối (409) nếu vẫn còn sản phẩm hoặc danh mục con liên kết.
        </p>
        {deleteMutation.error && <AdminErrorAlert error={deleteMutation.error} />}
        <div className="admin-dialog-actions">
          <Button
            type="button"
            size="compact"
            emphasis="outline"
            onClick={() => {
              deleteMutation.reset();
              setConfirmDelete(false);
            }}
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="compact"
            intent="danger"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? 'Đang xóa…' : `Xóa ${noun}`}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
