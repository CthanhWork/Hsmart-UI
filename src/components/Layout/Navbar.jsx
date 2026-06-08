import { useState } from 'react';
import { Bell, Heart, LogOut, Menu, MessageCircle, Package, Search, Shield, User, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import AuthModal from '../Auth/AuthModal';
import './Navbar.css';

const NavigationLink = ({ to, icon: Icon, children, onClick }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
    {Icon ? <Icon size={15} /> : null}{children}
  </NavLink>
);

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const closeMenu = () => setMenuOpen(false);

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/');
    closeMenu();
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container container">
          <NavLink to="/" className="navbar-logo">H-Smart</NavLink>
          <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            <NavigationLink to="/" icon={Search} onClick={closeMenu}>Marketplace</NavigationLink>
            {isAuthenticated ? <>
              <NavigationLink to="/sell" icon={Package} onClick={closeMenu}>Sell</NavigationLink>
              <NavigationLink to="/listings" onClick={closeMenu}>Listings</NavigationLink>
              <NavigationLink to="/orders" onClick={closeMenu}>Orders</NavigationLink>
              <NavigationLink to="/chat" icon={MessageCircle} onClick={closeMenu}>Chat</NavigationLink>
              {user?.role === 'ADMIN' ? <NavigationLink to="/admin" icon={Shield} onClick={closeMenu}>Admin</NavigationLink> : null}
            </> : null}
          </nav>
          <div className="navbar-right">
            <form className="nav-search" onSubmit={search}>
              <Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
            </form>
            {isAuthenticated ? <>
              <NavLink className="icon-btn" to="/wishlist" title="Wishlist"><Heart size={18} /></NavLink>
              <NavLink className="icon-btn" to="/notifications" title="Notifications"><Bell size={18} /></NavLink>
              <NavLink className="icon-btn" to="/profile" title="Profile"><User size={18} /></NavLink>
              <button className="icon-btn" onClick={logout} title="Sign out"><LogOut size={18} /></button>
            </> : <button className="btn btn-primary sign-in-button" onClick={() => setAuthOpen(true)}>Sign in</button>}
            <button className="icon-btn menu-button" onClick={() => setMenuOpen((current) => !current)} title="Navigation menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
