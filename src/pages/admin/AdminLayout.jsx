import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronLeft,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  Star,
  Store,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { apiFetchAdminNotificationUnreadCount } from '../../services/api';
import './admin.css';

/* Navigation grouped under section titles — mirrors the CoreUI sidebar
   (nav-title + nav-item) structure. */
const NAV_SECTIONS = [
  {
    title: null,
    items: [{ to: '/admin', end: true, label: 'Tổng quan', icon: LayoutDashboard }],
  },
  {
    title: 'Kiểm duyệt',
    items: [
      { to: '/admin/products', label: 'Sản phẩm', icon: PackageSearch },
      { to: '/admin/reports', label: 'Báo cáo', icon: Flag },
      { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { to: '/admin/users', label: 'Người dùng', icon: Users },
      { to: '/admin/orders', label: 'Đơn hàng', icon: ReceiptText },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/admin/system-account', label: 'Tài khoản hệ thống', icon: Wallet },
      { to: '/admin/notifications', label: 'Thông báo', icon: Bell, badgeKey: 'notifications' },
    ],
  },
];

const PAGE_TITLES = {
  '/admin': 'Tổng quan',
  '/admin/products': 'Sản phẩm',
  '/admin/reports': 'Báo cáo',
  '/admin/reviews': 'Đánh giá',
  '/admin/users': 'Người dùng',
  '/admin/orders': 'Đơn hàng',
  '/admin/system-account': 'Tài khoản hệ thống',
  '/admin/notifications': 'Thông báo',
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiFetchAdminNotificationUnreadCount()
      .then((count) => setUnreadCount(Number(count) || 0))
      .catch(() => {});
  }, []);

  // Close transient UI on navigation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setMobileOpen((open) => !open);
    } else {
      setNarrow((value) => !value);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Quản trị';
  const isOverview = location.pathname === '/admin';
  const displayName = user?.fullName || user?.username || 'Quản trị viên';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const badgeFor = (item) => (item.badgeKey === 'notifications' && unreadCount > 0
    ? (unreadCount > 99 ? '99+' : unreadCount)
    : null);

  const appClass = [
    'adm-app',
    narrow ? 'is-narrow' : '',
    mobileOpen ? 'is-mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={appClass}>
      {/* --- Sidebar ----------------------------------------------------- */}
      <aside className="adm-sidebar" aria-label="Điều hướng quản trị">
        <div className="adm-sidebar-header">
          <Link to="/admin" className="adm-sidebar-brand">
            <span className="adm-sidebar-logo"><ShieldCheck size={20} aria-hidden="true" /></span>
            <span className="adm-sidebar-brand-full">
              <strong>H-SMART</strong>
              <small>Bảng quản trị</small>
            </span>
          </Link>
          <button
            type="button"
            className="adm-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="adm-sidebar-nav">
          {NAV_SECTIONS.map((section, index) => (
            <div className="adm-nav-section" key={section.title || `root-${index}`}>
              {section.title ? <p className="adm-nav-title">{section.title}</p> : null}
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = badgeFor(item);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `adm-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} aria-hidden="true" className="adm-nav-icon" />
                    <span className="adm-nav-label">{item.label}</span>
                    {badge ? <span className="adm-nav-badge">{badge}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <button
            type="button"
            className="adm-sidebar-toggler"
            onClick={() => setNarrow((value) => !value)}
            aria-label={narrow ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Scrim for the mobile off-canvas sidebar */}
      <div className="adm-sidebar-scrim" role="presentation" onClick={() => setMobileOpen(false)} />

      {/* --- Wrapper (header + body + footer) ---------------------------- */}
      <div className="adm-wrapper">
        <header className="adm-header">
          <div className="adm-header-row">
            <button
              type="button"
              className="adm-header-toggler"
              onClick={toggleSidebar}
              aria-label="Bật/tắt menu"
            >
              <Menu size={22} aria-hidden="true" />
            </button>

            <ul className="adm-header-nav">
              <li>
                <Link className="adm-header-link" to="/admin/notifications" aria-label="Thông báo">
                  <Bell size={20} aria-hidden="true" />
                  {unreadCount > 0 ? (
                    <span className="adm-header-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  ) : null}
                </Link>
              </li>
              <li className="adm-header-divider" aria-hidden="true" />
              <li className="adm-profile">
                <button
                  type="button"
                  className="adm-profile-toggle"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="adm-avatar-img" />
                  ) : (
                    <span className="adm-avatar">{avatarLetter}</span>
                  )}
                </button>
                {profileOpen ? (
                  <>
                    <div className="adm-profile-scrim" role="presentation" onClick={() => setProfileOpen(false)} />
                    <div className="adm-profile-menu">
                      <div className="adm-profile-head">
                        <strong>{displayName}</strong>
                        <small>{user?.email || 'Tài khoản quản trị'}</small>
                      </div>
                      <Link className="adm-profile-item" to="/profile">
                        <User size={16} aria-hidden="true" /> Hồ sơ của tôi
                      </Link>
                      <Link className="adm-profile-item" to="/">
                        <Store size={16} aria-hidden="true" /> Về trang chợ
                      </Link>
                      <div className="adm-profile-sep" />
                      <button type="button" className="adm-profile-item is-danger" onClick={handleLogout}>
                        <LogOut size={16} aria-hidden="true" /> Đăng xuất
                      </button>
                    </div>
                  </>
                ) : null}
              </li>
            </ul>
          </div>

          <div className="adm-breadcrumb">
            <Link to="/admin">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            {isOverview ? (
              <span className="adm-breadcrumb-active">Bảng điều khiển</span>
            ) : (
              <span className="adm-breadcrumb-active">{pageTitle}</span>
            )}
          </div>
        </header>

        <main className="adm-body">
          <div className="adm-container">
            <Outlet />
          </div>
        </main>

        <footer className="adm-footer">
          <span><strong>H-smart</strong> · Bảng quản trị</span>
          <span className="adm-footer-end">© 2026 H-smart Marketplace</span>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
