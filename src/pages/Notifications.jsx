import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRealtime } from '../context/RealtimeContext';
import {
  apiFetchNotificationsPage,
  apiMarkNotificationRead,
} from '../services/api';
import './Operations.css';

const PAGE_SIZE = 20;

const formatTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '');

const Notifications = () => {
  const { realtimeNotifications, clearUnread, decrementUnread } = useRealtime();
  const [items, setItems] = useState([]);
  const [pageMeta, setPageMeta] = useState({ pageNo: 0, last: true });
  const [filter, setFilter] = useState('all');
  const [localRead, setLocalRead] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (nextPage = 0, replace = true) => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetchNotificationsPage({
        read: filter === 'unread' ? false : undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });
      setPageMeta(result);
      setItems((prev) => (replace ? result.content : [...prev, ...result.content]));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(0, true);
  }, [load]);

  const isRead = useCallback(
    (notification) => Boolean(notification.read) || localRead.has(notification.id),
    [localRead],
  );

  const notifications = useMemo(() => {
    const seen = new Set();
    const merged = [];
    [...realtimeNotifications, ...items].forEach((notification) => {
      if (notification?.id == null || seen.has(notification.id)) return;
      seen.add(notification.id);
      merged.push(notification);
    });
    const visible = filter === 'unread' ? merged.filter((n) => !isRead(n)) : merged;
    return visible.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [realtimeNotifications, items, filter, isRead]);

  const markOne = (notification) => {
    if (isRead(notification)) return;
    setLocalRead((prev) => new Set(prev).add(notification.id));
    decrementUnread(1);
    apiMarkNotificationRead(notification.id).catch(() => {});
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      clearUnread();
      setLocalRead((prev) => {
        const next = new Set(prev);
        notifications.forEach((notification) => next.add(notification.id));
        return next;
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((notification) => !isRead(notification));

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header notifications-header">
        <div>
          <h1>Thông báo</h1>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={markAll}
          disabled={markingAll || !hasUnread}
        >
          <CheckCheck size={16} aria-hidden="true" />
          Đánh dấu tất cả đã đọc
        </button>
      </header>

      <div className="notifications-tabs" role="tablist" aria-label="Lọc thông báo">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={filter === tab.key}
            className={filter === tab.key ? 'active' : ''}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <div className="feedback feedback-error">{error}</div> : null}

      <section className="surface stack-list">
        {notifications.map((notification) => {
          const read = isRead(notification);
          return (
            <article
              className={`notification-row ${read ? '' : 'is-unread'}`}
              key={notification.id}
              onClick={() => markOne(notification)}
            >
              <span className="notification-icon">
                <Bell size={17} />
                {!read ? <span className="notification-dot" aria-hidden="true" /> : null}
              </span>
              <div>
                <div className="row-between">
                  <strong>{notification.title || notification.type || 'Thông báo'}</strong>
                  <time>{formatTime(notification.timestamp)}</time>
                </div>
                <p>{notification.message}</p>
                {notification.productId ? (
                  <Link to={`/products/${notification.productId}`} onClick={() => markOne(notification)}>
                    Mở sản phẩm
                  </Link>
                ) : null}
                {notification.orderId ? (
                  <Link to={`/orders?orderId=${notification.orderId}`} onClick={() => markOne(notification)}>
                    Xem đơn hàng
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}

        {!loading && notifications.length === 0 && !error ? (
          <div className="page-state">Chưa có thông báo.</div>
        ) : null}

        {loading ? <div className="page-state">Đang tải thông báo…</div> : null}
      </section>

      {!pageMeta.last ? (
        <div className="notifications-more">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => load((pageMeta.pageNo || 0) + 1, false)}
          >
            Tải thêm
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Notifications;
