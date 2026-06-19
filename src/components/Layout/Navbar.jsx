import { useEffect, useState } from 'react';
import { Bell, Heart, LogOut, Menu, MessageCircle, Search, Shield, User, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRealtime } from '../../context/RealtimeContext';
import { useUser } from '../../context/UserContext';
import AuthModal from '../Auth/AuthModal';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUser();
  const realtime = useRealtime();
  const unreadCount = realtime?.unreadCount ?? 0;
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const nextQuery = new URLSearchParams(location.search).get('q') || '';
    setQuery(nextQuery);
  }, [location.search]);

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search');
    closeMenu();
  };

  return (
    <>
      <header className="navbar-root navbar-sticky">
        {/* Row 1: Logo + Actions */}
        <div className="navbar-top-row">
          <div className="navbar-container">
            <div className="navbar-top-inner">
              {/* Left: hamburger (mobile) + logo */}
              <div className="navbar-brand-group">
                <button
                  className="nav-icon-btn uk-hidden@m"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Mo menu"
                >
                  <Menu size={20} />
                </button>
                <Link to="/" className="navbar-logo-link" onClick={closeMenu}>
                  <img src="/hsmart-logo.svg" alt="H-Smart" className="navbar-logo-img" />
                  <span className="navbar-logo-text">H-Smart</span>
                </Link>
              </div>

              {/* Right: action icons */}
              <div className="navbar-actions">
                {isAuthenticated ? (
                  <>
                    <NavLink to="/wishlist" className={({ isActive }) => `nav-icon-btn${isActive ? ' active' : ''}`} title="Da luu">
                      <Heart size={19} />
                    </NavLink>
                    <NavLink to="/chat" className={({ isActive }) => `nav-icon-btn${isActive ? ' active' : ''}`} title="Tin nhan">
                      <MessageCircle size={19} />
                    </NavLink>
                    <NavLink to="/notifications" className={({ isActive }) => `nav-icon-btn notif-wrap${isActive ? ' active' : ''}`} title="Thong bao">
                      <Bell size={19} />
                      {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                      )}
                    </NavLink>
                    <div className="nav-profile-wrap">
                      <button
                        className={`nav-icon-btn${profileDropdownOpen ? ' active' : ''}`}
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
                        title="Tai khoan"
                      >
                        <User size={19} />
                      </button>
                      {profileDropdownOpen && (
                        <div className="nav-dropdown">
                          <div className="nav-dropdown-name">Xin chao, {user?.fullName || user?.username}</div>
                          <div className="nav-dropdown-divider" />
                          <Link className="nav-dropdown-item" to="/profile" onClick={() => setProfileDropdownOpen(false)}>Ho so cua toi</Link>
                          <Link className="nav-dropdown-item" to="/listings" onClick={() => setProfileDropdownOpen(false)}>Tin dang cua toi</Link>
                          <Link className="nav-dropdown-item" to="/orders" onClick={() => setProfileDropdownOpen(false)}>Don hang cua toi</Link>
                          {user?.role === 'ADMIN' && (
                            <Link className="nav-dropdown-item" to="/admin" onClick={() => setProfileDropdownOpen(false)}>
                              <Shield size={13} style={{ marginRight: '5px' }} />Quan tri
                            </Link>
                          )}
                          <div className="nav-dropdown-divider" />
                          <button className="nav-dropdown-item nav-dropdown-logout" onClick={logout}>
                            <LogOut size={13} style={{ marginRight: '5px' }} />Dang xuat
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <button className="navbar-signin-btn" onClick={() => setAuthOpen(true)}>
                    Dang nhap
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Search + Nav links (desktop) */}
        <div className="navbar-bottom-row uk-visible@s">
          <div className="navbar-container">
            <div className="navbar-bottom-inner">
              {/* Search */}
              <form className="navbar-search-form" onSubmit={search}>
                <div className="navbar-search-wrap">
                  <Search size={15} className="navbar-search-icon" />
                  <input
                    type="search"
                    className="navbar-search-input"
                    placeholder="Tim san pham gia dung..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="submit" className="navbar-search-btn">Tim kiem</button>
                </div>
              </form>

              {/* Nav links */}
              <nav className="navbar-nav-links">
                <NavLink to="/" end className={({ isActive }) => `navbar-nav-link${isActive ? ' active' : ''}`}>
                  Cho do gia dung
                </NavLink>
                {isAuthenticated && (
                  <>
                    <NavLink to="/sell" className={({ isActive }) => `navbar-nav-link${isActive ? ' active' : ''}`}>
                      Dang ban
                    </NavLink>
                    <NavLink to="/listings" className={({ isActive }) => `navbar-nav-link${isActive ? ' active' : ''}`}>
                      Tin dang
                    </NavLink>
                    <NavLink to="/orders" className={({ isActive }) => `navbar-nav-link${isActive ? ' active' : ''}`}>
                      Don hang
                    </NavLink>
                    {user?.role === 'ADMIN' && (
                      <NavLink to="/admin" className={({ isActive }) => `navbar-nav-link admin-nav-link${isActive ? ' active' : ''}`}>
                        <Shield size={12} style={{ marginRight: '4px' }} />Quan tri
                      </NavLink>
                    )}
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMenu}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-logo">
                <img src="/hsmart-logo.svg" alt="H-Smart" className="navbar-logo-img" />
                <span>H-Smart</span>
              </span>
              <button className="nav-icon-btn" onClick={closeMenu}><X size={20} /></button>
            </div>

            <form className="mobile-search-form" onSubmit={search}>
              <div className="navbar-search-wrap">
                <Search size={15} className="navbar-search-icon" />
                <input
                  type="search"
                  className="navbar-search-input"
                  placeholder="Tim san pham..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </form>

            <nav className="mobile-nav-list">
              <NavLink to="/" end className="mobile-nav-link" onClick={closeMenu}>Cho do gia dung</NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink to="/sell" className="mobile-nav-link" onClick={closeMenu}>Dang ban</NavLink>
                  <NavLink to="/listings" className="mobile-nav-link" onClick={closeMenu}>Tin dang cua toi</NavLink>
                  <NavLink to="/orders" className="mobile-nav-link" onClick={closeMenu}>Don hang cua toi</NavLink>
                  <NavLink to="/wishlist" className="mobile-nav-link" onClick={closeMenu}>Da luu</NavLink>
                  <NavLink to="/chat" className="mobile-nav-link" onClick={closeMenu}>Tin nhan</NavLink>
                  <NavLink to="/notifications" className="mobile-nav-link" onClick={closeMenu}>Thong bao</NavLink>
                  <NavLink to="/profile" className="mobile-nav-link" onClick={closeMenu}>Ho so cua toi</NavLink>
                  {user?.role === 'ADMIN' && (
                    <NavLink to="/admin" className="mobile-nav-link admin-nav-link" onClick={closeMenu}>
                      <Shield size={14} style={{ marginRight: '6px' }} />Quan tri
                    </NavLink>
                  )}
                  <div className="mobile-nav-divider" />
                  <button className="mobile-nav-logout" onClick={() => { logout(); closeMenu(); }}>
                    <LogOut size={14} style={{ marginRight: '6px' }} />Dang xuat
                  </button>
                </>
              ) : (
                <button className="mobile-signin-btn" onClick={() => { setAuthOpen(true); closeMenu(); }}>
                  Dang nhap
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
