import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import { getAdminInventoryHistory, listAdminInventory } from '../../../api/adminInventory';
import useAuth from '../../../hooks/useAuth';
import { PRODUCT_STATUS_LABELS, STOCK_STATUS_LABELS } from '../adminErrors';
import { AdminTable, Badge, Empty, PageHeading, Pagination, Panel } from '../shared';
import { useListState } from '../useListState';
import { AdminErrorAlert } from './LiveShared';
import LiveStockDialog from './LiveStockDialog';

const STOCK_TONES = {
  IN_STOCK: 'success',
  OUT_OF_STOCK: 'warning',
  UNAVAILABLE: 'neutral',
};

export default function LiveInventoryScreen() {
  const { generation } = useAuth();
  const { params, update, size, requestedPage, clear } = useListState();
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [editing, setEditing] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySize, setHistorySize] = useState(10);

  const q = params.get('q') || '';
  const status = params.get('status') || '';

  const listQuery = useQuery({
    queryKey: ['admin', 'inventory', 'list', generation, { page: requestedPage - 1, size, q, status }],
    queryFn: ({ signal }) =>
      listAdminInventory(
        {
          page: requestedPage - 1,
          size,
          q,
          status: status || undefined,
        },
        { signal },
      ),
    retry: false,
  });

  const data = listQuery.data;
  const items = data?.items || [];
  const totalItems = data?.totalItems ?? 0;
  const selected = selectedSnapshot
    ? items.find((r) => r.variantId === selectedSnapshot.variantId) || selectedSnapshot
    : null;

  const historyQuery = useQuery({
    queryKey: ['admin', 'inventory', 'history', selected?.variantId, generation, historyPage, historySize],
    queryFn: ({ signal }) =>
      getAdminInventoryHistory(selected.variantId, { page: historyPage - 1, size: historySize }, { signal }),
    enabled: Boolean(selected?.variantId),
    retry: false,
  });

  return (
    <>
      <PageHeading title="Quản lý tồn kho">
        <Link className="admin-link-button admin-link-button--outline" to="/admin/products">
          Danh sách sản phẩm
        </Link>
      </PageHeading>

      <div className="admin-split">
        <Panel
          title="Tồn kho theo biến thể"
          actions={<Badge tone="brand">{totalItems} biến thể</Badge>}
        >
          <div className="admin-toolbar">
            <input
              className="admin-search-input"
              aria-label="Tìm theo tên sản phẩm hoặc SKU"
              placeholder="Tìm tên sản phẩm hoặc SKU…"
              value={q}
              onChange={(e) => update('q', e.target.value)}
            />
          </div>

          <div className="admin-tabs" aria-label="Lọc theo trạng thái sản phẩm">
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

          {listQuery.error && (
            <AdminErrorAlert error={listQuery.error} onReload={() => listQuery.refetch()} />
          )}

          {listQuery.isPending ? (
            <div className="admin-loading" role="status">Đang tải tồn kho…</div>
          ) : items.length === 0 ? (
            <Empty
              title="Không có biến thể phù hợp"
              description="Thử từ khóa khác hoặc xóa bộ lọc trạng thái."
            >
              {(q || status) && (
                <Button size="compact" emphasis="outline" onClick={clear}>Xóa bộ lọc</Button>
              )}
            </Empty>
          ) : (
            <>
              <AdminTable
                label="Danh sách tồn kho biến thể"
                columns={[
                  { label: 'Sản phẩm / SKU' },
                  { label: 'Hiện có' },
                  { label: 'Giữ chỗ' },
                  { label: 'Khả dụng' },
                  { label: 'Trạng thái' },
                  { label: 'Thao tác' },
                ]}
              >
                {items.map((row) => (
                  <tr key={row.variantId}>
                    <td>
                      <div>
                        <Link
                          className="admin-text-link"
                          to={`/admin/products/${row.productId}/edit`}
                        >
                          {row.productName}
                        </Link>
                        <small className="admin-block-muted">
                          {row.sku} · {PRODUCT_STATUS_LABELS[row.productStatus] || row.productStatus}
                          {!row.variantEnabled ? ' · Biến thể tắt' : ''}
                        </small>
                      </div>
                    </td>
                    <td>{row.onHand ?? '—'}</td>
                    <td>{row.reserved ?? '—'}</td>
                    <td><strong>{row.available ?? '—'}</strong></td>
                    <td>
                      <Badge tone={STOCK_TONES[row.stockStatus] || 'neutral'}>
                        {STOCK_STATUS_LABELS[row.stockStatus] || row.stockStatus}
                      </Badge>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSnapshot(row);
                            setHistoryPage(1);
                          }}
                        >
                          Lịch sử
                        </button>
                        <button
                          type="button"
                          disabled={row.productStatus === 'ARCHIVED'}
                          onClick={() => setEditing(row)}
                        >
                          Điều chỉnh
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

        <Panel
          title={selected ? `Lịch sử: ${selected.sku}` : 'Nhật ký biến động tồn kho'}
          description={selected ? selected.productName : 'Chọn một biến thể ở bảng bên cạnh để xem nhật ký.'}
        >
          {!selected ? (
            <p className="admin-helper">
              Chưa chọn biến thể. Nhấn “Lịch sử” hoặc “Điều chỉnh” trên một dòng để xem chi tiết.
            </p>
          ) : (
            <div className="admin-form">
              <div className="admin-actions">
                <Button
                  size="compact"
                  disabled={selected.productStatus === 'ARCHIVED'}
                  onClick={() => setEditing(selected)}
                >
                  Nhập thêm / Điều chỉnh
                </Button>
                <Button
                  size="compact"
                  emphasis="outline"
                  onClick={() => historyQuery.refetch()}
                  disabled={historyQuery.isFetching}
                >
                  Tải lại
                </Button>
              </div>

              {historyQuery.error && <AdminErrorAlert error={historyQuery.error} />}

              {historyQuery.isPending ? (
                <div className="admin-loading" role="status">Đang tải lịch sử…</div>
              ) : !(historyQuery.data?.items || []).length ? (
                <p className="admin-helper">Chưa có giao dịch tồn kho nào cho biến thể này.</p>
              ) : (
                <>
                  {(historyQuery.data.items || []).map((entry) => (
                    <div key={entry.operationId} className="admin-history-entry">
                      <div className="admin-actions" style={{ justifyContent: 'space-between' }}>
                        <Badge tone={entry.operationType === 'REPLENISHMENT' ? 'success' : 'brand'}>
                          {entry.operationType === 'REPLENISHMENT' ? 'Nhập kho' : 'Kiểm kê'} ({entry.delta})
                        </Badge>
                        <small>{new Date(entry.occurredAt).toLocaleString('vi-VN')}</small>
                      </div>
                      <p style={{ margin: '8px 0 4px' }}>
                        Hiện có: {entry.onHandBefore} → <strong>{entry.onHandAfter}</strong> · Khả dụng sau: <strong>{entry.availableAfter}</strong>
                      </p>
                      {entry.reason && <small className="admin-block-muted">Lý do: {entry.reason}</small>}
                    </div>
                  ))}
                  <Pagination
                    count={historyQuery.data.totalItems ?? 0}
                    page={historyPage}
                    size={historySize}
                    onPage={setHistoryPage}
                    onSize={(nextSize) => {
                      setHistorySize(nextSize);
                      setHistoryPage(1);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </Panel>
      </div>

      {editing && (
        <LiveStockDialog
          key={editing.variantId}
          variantId={editing.variantId}
          initialVariant={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            if (selected?.variantId === editing.variantId) historyQuery.refetch();
          }}
        />
      )}
    </>
  );
}
