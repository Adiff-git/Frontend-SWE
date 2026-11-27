import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/Button';
import FormField from '../../../components/FormField';
import {
  createAdminProduct,
  getAdminProduct,
  listAdminBrands,
  listAdminCategories,
  listAllAdminTaxonomy,
  transitionAdminProduct,
  updateAdminProduct,
} from '../../../api/adminCatalog';
import useAuth from '../../../hooks/useAuth';
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES } from '../adminErrors';
import { Badge, Empty, PageHeading, Panel } from '../shared';
import LiveGalleryPanel from './LiveGalleryPanel';
import { AdminErrorAlert } from './LiveShared';
import LiveVariantPanel from './LiveVariantPanel';
import { useLiveAdmin } from './liveAdminContext';

const LIFECYCLE_BUTTONS = {
  DRAFT: [
    ['publish', 'Đăng bán', 'primary'],
    ['archive', 'Lưu trữ', 'danger'],
  ],
  PUBLISHED: [
    ['unpublish', 'Tạm ẩn', 'outline'],
    ['archive', 'Lưu trữ', 'danger'],
  ],
  UNPUBLISHED: [
    ['publish', 'Đăng bán lại', 'primary'],
    ['archive', 'Lưu trữ', 'danger'],
  ],
  ARCHIVED: [['restore', 'Khôi phục về nháp', 'outline']],
};

