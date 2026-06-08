import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetchNotifications } from '../services/api';
import './Operations.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetchNotifications().then((data) => setNotifications(Array.isArray(data) ? data : [])).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header"><div><p className="eyebrow">Activity</p><h1>Notifications</h1><p>Order, product, and conversation updates from interaction-service.</p></div></header>
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      <section className="surface stack-list">
        {notifications.map((notification) => (
          <article className="notification-row" key={notification.id}>
            <Bell size={17} />
            <div><div className="row-between"><strong>{notification.type || 'Notification'}</strong><time>{notification.timestamp ? new Date(notification.timestamp).toLocaleString() : ''}</time></div>
              <p>{notification.message}</p>
              {notification.productId ? <Link to={`/products/${notification.productId}`}>Open product</Link> : null}
            </div>
          </article>
        ))}
        {notifications.length === 0 && !error ? <div className="page-state">No notifications yet.</div> : null}
      </section>
    </div>
  );
};

export default Notifications;
