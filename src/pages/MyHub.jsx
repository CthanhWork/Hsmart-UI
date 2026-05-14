import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, User, Package } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { apiFetchProducts, apiFetchNotifications } from '../services/api';
import './MyHub.css';

const MyHub = () => {
  const { user, isAuthenticated } = useUser();
  const [myListings, setMyListings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      // In a real scenario, this would filter by the logged-in user's ID
      // or we use a dedicated /my-products endpoint if backend has it.
      apiFetchProducts().then(data => {
        // Just mock filtering for the UI if backend doesn't support ?sellerId=
        // Using all products for now if they exist
        setMyListings(data || []);
      }).catch(console.error);

      apiFetchNotifications().then(data => {
        setNotifications(data || []);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="myhub-page container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Vui lòng đăng nhập để xem Hub của bạn</h2>
      </div>
    );
  }

  return (
    <div className="myhub-page container">
      <div className="page-header">
        <h1 className="page-title">My Hub</h1>
        <p className="page-desc">Managing your intelligent appliance ecosystem.</p>
      </div>

      <div className="hub-grid">
        <div className="hub-column-left">
          {/* User Profile Summary */}
          <div className="hub-card verification-card">
            <h3 className="card-title text-success tracking-wide uppercase text-xs font-bold mb-4">PROFILE</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} color="var(--primary)" />
              </div>
              <div>
                <h4 className="text-xl font-bold">{user?.username || 'User'}</h4>
                <p className="text-muted text-sm">{user?.email || 'No email provided'}</p>
              </div>
            </div>
            <p className="status-text mt-2"><ShieldCheckIcon /> Verified Seller Account</p>
          </div>

          {/* Notifications */}
          <div className="hub-card purchase-card mt-4">
            <h3 className="card-title text-xl font-bold mb-6 flex-between">
              Notifications
              <Bell size={16} className="text-muted" />
            </h3>
            
            {notifications.length === 0 ? (
              <p className="text-sm text-muted">No new notifications.</p>
            ) : (
              <div className="history-item">
                {notifications.map((notif, idx) => (
                   <div key={idx} style={{ marginBottom: '16px' }}>
                     <div className="flex-between">
                       <h4 className="font-bold text-sm">{notif.type || 'System'}</h4>
                       <span className="text-xs text-muted">Just now</span>
                     </div>
                     <p className="text-xs text-muted mt-1">{notif.message}</p>
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hub-column-right">
          {/* Active Listings */}
          <div className="hub-card active-listings-card">
            <div className="flex-between mb-6">
              <div>
                <h3 className="card-title text-xl font-bold">My Listings</h3>
                <p className="text-xs text-muted mt-1">Products you are selling</p>
              </div>
              <Package size={20} className="text-muted" />
            </div>
            
            <div className="listings-list">
              {myListings.length === 0 ? (
                <p className="text-sm text-muted">You haven't listed any items yet.</p>
              ) : (
                myListings.map(item => (
                  <div key={item.id} className="listing-item">
                    <img src={item.imageUrl || 'https://placehold.co/100x100/f0f0f0/666'} alt={item.title} className="listing-img" />
                    <div className="listing-details">
                      <h4 className="text-sm font-bold">{item.title}</h4>
                      <span className="badge badge-success mt-2">• {item.status || 'ACTIVE'}</span>
                    </div>
                    <div className="listing-price font-bold text-sm">${item.price}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShieldCheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

export default MyHub;