function ProductGeneralForm({
  isNew,
  productId,
  detail,
  categories,
  brands,
  returnTo,
  onSavedDetail,
  onRefresh,
}) {
  const { notify } = useLiveAdmin();
  const navigate = useNavigate();

  const [name, setName] = useState(() => detail?.name || '');
  const [description, setDescription] = useState(() => detail?.description ?? '');
  const [categoryId, setCategoryId] = useState(() => detail?.category?.id || '');
  const [brandId, setBrandId] = useState(() => detail?.brand?.id || '');
  const [validationError, setValidationError] = useState('');

  const saveMutation = useMutation({
    mutationFn: async ({ trimmedName, selectedBrand }) => {
      if (isNew) {
        return createAdminProduct({
          name: trimmedName,
          categoryId,
          ...(brandId && selectedBrand
            ? { brandId, expectedBrandVersion: selectedBrand.version }
            : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
      }

      const patch = {
        expectedVersion: detail.version,
        expectedTaxonomyVersion: detail.taxonomyVersion,
      };
      if (trimmedName !== detail.name) patch.name = trimmedName;
      if (categoryId !== detail.category?.id) patch.categoryId = categoryId;

      const origDesc = detail.description ?? '';
      if (description !== origDesc) {
        patch.description = description === '' ? null : description;
      }

      const origBrandId = detail.brand?.id || '';
      if (brandId !== origBrandId) {
        if (!brandId) {
          patch.brandId = null;
        } else {
          patch.brandId = brandId;
          patch.expectedBrandVersion = selectedBrand.version;
        }
      }

      return updateAdminProduct(productId, patch);
    },
    onSuccess: (saved) => {
      onSavedDetail(saved);
      if (isNew) {
        notify(`Đã tạo sản phẩm nháp "${saved.name}". Tiếp tục thêm biến thể và ảnh bên dưới.`);
        navigate(`/admin/products/${saved.id}/edit`, { replace: true, state: { returnTo } });
      } else {
        notify('Đã cập nhật thông tin sản phẩm.');
      }
      setValidationError('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    saveMutation.reset();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!categoryId) {
      setValidationError('Vui lòng chọn danh mục.');
      return;
    }

    const selectedBrand = brandId ? brands.find((b) => b.id === brandId) : null;
    if (brandId && !selectedBrand) {
      setValidationError('Không tìm thấy phiên bản thương hiệu được chọn.');
      return;
    }

    if (!isNew) {
      const origDesc = detail.description ?? '';
      const origBrandId = detail.brand?.id || '';
      const hasChanges =
        trimmedName !== detail.name ||
        categoryId !== detail.category?.id ||
        description !== origDesc ||
        brandId !== origBrandId;
      if (!hasChanges) {
        setValidationError('Chưa có thay đổi nào ở thông tin chung.');
        return;
      }
    }

    saveMutation.mutate({ trimmedName, selectedBrand });
  };

  return (
    <Panel title="Thông tin chung">
      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Tên sản phẩm *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="admin-field-grid">
          <FormField
            as="select"
            label="Danh mục *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Chọn danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FormField>

          <FormField
            as="select"
            label="Thương hiệu"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Không chọn thương hiệu</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </FormField>
        </div>

        <FormField
          as="textarea"
          rows={4}
          label="Mô tả sản phẩm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {validationError && <AdminErrorAlert error={validationError} />}
        {saveMutation.error && (
          <AdminErrorAlert
            error={saveMutation.error}
            onReload={() => {
              saveMutation.reset();
              onRefresh();
            }}
          />
        )}

        <div className="admin-actions">
          <Button type="submit" size="compact" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Đang lưu…' : isNew ? 'Tạo bản nháp sản phẩm' : 'Lưu thông tin chung'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function LiveProductEditor() {
  const { productId } = useParams();
  const isNew = !productId;
  const { generation } = useAuth();
  const { notify } = useLiveAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = /^\/admin\/products(?:\?|$)/.test(location.state?.returnTo || '')
    ? location.state.returnTo
    : '/admin/products';

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

  const productQuery = useQuery({
    queryKey: ['admin', 'products', 'detail', productId, generation],
    queryFn: ({ signal }) => getAdminProduct(productId, { signal }),
    enabled: !isNew,
    retry: false,
  });

  const detail = productQuery.data;
  const brands = brandsQuery.data?.items || [];
  const categories = categoriesQuery.data?.items || [];

  const transitionMutation = useMutation({
    mutationFn: (action) =>
      transitionAdminProduct(productId, action, {
        expectedVersion: detail.version,
        expectedTaxonomyVersion: detail.taxonomyVersion,
      }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.setQueryData(['admin', 'products', 'detail', productId, generation], saved);
      notify(`Trạng thái sản phẩm đã chuyển sang ${PRODUCT_STATUS_LABELS[saved.status] || saved.status}.`);
    },
  });

  const refreshDetail = () => {
    transitionMutation.reset();
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    productQuery.refetch();
  };

  const handleSavedDetail = (saved) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    if (!isNew) {
      queryClient.setQueryData(['admin', 'products', 'detail', productId, generation], saved);
    }
  };

  if (!isNew && productQuery.isPending) {
    return <div className="admin-loading" role="status">Đang tải chi tiết sản phẩm…</div>;
  }

  if (!isNew && productQuery.error) {
    return (
      <Empty title="Không thể tải sản phẩm" description="Sản phẩm không tồn tại hoặc bạn không có quyền xem.">
        <AdminErrorAlert error={productQuery.error} onReload={refreshDetail} />
        <Button size="compact" onClick={() => navigate(returnTo)}>Về danh sách sản phẩm</Button>
      </Empty>
    );
  }

  const readiness = detail?.publicationReadiness;

  return (
    <>
      <PageHeading title={isNew ? 'Thêm sản phẩm mới' : `Chỉnh sửa: ${detail?.name || ''}`}>
        <Button type="button" size="compact" emphasis="outline" onClick={() => navigate(returnTo)}>
          Về danh sách sản phẩm
        </Button>
      </PageHeading>

      <div className="admin-editor">
        <div className="admin-editor-main">
          <ProductGeneralForm
            key={`${detail?.id || 'new'}-${detail?.version || 0}-${detail?.taxonomyVersion || 0}`}
            isNew={isNew}
            productId={productId}
            detail={detail}
            categories={categories}
            brands={brands}
            returnTo={returnTo}
            onSavedDetail={handleSavedDetail}
            onRefresh={refreshDetail}
          />

          {!isNew && detail && (
            <>
              <LiveVariantPanel
                product={detail}
                onUpdated={refreshDetail}
                onReloadProduct={refreshDetail}
              />
              <LiveGalleryPanel
                product={detail}
                onUpdated={refreshDetail}
                onReloadProduct={refreshDetail}
              />
            </>
          )}
        </div>

        <aside className="admin-editor-aside">
          {!isNew && detail ? (
            <>
              <Panel title="Trạng thái & vòng đời">
                <div className="admin-form">
                  <div className="admin-actions">
                    <Badge tone={PRODUCT_STATUS_TONES[detail.status] || 'neutral'}>
                      {PRODUCT_STATUS_LABELS[detail.status] || detail.status}
                    </Badge>
                    <small>Product v{detail.version} · Taxonomy v{detail.taxonomyVersion}</small>
                  </div>

                  {transitionMutation.error && (
                    <AdminErrorAlert error={transitionMutation.error} onReload={refreshDetail} />
                  )}

                  <div className="admin-actions">
                    {(LIFECYCLE_BUTTONS[detail.status] || []).map(([action, label, style]) => (
                      <Button
                        key={action}
                        type="button"
                        size="compact"
                        emphasis={style === 'outline' ? 'outline' : undefined}
                        intent={style === 'danger' ? 'danger' : undefined}
                        disabled={transitionMutation.isPending}
                        onClick={() => transitionMutation.mutate(action)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="Điều kiện đăng bán">
                <div className="admin-form">
                  <Badge tone={readiness?.eligible ? 'success' : 'warning'}>
                    {readiness?.eligible ? 'Đủ điều kiện đăng bán' : 'Chưa đủ điều kiện đăng bán'}
                  </Badge>
                  {(readiness?.violations || []).length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {readiness.violations.map((v, i) => (
                        <li key={`${v.code}-${i}`}>
                          <strong>{v.path}</strong>: {v.message || v.code}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="admin-text-link" onClick={refreshDetail}>
                    Tải lại từ máy chủ
                  </button>
                </div>
              </Panel>
            </>
          ) : (
            <Panel title="Hướng dẫn">
              <p className="admin-helper">
                Tạo sản phẩm nháp trước, sau đó hệ thống sẽ mở phần quản lý biến thể, thông số kỹ thuật và thư viện ảnh.
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
