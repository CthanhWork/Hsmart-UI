import { useEffect, useMemo, useState } from 'react';
import { Flag, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminDataTable from '../../components/admin/AdminDataTable';
import PreviewDrawer from '../../components/admin/PreviewDrawer';
import ProductPreview from '../../components/admin/ProductPreview';
import {
  apiFetchPendingReports,
  apiFetchProductById,
  apiProcessReport,
} from '../../services/api';
import { formatDateTime } from './format';

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  DISMISSED: 'Đã bỏ qua',
};

const STATUS_TONE = {
  PENDING: 'is-pending',
  RESOLVED: 'is-resolved',
  DISMISSED: 'is-dismissed',
};

const ReportsPage = () => {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [pendingId, setPendingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await apiFetchPendingReports({ status: statusFilter, page: 0, size: 50 });
      setReports(page.content || []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openPreview = async (report) => {
    if (!report?.productId) return;
    setDrawerOpen(true);
    setPreviewLoading(true);
    setPreviewProduct(null);
    setPreviewReport(report);
    try {
      setPreviewProduct(await apiFetchProductById(report.productId));
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tải chi tiết tin đăng.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const processReport = async (report, action) => {
    setPendingId(report.id);
    try {
      await apiProcessReport(report.id, action);
      toast.success(action === 'HIDE_PRODUCT'
        ? `Đã xử lý báo cáo #${report.id} & ẩn tin đăng.`
        : `Đã bỏ qua báo cáo #${report.id}.`);
      await loadReports();
    } catch (requestError) {
      toast.error(requestError.message || 'Thao tác không thành công.');
    } finally {
      setPendingId(null);
    }
  };

  const visibleReports = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) => (
      String(report.id).includes(query)
      || String(report.productId).includes(query)
      || String(report.reporterId).toLowerCase().includes(query)
      || report.reason?.toLowerCase().includes(query)
    ));
  }, [filter, reports]);

  const columns = [
    {
      key: 'id',
      header: 'Mã báo cáo',
      render: (report) => (
        <div className="adm-stack-cell">
          <strong translate="no">#{report.id}</strong>
          <small>{formatDateTime(report.createdAt)}</small>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Sản phẩm',
      render: (report) => (
        <button
          type="button"
          className="adm-entity-link"
          onClick={() => openPreview(report)}
        >
          <strong translate="no">#{report.productId}</strong>
          <small>Xem tin đăng</small>
        </button>
      ),
    },
    {
      key: 'reporter',
      header: 'Người báo cáo',
      render: (report) => report.reporterId || '—',
    },
    {
      key: 'reason',
      header: 'Lý do',
      cellClassName: 'adm-reason-cell',
      render: (report) => report.reason || 'Không có nội dung báo cáo.',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (report) => (
        <span className={`adm-status-pill ${STATUS_TONE[report.status] || 'is-pending'}`}>
          {STATUS_LABELS[report.status] || report.status || 'Chờ xử lý'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (report) => {
        if (report.status && report.status !== 'PENDING') {
          return report.resolutionReason
            ? <span className="adm-muted">{report.resolutionReason}</span>
            : <span className="adm-muted">Đã xử lý</span>;
        }
        return (
          <div className="adm-row-actions">
            <button
              type="button"
              className="adm-text-action view"
              onClick={() => openPreview(report)}
            >
              Xem chi tiết
            </button>
            <button
              type="button"
              className="adm-text-action reject"
              disabled={pendingId === report.id}
              onClick={() => processReport(report, 'HIDE_PRODUCT')}
            >
              Ẩn tin
            </button>
            <button
              type="button"
              className="adm-text-action neutral"
              disabled={pendingId === report.id}
              onClick={() => processReport(report, 'DISMISS')}
            >
              Bỏ qua
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Báo cáo từ người dùng"
        title="Xử lý báo cáo"
        description="Mở trực tiếp tin đăng bị báo cáo để đối chiếu lý do và ra quyết định nhanh hơn."
        onRefresh={loadReports}
        refreshing={loading}
      >
        <label className="adm-search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            name="reportFilter"
            autoComplete="off"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Lọc theo mã báo cáo, sản phẩm hoặc người báo cáo…"
          />
        </label>

        <select
          className="adm-select"
          name="reportStatusFilter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="PENDING">Chờ xử lý</option>
          <option value="RESOLVED">Đã xử lý</option>
          <option value="DISMISSED">Đã bỏ qua</option>
          <option value="">Tất cả</option>
        </select>
      </AdminPageHeader>

      <AdminDataTable
        columns={columns}
        rows={visibleReports}
        loading={loading}
        error={error}
        emptyIcon={Flag}
        emptyTitle="Không có báo cáo phù hợp với bộ lọc hiện tại."
      />

      <PreviewDrawer
        open={drawerOpen}
        kicker="Tin đăng bị báo cáo"
        title={previewProduct?.title || 'Chi tiết tin đăng'}
        loading={previewLoading}
        onClose={() => setDrawerOpen(false)}
      >
        {!previewLoading && previewProduct
          ? <ProductPreview product={previewProduct} report={previewReport} />
          : null}
      </PreviewDrawer>
    </>
  );
};

export default ReportsPage;
