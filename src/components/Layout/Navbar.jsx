import { useState } from 'react';
import { Bell, Heart, LogOut, Menu, Search, Shield, User, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import AuthModal from '../Auth/AuthModal';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');

  const closeMenu = () => setMenuOpen(false);

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/');
    closeMenu();
  };

  return (
    <>
      <div className="uk-navbar-container tm-navbar-container navbar-sticky">
        <div className="uk-container nav-shell">
          <nav className="uk-navbar hsmart-navbar">
            <div className="uk-navbar-left nav-left-cluster">
              <button
                className="uk-navbar-toggle uk-hidden@m menu-toggle-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Mở menu điều hướng"
              >
                <Menu size={22} />
              </button>

              <Link to="/" className="uk-navbar-item uk-logo navbar-brand-logo" onClick={closeMenu}>
                <img className="brand-logo-image" src="/hsmart-logo.svg" alt="H-Smart" />
                <span className="brand-wordmark">H-Smart</span>
              </Link>

              <ul className="uk-navbar-nav uk-visible@m desktop-nav-menu">
                <li>
                  <NavLink to="/" end className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                    Chợ đồ gia dụng
                  </NavLink>
                </li>
                {isAuthenticated && (
                  <>
                    <li>
                      <NavLink to="/sell" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                        Đăng bán
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/listings" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                        Tin đăng
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/orders" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                        Đơn hàng
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/chat" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                        Tin nhắn
                      </NavLink>
                    </li>
                    {user?.role === 'ADMIN' && (
                      <li>
                        <NavLink to="/admin" className={({ isActive }) => `nav-item-link admin-link ${isActive ? 'active' : ''}`}>
                          <Shield size={13} style={{ marginRight: '4px' }} /> Quản trị
                        </NavLink>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

            <div className="nav-center-cluster">
              <form className="nav-search-form uk-visible@s" onSubmit={search}>
                <div className="search-input-wrapper">
                  <Search size={15} className="search-icon-inside" />
                  <input
                    className="uk-input search-navbar-input"
                    type="search"
                    placeholder="Tìm sản phẩm..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="uk-navbar-right nav-right-cluster">
              {isAuthenticated ? (
                <div className="navbar-actions-group">
                  <NavLink to="/wishlist" className={({ isActive }) => `action-icon-button ${isActive ? 'active' : ''}`} title="Đã lưu">
                    <Heart size={20} />
                  </NavLink>
                  <NavLink to="/notifications" className={({ isActive }) => `action-icon-button ${isActive ? 'active' : ''}`} title="Thông báo">
                    <Bell size={20} />
                  </NavLink>
                  <div className="user-profile-menu-container">
                    <button
                      className={`action-icon-button ${profileDropdownOpen ? 'active' : ''}`}
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
                      title="Menu tài khoản"
                    >
                      <User size={20} />
                    </button>
                    {profileDropdownOpen && (
                      <div className="user-dropdown-panel">
                        <ul className="uk-nav uk-dropdown-nav">
                          <li className="dropdown-username-header">Xin chào, {user?.fullName || user?.username}</li>
                          <li className="uk-nav-divider"></li>
                          <li>
                            <Link to="/profile" onClick={() => setProfileDropdownOpen(false)}>Hồ sơ của tôi</Link>
                          </li>
                          <li>
                            <Link to="/listings" onClick={() => setProfileDropdownOpen(false)}>Tin đăng của tôi</Link>
                          </li>
                          <li>
                            <Link to="/orders" onClick={() => setProfileDropdownOpen(false)}>Đơn hàng của tôi</Link>
                          </li>
                          <li className="uk-nav-divider"></li>
                          <li>
                            <button className="dropdown-logout-btn" onClick={logout}>
                              <LogOut size={14} style={{ marginRight: '6px' }} /> Đăng xuất
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button className="uk-button uk-button-primary navbar-signin-btn" onClick={() => setAuthOpen(true)}>
                  Đăng nhập
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Offcanvas Drawer (React-controlled) */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMenu}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="drawer-logo">
                <img className="brand-logo-image" src="/hsmart-logo.svg" alt="H-Smart" />
                <span>H-Smart</span>
              </span>
              <button className="drawer-close-btn" onClick={closeMenu}>
                <X size={20} />
              </button>
            </div>
            
            <form className="mobile-search-form" onSubmit={search}>
              <div className="search-input-wrapper">
                <Search size={15} className="search-icon-inside" />
                <input
                  className="uk-input"
                  type="search"
                  placeholder="Tìm sản phẩm..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </form>

            <ul className="uk-nav uk-nav-default mobile-nav-menu">
              <li>
                <NavLink to="/" end className="mobile-nav-link" onClick={closeMenu}>
                  Chợ đồ gia dụng
                </NavLink>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <NavLink to="/sell" className="mobile-nav-link" onClick={closeMenu}>
                      Đăng bán
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/listings" className="mobile-nav-link" onClick={closeMenu}>
                      Tin đăng của tôi
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/orders" className="mobile-nav-link" onClick={closeMenu}>
                      Đơn hàng của tôi
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/wishlist" className="mobile-nav-link" onClick={closeMenu}>
                      Đã lưu
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/chat" className="mobile-nav-link" onClick={closeMenu}>
                      Tin nhắn
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/notifications" className="mobile-nav-link" onClick={closeMenu}>
                      Thông báo
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                      Hồ sơ của tôi
                    </NavLink>
                  </li>
                  {user?.role === 'ADMIN' && (
                    <li>
                      <NavLink to="/admin" className="mobile-nav-link admin-link" onClick={closeMenu}>
                        <Shield size={14} style={{ marginRight: '6px' }} /> Bảng quản trị
                      </NavLink>
                    </li>
                  )}
                  <li className="uk-nav-divider"></li>
                  <li>
                    <button className="mobile-logout-btn" onClick={() => { logout(); closeMenu(); }}>
                      <LogOut size={14} style={{ marginRight: '6px' }} /> Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button className="uk-button uk-button-primary mobile-signin-btn" onClick={() => { setAuthOpen(true); closeMenu(); }}>
                    Đăng nhập
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
