import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Check,
  Flag,
  FolderPlus,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import {
  apiBanUser,
  apiCreateCategory,
  apiFetchAdminStats,
  apiFetchPendingReports,
  apiFetchProductPage,
  apiModerateProduct,
  apiProcessReport,
} from '../services/api';
import './Admin.css';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [userId, setUserId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [activeQueue, setActiveQueue] = useState('products');
  const [productFilter, setProductFilter] = useState('');
  const [reportFilter, setReportFilter] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextStats, productPage, reportPage] = await Promise.all([
        apiFetchAdminStats(),
        apiFetchProductPage({ status: 'PENDING_REVIEW', size: 50 }),
        apiFetchPendingReports(0, 50),
      ]);
      setStats(nextStats);
      setProducts(productPage.content || []);
      setReports(reportPage.content || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetchAdminStats(),
      apiFetchProductPage({ status: 'PENDING_REVIEW', size: 50 }),
      apiFetchPendingReports(0, 50),
    ]).then(([nextStats, productPage, reportPage]) => {
      if (cancelled) return;
      setStats(nextStats);
      setProducts(productPage.content || []);
      setReports(reportPage.content || []);
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action, successMessage) => {
    setError('');
    setFeedback('');
    try {
      await action();
      setFeedback(successMessage);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitBan = (event) => {
    event.preventDefault();
    const targetUserId = userId.trim();
    if (!targetUserId) return;
    run(() => apiBanUser(targetUserId), `Người dùng ${targetUserId} đã bị khóa.`);
    setUserId('');
  };

  const submitCategory = (event) => {
    event.preventDefault();
    const targetCategory = categoryName.trim();
    if (!targetCategory) return;
    run(() => apiCreateCategory(targetCategory), `Danh mục ${targetCategory} đã được tạo.`);
    setCategoryName('');
  };

  const visibleProducts = useMemo(() => {
    const query = productFilter.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => (
      product.title?.toLowerCase().includes(query)
      || String(product.id).includes(query)
      || String(product.sellerId).includes(query)
    ));
  }, [productFilter, products]);

  const visibleReports = useMemo(() => {
    const query = reportFilter.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) => (
      String(report.id).includes(query)
      || String(report.productId).includes(query)
      || String(report.reporterId).includes(query)
      || report.reason?.toLowerCase().includes(query)
    ));
  }, [reportFilter, reports]);

  const metrics = [
    {
      label: 'Người dùng',
      value: stats?.totalUsers ?? '-',
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Đang bán',
      value: stats?.totalSellingProducts ?? '-',
      icon: PackageCheck,
      tone: 'green',
    },
    {
      label: 'Doanh thu',
      value: stats ? formatMoney(stats.totalCompletedRevenue) : '-',
      icon: WalletCards,
      tone: 'orange',
    },
    {
      label: 'Chờ xử lý',
      value: products.length + reports.length,
      icon: ShieldAlert,
      tone: 'red',
    },
  ];

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-shell">
        <header className="admin-topbar">
          <h1>Admin</h1>
          <button className="admin-icon-button" type="button" onClick={load} disabled={loading} title="Tải lại">
            <RefreshCw size={18} />
          </button>
        </header>

        {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
        {feedback ? <div className="admin-alert admin-alert-success">{feedback}</div> : null}

        <section className="admin-metrics-grid" aria-label="Chỉ số quản trị">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className={`admin-metric-card metric-${metric.tone}`} key={metric.label}>
                <span><Icon size={18} /></span>
                <div>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="admin-tool-grid" aria-label="Công cụ quản trị">
          <form className="admin-tool-form" onSubmit={submitBan}>
            <div className="admin-tool-title">
              <Ban size={18} />
              <strong>Khóa người dùng</strong>
            </div>
            <input
              required
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Mã người dùng"
            />
            <button type="submit">Khóa</button>
          </form>

          <form className="admin-tool-form" onSubmit={submitCategory}>
            <div className="admin-tool-title">
              <FolderPlus size={18} />
              <strong>Tạo danh mục</strong>
            </div>
            <input
              required
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Tên danh mục"
            />
            <button type="submit">Tạo</button>
          </form>
        </section>

        <section className="admin-workspace">
          <div className="admin-workspace-toolbar">
            <div className="admin-segmented" role="tablist" aria-label="Hàng đợi">
              <button
                type="button"
                className={activeQueue === 'products' ? 'active' : ''}
                onClick={() => setActiveQueue('products')}
              >
                <PackageSearch size={16} />
                Sản phẩm
                <span>{products.length}</span>
              </button>
              <button
                type="button"
                className={activeQueue === 'reports' ? 'active' : ''}
                onClick={() => setActiveQueue('reports')}
              >
                <Flag size={16} />
                Báo cáo
                <span>{reports.length}</span>
              </button>
            </div>

            <label className="admin-search-field">
              <Search size={16} />
              <input
                value={activeQueue === 'products' ? productFilter : reportFilter}
                onChange={(event) => (
                  activeQueue === 'products'
                    ? setProductFilter(event.target.value)
                    : setReportFilter(event.target.value)
                )}
                placeholder="Lọc nhanh"
              />
            </label>
          </div>

          {activeQueue === 'products' ? (
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Người bán</th>
                    <th>AI</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const detection = Array.isArray(product.aiMetadata) ? product.aiMetadata[0] : null;
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="admin-product-cell">
                            <strong>{product.title}</strong>
                            <small>#{product.id}</small>
                          </div>
                        </td>
                        <td>{product.sellerId}</td>
                        <td>
                          {detection?.label || 'Chưa có'}
                          {detection ? <small>{Math.round(Number(detection.confidence ?? detection.score ?? 0) * 100)}%</small> : null}
                        </td>
                        <td><StatusBadge status={product.status} /></td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="admin-action approve"
                              type="button"
                              onClick={() => run(() => apiModerateProduct(product.id, 'APPROVE'), `Sản phẩm ${product.id} đã được duyệt.`)}
                              title="Duyệt"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              className="admin-action reject"
                              type="button"
                              onClick={() => run(() => apiModerateProduct(product.id, 'REJECT'), `Sản phẩm ${product.id} đã bị từ chối.`)}
                              title="Từ chối"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleProducts.length === 0 ? <div className="admin-empty-state">Không có sản phẩm.</div> : null}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Báo cáo</th>
                    <th>Sản phẩm</th>
                    <th>Người báo cáo</th>
                    <th>Lý do</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReports.map((report) => (
                    <tr key={report.id}>
                      <td>#{report.id}</td>
                      <td>#{report.productId}</td>
                      <td>{report.reporterId}</td>
                      <td>{report.reason}</td>
                      <td>
                        <div className="admin-row-actions wide">
                          <button
                            className="admin-action-text approve"
                            type="button"
                            onClick={() => run(() => apiProcessReport(report.id, 'HIDE_PRODUCT'), `Báo cáo ${report.id} đã được xử lý.`)}
                          >
                            Ẩn
                          </button>
                          <button
                            className="admin-action-text neutral"
                            type="button"
                            onClick={() => run(() => apiProcessReport(report.id, 'DISMISS'), `Báo cáo ${report.id} đã được bỏ qua.`)}
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleReports.length === 0 ? <div className="admin-empty-state">Không có báo cáo.</div> : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Admin;
