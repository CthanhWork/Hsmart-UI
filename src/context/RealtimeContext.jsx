import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createChatClient } from '../services/chatClient';
import { apiFetchNotificationUnreadCount, apiMarkAllNotificationsRead } from '../services/api';
import { useUser } from './UserContext';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user } = useUser();
  const [connected, setConnected] = useState(false);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const clientRef = useRef(null);
  const messageHandlerRef = useRef(null);

  const currentUserId = String(user?.username || user?.id || '');

  // Khởi tạo số chưa đọc từ server (realtime chỉ cộng dồn sự kiện mới).
  useEffect(() => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }
    apiFetchNotificationUnreadCount()
      .then((count) => setUnreadCount(Number(count) || 0))
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const client = createChatClient({
      userId: currentUserId,
      onConnect: () => setConnected(true),
      onMessage: (message) => {
        messageHandlerRef.current?.(message);
      },
      onNotification: (notification) => {
        setRealtimeNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      },
      onError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);
      client.deactivate();
      clientRef.current = null;
    };
  }, [currentUserId]);

  const publishMessage = useCallback((destination, body) => {
    clientRef.current?.publish({ destination, body: JSON.stringify(body) });
  }, []);

  const setMessageHandler = useCallback((handler) => {
    messageHandlerRef.current = handler;
  }, []);

  // Đánh dấu tất cả đã đọc cả ở local lẫn server.
  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    apiMarkAllNotificationsRead().catch(() => {});
  }, []);

  const decrementUnread = useCallback((by = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  return (
    <RealtimeContext.Provider value={{
      connected,
      unreadCount,
      realtimeNotifications,
      publishMessage,
      setMessageHandler,
      clearUnread,
      decrementUnread,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
