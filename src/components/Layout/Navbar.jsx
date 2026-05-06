import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, User, Bell, LogOut } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import AuthModal from '../Auth/AuthModal';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useUser();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container container">
          <div className="navbar-left">
            <NavLink to="/" className="navbar-logo">
              H-smart
            </NavLink>
            
            <div className="navbar-links">
              <NavLink to="/marketplace" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Appliances</NavLink>
              <NavLink to="/sell" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Sell</NavLink>
              <NavLink to="/myhub" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>My Hub</NavLink>
            </div>
          </div>

          <div className="navbar-right">
            <div className="search-container">
              <Search size={16} className="search-icon" color="#999" />
              <input type="text" placeholder="Search smart appliances..." className="search-input" />
            </div>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="icon-btn user-btn" title={user?.username || 'Profile'}>
                  <User size={20} />
                </button>
                <button className="icon-btn" onClick={logout} title="Đăng xuất">
                  <LogOut size={18} color="var(--text-muted)" />
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsAuthOpen(true)}>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </nav>
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default Navbar;
