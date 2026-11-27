import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import { getAdminBehaviorOverview } from '../../../api/adminBehavior';
import useAuth from '../../../hooks/useAuth';
import { AdminTable, Badge, Empty, PageHeading, Panel } from '../shared';
import { AdminErrorAlert } from './LiveShared';

const EVENT_LABELS = [
  ['PRODUCT_VIEW', 'Lượt xem sản phẩm'],
  ['PRODUCT_CLICK', 'Lượt nhấp sản phẩm'],
  ['SEARCH', 'Lượt tìm kiếm'],
  ['WISHLIST_ADD', 'Thêm vào yêu thích'],
  ['WISHLIST_REMOVE', 'Bỏ khỏi yêu thích'],
];

export default function LiveStatisticsScreen() {
  const { generation } = useAuth();
  const [days, setDays] = useState(7);

  const overviewQuery = useQuery({
    queryKey: ['admin', 'behavior', 'overview', days, generation],
    queryFn: ({ signal }) => getAdminBehaviorOverview(days, { signal }),
    retry: false,
  });

  const data = overviewQuery.data;
  const counts = data?.counts || {};
  const viewed = data?.mostViewedProducts || [];
  const clicked = data?.mostClickedProducts || [];
  const searches = data?.popularSearchTerms || [];

  const maxSearchCount = Math.max(1, ...searches.map((s) => s.count || 0));

  return (
    <>
      <PageHeading
        title="Thống kê hành vi người dùng"
        description="Số liệu tổng hợp từ API GET /api/admin/behavior/overview."
      >
        <div className="admin-tabs" style={{ marginBottom: 0 }} aria-label="Chọn khoảng thời gian">
          {[7, 30, 90].map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              onClick={() => setDays(option)}
            >
              {option} ngày qua
            </button>
          ))}
        </div>
        <Button
          size="compact"
          emphasis="outline"
          onClick={() => overviewQuery.refetch()}
          disabled={overviewQuery.isFetching}
        >
          {overviewQuery.isFetching ? 'Đang tải…' : 'Làm mới'}
        </Button>
      </PageHeading>

      {overviewQuery.error && (
        <AdminErrorAlert error={overviewQuery.error} onReload={() => overviewQuery.refetch()} />
      )}

      {overviewQuery.isPending ? (
        <div className="admin-loading" role="status">Đang tải thống kê hành vi…</div>
      ) : data ? (
        <>
          <Panel
            title="Phạm vi thống kê"
            description={`${new Date(data.from).toLocaleString('vi-VN')} – ${new Date(data.to).toLocaleString('vi-VN')}`}
            actions={<Badge tone="brand">{data.days} ngày</Badge>}
          >
            <div className="admin-metrics">
              {EVENT_LABELS.map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{new Intl.NumberFormat('vi-VN').format(counts[key] ?? 0)}</strong>
                  <small>{key}</small>
                </div>
              ))}
            </div>
          </Panel>

          <div className="admin-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Panel title="Top sản phẩm được xem nhiều">
              {viewed.length === 0 ? (
                <Empty title="Chưa có dữ liệu lượt xem" description="Chưa ghi nhận lượt xem sản phẩm trong khoảng thời gian này." />
              ) : (
                <AdminTable
                  label="Sản phẩm xem nhiều"
                  columns={[{ label: 'Mã sản phẩm (UUID)' }, { label: 'Lượt xem' }]}
                >
                  {viewed.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <Link className="admin-text-link" to={`/admin/products/${item.productId}/edit`}>
                          {item.productId}
                        </Link>
                      </td>
                      <td><strong>{new Intl.NumberFormat('vi-VN').format(item.count)}</strong></td>
                    </tr>
                  ))}
                </AdminTable>
              )}
            </Panel>

            <Panel title="Top sản phẩm được nhấp nhiều">
              {clicked.length === 0 ? (
                <Empty title="Chưa có dữ liệu lượt nhấp" description="Chưa ghi nhận lượt nhấp sản phẩm trong khoảng thời gian này." />
              ) : (
                <AdminTable
                  label="Sản phẩm nhấp nhiều"
                  columns={[{ label: 'Mã sản phẩm (UUID)' }, { label: 'Lượt nhấp' }]}
                >
                  {clicked.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <Link className="admin-text-link" to={`/admin/products/${item.productId}/edit`}>
                          {item.productId}
                        </Link>
                      </td>
                      <td><strong>{new Intl.NumberFormat('vi-VN').format(item.count)}</strong></td>
                    </tr>
                  ))}
                </AdminTable>
              )}
            </Panel>
          </div>

          <Panel
            title="Từ khóa tìm kiếm phổ biến"
            description="Chỉ hiển thị từ khóa chuẩn hóa có ít nhất 3 khách hàng khác nhau tìm kiếm."
          >
            {searches.length === 0 ? (
              <Empty title="Chưa có từ khóa đủ ngưỡng" description="Chưa có từ khóa tìm kiếm đạt ngưỡng ẩn danh từ 3 khách hàng trở lên." />
            ) : (
              <div className="admin-trends">
                {searches.map((term) => (
                  <div key={term.query}>
                    <span>{term.query}</span>
                    <meter aria-label={`Tìm kiếm ${term.query}`} value={term.count} min="0" max={maxSearchCount} />
                    <strong>{new Intl.NumberFormat('vi-VN').format(term.count)} lượt</strong>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : null}
    </>
  );
}
