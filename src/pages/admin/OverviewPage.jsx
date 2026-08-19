import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FolderPlus,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useRealtime } from '../../context/RealtimeContext';
import {
  FeeAreaChart,
  BalanceLineChart,
  OrdersDonut,
  OrdersWeeklyChart,
} from '../../components/admin/AdminCharts';
import {
  apiCreateCategory,
  apiFetchAdminOrders,
  apiFetchAdminReviews,
  apiFetchAdminStats,
  apiFetchPendingReports,
  apiFetchProductPage,
  apiFetchSystemLedger,
} from '../../services/api';
import {
  ORDER_STATUSES,
  aggregateLedger,
  aggregateOrdersByWeek,
} from './analytics';
import { formatMoney } from './format';

const PERIODS = [
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'year', label: 'Năm' },
];

const QUICK_LINKS = [
  { to: '/admin/products', label: 'Duyệt tin đăng', caption: 'Kiểm duyệt sản phẩm chờ', countKey: 'products' },
  { to: '/admin/reports', label: 'Xử lý báo cáo', caption: 'Báo cáo từ người dùng', countKey: 'reports' },
  { to: '/admin/users', label: 'Quản lý người dùng', caption: 'Tìm kiếm & ban/unban' },
  { to: '/admin/orders', label: 'Đơn hàng', caption: 'Theo dõi giao dịch' },
  { to: '/admin/reviews', label: 'Kiểm duyệt đánh giá', caption: 'Ẩn / khôi phục review', countKey: 'reviews' },
  { to: '/admin/system-account', label: 'Tài khoản hệ thống', caption: 'Ví hệ thống & sổ giao dịch' },
];

const fetchAllPages = async (fetchPage, pageSize = 100, maxPages = 20) => {
  const rows = [];
  let page = 0;

  for (let guard = 0; guard < maxPages; guard += 1) {
    const result = await fetchPage(page, pageSize);
    rows.push(...(result.content || []));
    if (result.last || result.content?.length === 0 || page + 1 >= (result.totalPages || 0)) {
      break;
    }
    page += 1;
  }

  return rows;
};

