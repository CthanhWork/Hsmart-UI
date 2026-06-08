import { Client } from '@stomp/stompjs';
import { getWebSocketUrl } from './api';

export const createChatClient = ({
  userId,
  onMessage,
  onNotification,
  onConnect,
  onError,
}) => {
  const client = new Client({
    brokerURL: getWebSocketUrl(),
    connectHeaders: { 'X-User-Id': userId },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe('/user/queue/messages', (frame) => {
        onMessage?.(JSON.parse(frame.body));
      });
      client.subscribe('/user/queue/notifications', (frame) => {
        onNotification?.(JSON.parse(frame.body));
      });
      onConnect?.();
    },
    onStompError: (frame) => onError?.(new Error(frame.headers.message || 'Chat connection failed')),
    onWebSocketError: () => onError?.(new Error('Chat connection failed')),
  });

  return client;
};
