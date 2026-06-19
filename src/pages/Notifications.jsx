import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRealtime } from '../context/RealtimeContext';
import { apiFetchNotifications } from '../services/api';
import './Operations.css';

const Notifications = () => {
  const [restNotifications, setRestNotifications] = useState([]);
  const [error, setError] = useState('');
  const { realtimeNotifications, clearUnread } = useRealtime();

  useEffect(() => {
    clearUnread();
    apiFetchNotifications()
      .then((data) => setRestNotifications(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(requestError.message));
  }, [clearUnread]);

  const notifications = useMemo(() => {
    const seen = new Set();
    return [...realtimeNotifications, ...restNotifications]
      .filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [realtimeNotifications, restNotifications]);

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header">
        <div>
          <h1>Thong bao</h1>
        </div>
      </header>

      {error ? <div className="feedback feedback-error">{error}</div> : null}

      <section className="surface stack-list">
        {notifications.map((notification) => (
          <article className="notification-row" key={notification.id}>
            <Bell size={17} />
            <div>
              <div className="row-between">
                <strong>{notification.type || 'Thong bao'}</strong>
                <time>{notification.timestamp ? new Date(notification.timestamp).toLocaleString('vi-VN') : ''}</time>
              </div>
              <p>{notification.message}</p>
              {notification.productId ? <Link to={`/products/${notification.productId}`}>Mo san pham</Link> : null}
            </div>
          </article>
        ))}
        {notifications.length === 0 && !error ? <div className="page-state">Chua co thong bao.</div> : null}
      </section>
    </div>
  );
};

export default Notifications;
