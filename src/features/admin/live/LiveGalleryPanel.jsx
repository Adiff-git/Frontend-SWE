import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import FormField from '../../../components/FormField';
import {
  removeAdminProductImage,
  reorderAdminProductImages,
  setPrimaryAdminProductImage,
  uploadAndAttachAdminProductImage,
} from '../../../api/adminCatalog';
import { Badge, Panel } from '../shared';
import { AdminErrorAlert } from './LiveShared';
import { useLiveAdmin } from './liveAdminContext';

export default function LiveGalleryPanel({ product, onUpdated, onReloadProduct }) {
  const { notify } = useLiveAdmin();
  const [altText, setAltText] = useState('');
  const [uploadError, setUploadError] = useState('');

  const revisions = {
    expectedVersion: product.version,
    expectedTaxonomyVersion: product.taxonomyVersion,
  };

  const images = [...(product.images || [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const resetMutations = () => {
    uploadMutation.reset();
    primaryMutation.reset();
    reorderMutation.reset();
    removeMutation.reset();
    setUploadError('');
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file, text }) =>
      uploadAndAttachAdminProductImage(product.id, file, {
        ...revisions,
        altText: text,
        isPrimary: images.length === 0,
      }),
    onSuccess: () => {
      setAltText('');
      setUploadError('');
      notify('Đã tải lên và gắn ảnh vào sản phẩm.');
      onUpdated();
    },
  });

  const primaryMutation = useMutation({
    mutationFn: (imageId) =>
      setPrimaryAdminProductImage(product.id, { ...revisions, imageId }),
    onSuccess: () => {
      notify('Đã đặt ảnh chính.');
      onUpdated();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (imageIds) =>
      reorderAdminProductImages(product.id, { ...revisions, imageIds }),
    onSuccess: () => {
      notify('Đã cập nhật thứ tự ảnh.');
      onUpdated();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (img) => {
      const other = images.find((i) => i.id !== img.id);
      return removeAdminProductImage(product.id, img.id, {
        ...revisions,
        ...(img.isPrimary && other ? { replacementImageId: other.id } : {}),
      });
    },
    onSuccess: () => {
      notify('Đã gỡ ảnh khỏi sản phẩm.');
      onUpdated();
    },
  });

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    resetMutations();
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((i) => i.id));
  };

  const reloadAndReset = () => {
    resetMutations();
    onReloadProduct();
  };

  const activeError =
    uploadError ||
    uploadMutation.error ||
    primaryMutation.error ||
    reorderMutation.error ||
    removeMutation.error;

  return (
    <Panel title="Hình ảnh sản phẩm" description="JPG, PNG, WebP (upload qua /api/image-uploads rồi gắn vào sản phẩm)">
      <div className="admin-form" style={{ marginBottom: 16 }}>
        <FormField
          label="Mô tả ảnh (altText)"
          placeholder={`Mặc định theo tên tệp hoặc "${product.name}"`}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
        />
        <label className="admin-upload">
          {uploadMutation.isPending ? 'Đang tải ảnh lên…' : 'Chọn ảnh để tải lên và gắn'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploadMutation.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              resetMutations();
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                setUploadError('Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.');
                return;
              }
              const text = altText.trim() || file.name.replace(/\.[^.]+$/, '').trim() || product.name;
              uploadMutation.mutate({ file, text });
            }}
          />
        </label>
      </div>

      {activeError && <AdminErrorAlert error={activeError} onReload={reloadAndReset} />}

      {images.length === 0 ? (
        <p>Chưa có ảnh nào gắn với sản phẩm.</p>
      ) : (
        <div className="admin-gallery">
          {images.map((img, index) => (
            <div key={img.id}>
              <img src={img.url} alt={img.altText} />
              <small>{img.altText || `Ảnh ${index + 1}`}</small>
              {img.isPrimary ? (
                <Badge tone="brand">Ảnh chính</Badge>
              ) : (
                <button
                  type="button"
                  className="admin-text-link"
                  disabled={primaryMutation.isPending}
                  onClick={() => {
                    resetMutations();
                    primaryMutation.mutate(img.id);
                  }}
                >
                  Đặt làm ảnh chính
                </button>
              )}
              <div className="admin-actions">
                <button
                  type="button"
                  disabled={index === 0 || reorderMutation.isPending}
                  onClick={() => move(index, -1)}
                >
                  Đưa lên
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1 || reorderMutation.isPending}
                  onClick={() => move(index, 1)}
                >
                  Đưa xuống
                </button>
                <button
                  type="button"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    resetMutations();
                    removeMutation.mutate(img);
                  }}
                >
                  Gỡ ảnh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
