import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import {
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
  listAllAdminTaxonomy,
  transitionAdminProduct,
} from '../../../api/adminCatalog';
import useAuth from '../../../hooks/useAuth';
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES } from '../adminErrors';
import { AdminTable, Badge, Empty, Icon, PageHeading, Pagination, Panel } from '../shared';
import { useListState } from '../useListState';
import { AdminErrorAlert } from './LiveShared';
import { useLiveAdmin } from './liveAdminContext';

const NEXT_ACTION = {
  DRAFT: { action: 'publish', label: 'Đăng bán' },
  PUBLISHED: { action: 'unpublish', label: 'Tạm ẩn' },
  UNPUBLISHED: { action: 'publish', label: 'Đăng bán lại' },
  ARCHIVED: { action: 'restore', label: 'Khôi phục' },
};

export default function LiveProductsScreen() {
  const { generation } = useAuth();
  const { notify } = useLiveAdmin();
  const queryClient = useQueryClient();
  const { params, update, updateMany, size, requestedPage, clear } = useListState();
  const location = useLocation();

  const [pendingTransition, setPendingTransition] = useState(null);

  const q = params.get('q') || '';
  const status = params.get('status') || '';
  const categoryId = params.get('category') || '';
  const includeDescendants = params.get('descendants') === 'true';
  const brandId = params.get('brand') || '';
  const sort = params.get('sort') || 'name,asc';

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'all', generation],
    queryFn: ({ signal }) => listAllAdminTaxonomy(listAdminCategories, { sort: 'name,asc', signal }),
    staleTime: 60 * 1000,
    retry: false,
  });

  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands', 'all', generation],
    queryFn: ({ signal }) => listAllAdminTaxonomy(listAdminBrands, { sort: 'name,asc', signal }),
    staleTime: 60 * 1000,
    retry: false,
  });

  const productsQuery = useQuery({
    queryKey: [
      'admin',
      'products',
      'list',
      generation,
      { page: requestedPage - 1, size, q, status, categoryId, includeDescendants, brandId, sort },
    ],
    queryFn: ({ signal }) =>
      listAdminProducts(
        {
          page: requestedPage - 1,
          size,
          q,
          status: status || undefined,
          categoryId: categoryId || undefined,
          includeDescendants: categoryId ? includeDescendants : undefined,
          brandId: brandId || undefined,
          sort,
        },
        { signal },
      ),
    retry: false,
  });

  const data = productsQuery.data;
  const rows = data?.items || [];
  const totalItems = data?.totalItems ?? 0;
  const taxonomyVersion = data?.taxonomyVersion ?? categoriesQuery.data?.taxonomyVersion ?? '0';
  const returnTo = `${location.pathname}${location.search}`;

  const transitionMutation = useMutation({
    mutationFn: ({ product, action }) =>
      transitionAdminProduct(product.id, action, {
        expectedVersion: product.version,
        expectedTaxonomyVersion: taxonomyVersion,
      }),
    onSuccess: (updated, { label }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      notify(`Đã ${label.toLowerCase()} "${updated.name}".`);
      setPendingTransition(null);
    },
  });

  const toggleSort = (field) => {
    const nextSort = sort === `${field},asc` ? `${field},desc` : `${field},asc`;
    update('sort', nextSort);
  };

  return (
    <>
      <PageHeading title="Quản lý sản phẩm">
        <Link className="admin-link-button admin-link-button--outline" to="/admin/inventory">
          Tồn kho biến thể
        </Link>
        <Link className="admin-link-button" to="/admin/products/new" state={{ returnTo }}>
          <Icon name="plus" />
          Thêm sản phẩm
        </Link>
      </PageHeading>

      <Panel
        title="Danh sách sản phẩm"
        description={`Taxonomy v${taxonomyVersion}`}
        actions={<Badge tone="brand">{totalItems} sản phẩm</Badge>}
      >
        <div className="admin-toolbar">
          <label className="admin-search">
            <Icon name="search" />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm theo tên sản phẩm hoặc SKU…"
              value={q}
              onChange={(e) => update('q', e.target.value)}
            />
          </label>

          <select
            aria-label="Danh mục"
            value={categoryId}
            onChange={(e) => {
              const nextCat = e.target.value;
              if (!nextCat) {
                updateMany({ category: '', descendants: '' });
              } else {
                update('category', nextCat);
              }
            }}
          >
            <option value="">Tất cả danh mục</option>
            {(categoriesQuery.data?.items || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {categoryId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={includeDescendants}
                onChange={(e) => update('descendants', e.target.checked ? 'true' : '')}
              />
              Gồm danh mục con
            </label>
          )}

          <select
            aria-label="Thương hiệu"
            value={brandId}
            onChange={(e) => update('brand', e.target.value)}
          >
            <option value="">Tất cả thương hiệu</option>
            {(brandsQuery.data?.items || []).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="admin-tabs" aria-label="Lọc trạng thái">
          {[
            ['', 'Tất cả'],
            ['PUBLISHED', 'Đang bán'],
            ['DRAFT', 'Bản nháp'],
            ['UNPUBLISHED', 'Tạm ẩn'],
            ['ARCHIVED', 'Đã lưu trữ'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={status === key}
              onClick={() => update('status', key)}
            >
              {label}
            </button>
          ))}
        </div>

        {productsQuery.error && (
          <AdminErrorAlert error={productsQuery.error} onReload={() => productsQuery.refetch()} />
        )}

        {productsQuery.isPending ? (
          <div className="admin-loading" role="status">Đang tải danh sách sản phẩm…</div>
        ) : rows.length === 0 ? (
          <Empty
            title={q || status || categoryId || brandId ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
            description="Thử từ khóa khác, xóa bộ lọc hoặc tạo sản phẩm mới."
          >
            {(q || status || categoryId || brandId) && (
              <Button size="compact" emphasis="outline" onClick={clear}>Xóa bộ lọc</Button>
            )}
          </Empty>
        ) : (
          <>
            <AdminTable
              label="Danh sách sản phẩm"
              columns={[
                {
                  label: 'Sản phẩm',
                  action: () => toggleSort('name'),
                  sortDirection: sort === 'name,asc' ? 'ascending' : sort === 'name,desc' ? 'descending' : 'none',
                },
                { label: 'Danh mục' },
                { label: 'Thương hiệu' },
                { label: 'Biến thể' },
                { label: 'Trạng thái' },
                { label: 'Thao tác' },
              ]}
            >
              {rows.map((row) => {
                const quickAction = NEXT_ACTION[row.status];
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="admin-product-cell">
                        <div>
                          <Link to={`/admin/products/${row.id}/edit`} state={{ returnTo }}>
                            {row.name}
                          </Link>
                          <small>v{row.version} · {row.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{row.category?.name || '—'}</td>
                    <td>{row.brand?.name || 'Không có'}</td>
                    <td>
                      {row.enabledVariantCount} bật / {row.variantCount} tổng
                    </td>
                    <td>
                      <Badge tone={PRODUCT_STATUS_TONES[row.status] || 'neutral'}>
                        {PRODUCT_STATUS_LABELS[row.status] || row.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link to={`/admin/products/${row.id}/edit`} state={{ returnTo }} aria-label={`Sửa ${row.name}`}>
                          <Icon name="edit" />
                        </Link>
                        {quickAction && (
                          <button
                            type="button"
                            onClick={() => {
                              transitionMutation.reset();
                              setPendingTransition({ product: row, ...quickAction });
                            }}
                          >
                            {quickAction.label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </AdminTable>

            <Pagination
              count={totalItems}
              page={requestedPage}
              size={size}
              onPage={(n) => update('page', n)}
              onSize={(n) => update('size', n)}
            />
          </>
        )}
      </Panel>

      <Dialog
        open={Boolean(pendingTransition)}
        title={`${pendingTransition?.label || ''} sản phẩm?`}
        onClose={() => setPendingTransition(null)}
      >
        <p>
          Xác nhận <strong>{pendingTransition?.label?.toLowerCase()}</strong> sản phẩm{' '}
          <strong>{pendingTransition?.product?.name}</strong> (v{pendingTransition?.product?.version})?
        </p>
        {transitionMutation.error && (
          <AdminErrorAlert
            error={transitionMutation.error}
            onReload={() => {
              setPendingTransition(null);
              productsQuery.refetch();
            }}
          />
        )}
        <div className="admin-dialog-actions">
          <Button type="button" size="compact" emphasis="outline" onClick={() => setPendingTransition(null)}>
            Hủy
          </Button>
          <Button
            type="button"
            size="compact"
            disabled={transitionMutation.isPending}
            onClick={() => transitionMutation.mutate(pendingTransition)}
          >
            {transitionMutation.isPending ? 'Đang xử lý…' : pendingTransition?.label}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
