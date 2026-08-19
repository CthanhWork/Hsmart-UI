import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import BooleanBadge from '../../components/admin/BooleanBadge';
import PreviewDrawer from '../../components/admin/PreviewDrawer';
import NotificationPreview from '../../components/admin/NotificationPreview';
import { apiFetchAdminNotifications } from '../../services/api';
import { emptyPage, formatDateTime } from './format';

const NotificationsPage = () => {
  const [notificationsPage, setNotificationsPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processedFilter, setProcessedFilter] = useState('all');
  const [pageNo, setPageNo] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewNotification, setPreviewNotification] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const nextPage = await apiFetchAdminNotifications({
        processed: processedFilter === 'all' ? undefined : processedFilter === 'processed',
        page: pageNo,
        size: notificationsPage.pageSize || 10,
      });
      setNotificationsPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedFilter, pageNo]);

  const openPreview = (notification) => {
    setPreviewNotification(notification);
    setDrawerOpen(true);
  };

  const columns = [
    {
      key: 'notification',
      header: 'Thông báo',
      cellClassName: 'adm-reason-cell',
      render: (item) => (
        <div className="adm-stack-cell">
          <strong>{item.title || item.type || 'Thông báo hệ thống'}</strong>
          <small>{item.type || '—'} · {formatDateTime(item.createdAt)}</small>
          <p className="adm-review-comment">{item.message || 'Không có nội dung.'}</p>
        </div>
      ),
    },
    {
      key: 'refs',
      header: 'Liên quan',
      render: (item) => (
        <div className="adm-stack-cell">
          {item.productId ? <small translate="no">Sản phẩm #{item.productId}</small> : null}
          {item.reportId ? <small translate="no">Báo cáo #{item.reportId}</small> : null}
          {!item.productId && !item.reportId ? <small>—</small> : null}
        </div>
      ),
    },
    {
      key: 'processed',
      header: 'Trạng thái',
      render: (item) => (
        <BooleanBadge value={Boolean(item.processed)} trueLabel="Đã xử lý" falseLabel="Chờ xử lý" />
      ),
    },
    {
      key: 'handler',
      header: 'Xử lý bởi',
      render: (item) => (
        <div className="adm-stack-cell">
          <strong>{item.processedBy || '—'}</strong>
          {item.processedAt ? <small>{formatDateTime(item.processedAt)}</small> : null}
          {item.resolutionReason ? <small>{item.resolutionReason}</small> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (item) => (
        <button
          type="button"
          className="adm-text-action view"
          onClick={(event) => {
            event.stopPropagation();
            openPreview(item);
          }}
        >
          Xem chi tiết
        </button>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Thông báo hệ thống"
        title="Thông báo quản trị"
        description="Theo dõi các sự kiện cần admin chú ý như tin đăng mới và báo cáo."
        onRefresh={loadNotifications}
        refreshing={loading}
      >
        <select
          className="adm-select"
          name="adminNotificationFilter"
          value={processedFilter}
          onChange={(event) => {
            setProcessedFilter(event.target.value);
            setPageNo(0);
          }}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="processed">Đã xử lý</option>
        </select>
      </AdminPageHeader>

      <AdminDataTable
        columns={columns}
        rows={notificationsPage.content}
        loading={loading}
        error={error}
        emptyIcon={Bell}
        emptyTitle="Không có thông báo nào trong bộ lọc hiện tại."
        onRowClick={openPreview}
        rowAriaLabel={(item) => `Xem chi tiết thông báo ${item.id}`}
        footer={<Pagination page={notificationsPage} onChange={setPageNo} />}
      />

      <PreviewDrawer
        open={drawerOpen}
        kicker="Chi tiết thông báo"
        title={previewNotification?.title || 'Chi tiết thông báo'}
        onClose={() => setDrawerOpen(false)}
      >
        {previewNotification ? <NotificationPreview notification={previewNotification} /> : null}
      </PreviewDrawer>
    </>
  );
};

export default NotificationsPage;