const OverviewPage = () => {
  const toast = useToast();
  const realtime = useRealtime();
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({ products: 0, reports: 0, reviews: 0 });
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  const loadedOnce = useRef(false);

  const loadOverview = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [nextStats, productPage, reportPage, reviewPage, ledgerRows, orderRows, ...statusPages] = await Promise.all([
        apiFetchAdminStats(),
        apiFetchProductPage({ status: 'PENDING_REVIEW', size: 1 }),
        apiFetchPendingReports({ status: 'PENDING', page: 0, size: 1 }),
        apiFetchAdminReviews({ page: 0, size: 1 }),
        fetchAllPages((page, size) => apiFetchSystemLedger({ page, size }), 100),
        fetchAllPages((page, size) => apiFetchAdminOrders({ page, size }), 100),
        ...ORDER_STATUSES.map((status) => apiFetchAdminOrders({ status: status.key, size: 1 })),
      ]);

      setStats(nextStats);
      setCounts({
        products: productPage.totalElements || 0,
        reports: reportPage.totalElements || 0,
        reviews: reviewPage.totalElements || 0,
      });
      setLedgerEntries(ledgerRows || []);
      setOrders(orderRows || []);
      setStatusCounts(
        ORDER_STATUSES.map((status, index) => ({
          name: status.label,
          color: status.color,
          value: statusPages[index]?.totalElements || 0,
        })).filter((item) => item.value > 0),
      );
      setLastUpdated(new Date());
    } catch (requestError) {
      if (!silent) toast.error(requestError.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      if (!silent) setLoading(false);
      loadedOnce.current = true;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOverview();
    const id = setInterval(() => loadOverview(true), 45000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadedOnce.current) loadOverview(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime?.unreadCount]);

  const feeSeries = useMemo(() => aggregateLedger(ledgerEntries, period), [ledgerEntries, period]);
  const weeklyOrders = useMemo(() => aggregateOrdersByWeek(orders), [orders]);

  const submitCategory = async (event) => {
    event.preventDefault();
    const target = categoryName.trim();
    if (!target) return;

    setCreating(true);
    try {
      await apiCreateCategory(target);
      toast.success(`Đã tạo danh mục "${target}".`);
      setCategoryName('');
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể tạo danh mục.');
    } finally {
      setCreating(false);
    }
  };

  const dash = loading ? '…' : undefined;
  const widgets = [
    { tone: 'primary', icon: Users, label: 'Người dùng', value: dash ?? (stats?.totalUsers ?? '—'), to: '/admin/users' },
    { tone: 'info', icon: PackageCheck, label: 'Tin đang bán', value: dash ?? (stats?.totalSellingProducts ?? '—'), to: '/admin/products' },
    { tone: 'warning', icon: WalletCards, label: 'Doanh thu hoàn tất', value: dash ?? (stats ? formatMoney(stats.totalCompletedRevenue) : '—'), to: '/admin/system-account' },
    { tone: 'danger', icon: ShieldAlert, label: 'Cần xử lý', value: dash ?? (counts.products + counts.reports), to: '/admin/products' },
  ];

  return (
    <>
      <div className="adm-dash-toolbar">
        <div>
          <h1 className="adm-dash-title">Bảng điều khiển</h1>
          <p className="adm-dash-sub">
            {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Đang tải dữ liệu...'}
            <span className={`adm-live ${realtime?.connected ? 'is-on' : ''}`}>
              {realtime?.connected ? 'Realtime' : 'Offline'}
            </span>
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => loadOverview()} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" className={loading ? 'adm-spin' : ''} /> Làm mới
        </button>
      </div>

      <section className="adm-widgets" aria-label="Chỉ số quản trị">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <Link key={widget.label} to={widget.to} className={`adm-widget adm-widget--${widget.tone}`}>
              <div className="adm-widget-head">
                <div className="adm-widget-copy">
                  <div className="adm-widget-value">{widget.value}</div>
                  <div className="adm-widget-label">{widget.label}</div>
                </div>
                <span className="adm-widget-icon">
                  <Icon size={26} aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="adm-chart-card" aria-label="Doanh thu phí theo thời gian">
        <div className="adm-chart-head">
          <div>
            <h2>Doanh thu phí nền tảng theo tuần</h2>
            <p className="adm-card-sub">Tổng hợp từ số giao dịch ví hệ thống trong 12 tuần gần nhất</p>
          </div>
          <div className="adm-period" role="group" aria-label="Khoảng thời gian">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={period === item.key ? 'is-active' : ''}
                onClick={() => setPeriod(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="adm-chart-body">
          <FeeAreaChart data={feeSeries} height={320} />
        </div>
      </section>

      <section className="adm-charts-2">
        <div className="adm-chart-card">
          <div className="adm-chart-head">
            <div>
              <h2>Số dư ví hệ thống</h2>
              <p className="adm-card-sub">Số dư sau mỗi mốc theo tuần</p>
            </div>
          </div>
          <div className="adm-chart-body">
            <BalanceLineChart data={feeSeries} height={300} />
          </div>
        </div>

        <div className="adm-chart-card">
          <div className="adm-chart-head">
            <div>
              <h2>Đơn hàng theo trạng thái</h2>
              <p className="adm-card-sub">Phân bổ toàn bộ đơn trên sàn</p>
            </div>
          </div>
          <div className="adm-chart-body">
            <OrdersDonut data={statusCounts} />
          </div>
        </div>
      </section>

      <section className="adm-chart-card" aria-label="Đơn hàng theo tuần">
        <div className="adm-chart-head">
          <div>
            <h2>Đơn hàng &amp; doanh thu theo tuần</h2>
            <p className="adm-card-sub">Tổng hợp từ {orders.length} đơn gần nhất</p>
          </div>
        </div>
        <div className="adm-chart-body">
          <OrdersWeeklyChart data={weeklyOrders} height={320} />
        </div>
      </section>

      <section className="adm-row">
        <div className="adm-card adm-quicklinks">
          <h2 className="adm-card-title">Tác vụ nhanh</h2>
          <div className="adm-quicklinks-grid">
            {QUICK_LINKS.map((item) => {
              const badge = item.countKey ? counts[item.countKey] : null;
              return (
                <Link key={item.to} to={item.to} className="adm-quicklink">
                  <span className="adm-quicklink-icon">
                    <ArrowRight size={18} aria-hidden="true" />
                  </span>
                  <span className="adm-quicklink-copy">
                    <strong>{item.label}</strong>
                    <small>{item.caption}</small>
                  </span>
                  {badge ? <span className="adm-quicklink-badge">{badge}</span> : null}
                  <ArrowRight size={16} aria-hidden="true" className="adm-quicklink-arrow" />
                </Link>
              );
            })}
          </div>
        </div>

        <form className="adm-card adm-create-category" onSubmit={submitCategory}>
          <div className="adm-card-head">
            <span className="adm-card-icon">
              <FolderPlus size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="adm-card-title">Tạo danh mục</h2>
              <p className="adm-card-sub">Thêm nhóm sản phẩm mới để seller chọn đúng loại tin đăng.</p>
            </div>
          </div>

          <label className="adm-field">
            <span>Tên danh mục</span>
            <input
              required
              type="text"
              name="categoryName"
              autoComplete="off"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ví dụ: Máy sấy mini..."
            />
          </label>

          <button type="submit" className="adm-btn adm-btn-primary" disabled={creating}>
            {creating ? 'Đang tạo...' : 'Tạo danh mục'}
          </button>
        </form>
      </section>
    </>
  );
};

export default OverviewPage;
