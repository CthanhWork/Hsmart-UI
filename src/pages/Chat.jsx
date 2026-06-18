import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Package, Search, Send } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiAcceptOffer,
  apiCancelOffer,
  apiCreateOrder,
  apiFetchConversations,
  apiFetchMessages,
  apiFetchOffers,
  apiFetchProductById,
  apiRejectOffer,
} from '../services/api';
import { createChatClient } from '../services/chatClient';
import './Chat.css';

const CONVERSATION_STORAGE_KEY = 'hsmart_chat_conversations';
const OPTIMISTIC_MESSAGE_WINDOW_MS = 15000;

const conversationKey = (participantId, productId) => `${participantId || ''}:${productId || ''}`;

const normalizeMessage = (message) => ({
  ...message,
  senderId: String(message?.senderId || ''),
  receiverId: String(message?.receiverId || ''),
  productId: String(message?.productId || ''),
});

const isLikelySameMessage = (first, second) => {
  const normalizedFirst = normalizeMessage(first);
  const normalizedSecond = normalizeMessage(second);

  if (
    normalizedFirst.senderId !== normalizedSecond.senderId
    || normalizedFirst.receiverId !== normalizedSecond.receiverId
    || normalizedFirst.productId !== normalizedSecond.productId
    || String(normalizedFirst.content || '').trim() !== String(normalizedSecond.content || '').trim()
  ) {
    return false;
  }

  if (normalizedFirst.id && normalizedSecond.id && normalizedFirst.id === normalizedSecond.id) {
    return true;
  }

  const firstTime = new Date(normalizedFirst.timestamp || 0).getTime();
  const secondTime = new Date(normalizedSecond.timestamp || 0).getTime();

  if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) return false;
  return Math.abs(firstTime - secondTime) <= OPTIMISTIC_MESSAGE_WINDOW_MS;
};

const dedupeMessages = (items) => items.reduce((unique, item) => {
  const normalized = normalizeMessage(item);
  if (unique.some((existing) => isLikelySameMessage(existing, normalized))) {
    return unique;
  }
  return [...unique, normalized];
}, []);

const readStoredConversations = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONVERSATION_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveStoredConversations = (items) => {
  localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
};

const formatConversationTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const toast = useToast();
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState(readStoredConversations);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [connected, setConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationFilter, setConversationFilter] = useState('');
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const messageListRef = useRef(null);
  const lastScrolledConversationRef = useRef('');
  const currentUserIdRef = useRef('');
  const activeParticipantIdRef = useRef('');
  const activeProductIdRef = useRef('');

  const currentUserId = String(user?.username || user?.id || '');
  const activeParticipantId = searchParams.get('participantId') || '';
  const activeProductId = searchParams.get('productId') || '';
  const activeKey = conversationKey(activeParticipantId, activeProductId);

  const activeConversation = conversations.find((item) => conversationKey(item.participantId, item.productId) === activeKey);
  const activeOffers = offers.filter((offer) => (
    String(offer.productId) === String(activeProductId)
    && (
      (String(offer.buyerId) === String(activeParticipantId) && String(offer.sellerId) === currentUserId)
      || (String(offer.sellerId) === String(activeParticipantId) && String(offer.buyerId) === currentUserId)
    )
  ));

  const filteredConversations = useMemo(() => {
    const filter = conversationFilter.trim().toLowerCase();
    if (!filter) return conversations;
    return conversations.filter((item) => [
      item.productTitle,
      item.participantId,
      item.productId,
      item.lastMessage,
    ].some((value) => String(value || '').toLowerCase().includes(filter)));
  }, [conversationFilter, conversations]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    activeParticipantIdRef.current = activeParticipantId;
    activeProductIdRef.current = activeProductId;
  }, [activeParticipantId, activeProductId, currentUserId]);

  const upsertConversation = (nextConversation, { promote = true } = {}) => {
    setConversations((current) => {
      const key = conversationKey(nextConversation.participantId, nextConversation.productId);
      const previous = current.find((item) => conversationKey(item.participantId, item.productId) === key);
      const definedConversation = Object.fromEntries(
        Object.entries(nextConversation).filter(([, value]) => value !== undefined),
      );
      const merged = {
        ...previous,
        ...definedConversation,
        updatedAt: nextConversation.updatedAt || previous?.updatedAt || new Date().toISOString(),
      };
      const next = previous && !promote
        ? current.map((item) => conversationKey(item.participantId, item.productId) === key ? merged : item)
        : [merged, ...current.filter((item) => conversationKey(item.participantId, item.productId) !== key)];
      saveStoredConversations(next);
      return next;
    });
  };

  useEffect(() => {
    if (!currentUserId) return undefined;

    const client = createChatClient({
      userId: currentUserId,
      onConnect: () => setConnected(true),
      onMessage: (message) => {
        const nextMessage = normalizeMessage(message);
        const participantId = nextMessage.senderId === currentUserIdRef.current
          ? String(nextMessage.receiverId || activeParticipantIdRef.current)
          : String(nextMessage.senderId || activeParticipantIdRef.current);
        const productId = String(nextMessage.productId || activeProductIdRef.current);

        if (participantId && productId) {
          upsertConversation({
            participantId,
            productId,
            lastMessage: nextMessage.content,
            updatedAt: nextMessage.timestamp || new Date().toISOString(),
          });
        }

        const isActiveProduct = productId === String(activeProductIdRef.current);
        const isActiveParticipant = [nextMessage.senderId, nextMessage.receiverId]
          .some((id) => String(id) === String(activeParticipantIdRef.current));
        if (isActiveProduct && isActiveParticipant) {
          setMessages((current) => dedupeMessages([...current, nextMessage]));
        }
      },
      onError: (requestError) => setError(requestError.message),
    });

    client.activate();
    clientRef.current = client;
    return () => {
      setConnected(false);
      client.deactivate();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;
    const loadConversationSummaries = async () => {
      try {
        const summaries = await apiFetchConversations();
        const normalizedSummaries = Array.isArray(summaries) ? summaries : [];
        const hydratedConversations = await Promise.all(
          normalizedSummaries.map(async (summary) => {
            const product = await apiFetchProductById(summary.productId).catch(() => null);
            return {
              participantId: String(summary.participantId || ''),
              productId: String(summary.productId || ''),
              productTitle: product?.title || `Sáº£n pháº©m #${summary.productId}`,
              productImage: product?.imageUrl,
              lastMessage: summary.lastMessage || '',
              updatedAt: summary.updatedAt || new Date().toISOString(),
            };
          }),
        );

        if (cancelled) return;

        setConversations((current) => {
          const mergedByKey = new Map();
          [...hydratedConversations, ...current].forEach((conversation) => {
            const key = conversationKey(conversation.participantId, conversation.productId);
            if (!key || key === ':') return;
            if (!mergedByKey.has(key)) {
              mergedByKey.set(key, conversation);
            }
          });
          const next = Array.from(mergedByKey.values()).sort(
            (first, second) => new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0),
          );
          saveStoredConversations(next);
          return next;
        });
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      }
    };

    loadConversationSummaries();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;
    apiFetchOffers()
      .then((data) => {
        if (!cancelled) setOffers(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!activeParticipantId || !activeProductId || !currentUserId) {
      return;
    }

    let cancelled = false;
    const loadConversation = async () => {
      setLoadingMessages(true);
      setError('');
      try {
        const [messageData, product] = await Promise.all([
          apiFetchMessages(activeParticipantId, activeProductId),
          apiFetchProductById(activeProductId).catch(() => null),
        ]);

        if (cancelled) return;

        const nextMessages = dedupeMessages(Array.isArray(messageData) ? messageData : []);
        const latestMessage = nextMessages.at(-1);
        setMessages(nextMessages);
        upsertConversation({
          participantId: activeParticipantId,
          productId: activeProductId,
          productTitle: product?.title || `Sản phẩm #${activeProductId}`,
          productImage: product?.imageUrl,
          lastMessage: latestMessage?.content,
          updatedAt: latestMessage?.timestamp,
        }, { promote: false });
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [activeParticipantId, activeProductId, currentUserId]);

  useLayoutEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList || loadingMessages) return;

    const changedConversation = lastScrolledConversationRef.current !== activeKey;
    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: changedConversation ? 'auto' : 'smooth',
    });
    lastScrolledConversationRef.current = activeKey;
  }, [activeKey, loadingMessages, messages]);

  const selectConversation = (conversation) => {
    const nextKey = conversationKey(conversation.participantId, conversation.productId);
    if (nextKey === activeKey) return;

    setLoadingMessages(true);
    setMessages([]);
    setSearchParams({
      participantId: conversation.participantId,
      productId: conversation.productId,
    });
  };

  const showConversationList = () => {
    setMessages([]);
    setSearchParams({});
  };

  const send = (event) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || !clientRef.current?.connected || !activeParticipantId || !activeProductId) return;

    const optimisticMessage = normalizeMessage({
      id: `local-${Date.now()}`,
      senderId: currentUserId,
      receiverId: activeParticipantId,
      productId: activeProductId,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
    });

    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        receiverId: activeParticipantId,
        productId: Number(activeProductId),
        content: trimmedContent,
      }),
    });

    setMessages((current) => dedupeMessages([...current, optimisticMessage]));
    upsertConversation({
      participantId: activeParticipantId,
      productId: activeProductId,
      productTitle: activeConversation?.productTitle || `Sản phẩm #${activeProductId}`,
      productImage: activeConversation?.productImage,
      lastMessage: trimmedContent,
      updatedAt: optimisticMessage.timestamp,
    });
    setContent('');
  };

  const updateOffer = async (offer, action) => {
    try {
      const next = action === 'accept'
        ? await apiAcceptOffer(offer.id)
        : action === 'reject'
          ? await apiRejectOffer(offer.id)
          : await apiCancelOffer(offer.id);
      setOffers((current) => current.map((item) => (item.id === next.id ? next : item)));
      toast.success('Đã cập nhật lời đề nghị.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const checkoutOffer = async (offer) => {
    try {
      const order = await apiCreateOrder(offer.productId, 'VIETTEL_POST', offer.id);
      setOffers((current) => current.map((item) => (
        item.id === offer.id ? { ...item, status: 'ORDERED' } : item
      )));
      toast.success(`Đặt hàng thành công. Mã đơn của bạn là #${order.id}.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="commerce-chat-page">
      <div className="uk-container commerce-chat-container">
        {error ? <div className="chat-error">{error}</div> : null}

        <section className={`commerce-chat-shell ${activeKey !== ':' ? 'has-active-chat' : ''}`}>
          <aside className="conversation-sidebar">
            <div className="conversation-sidebar-header">
              <div>
                <h1>Đoạn chat</h1>
                <span className={`connection-status ${connected ? 'is-online' : ''}`}>
                  <i /> {connected ? 'Đang hoạt động' : 'Đang kết nối'}
                </span>
              </div>
              <span className="conversation-count">{conversations.length}</span>
            </div>
            <label className="conversation-search">
              <Search size={17} aria-hidden="true" />
              <input
                value={conversationFilter}
                onChange={(event) => setConversationFilter(event.target.value)}
                placeholder="Tìm kiếm trên Messenger"
                aria-label="Tìm cuộc trò chuyện"
              />
            </label>

            <div className="conversation-list">
              {filteredConversations.map((conversation) => {
                const key = conversationKey(conversation.participantId, conversation.productId);
                const isActive = key === activeKey;
                return (
                  <button
                    key={key}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => selectConversation(conversation)}
                    type="button"
                  >
                    <span className="conversation-avatar">
                      <img
                        src={conversation.productImage || '/products_hq/coffee_maker.jpg'}
                        alt=""
                      />
                      {connected && isActive ? <i aria-label="Đang hoạt động" /> : null}
                    </span>
                    <span className="conversation-copy">
                      <span className="conversation-name-row">
                        <strong>Người bán {conversation.participantId}</strong>
                        <time>{formatConversationTime(conversation.updatedAt)}</time>
                      </span>
                      <span className="conversation-product">
                        {conversation.productTitle || `Sản phẩm #${conversation.productId}`}
                      </span>
                      <small>{conversation.lastMessage || 'Bắt đầu cuộc trò chuyện'}</small>
                    </span>
                  </button>
                );
              })}
              {filteredConversations.length === 0 ? (
                <div className="conversation-empty">
                  <MessageCircle size={24} />
                  <p>Chưa có cuộc trò chuyện.</p>
                  <small>Mở trang sản phẩm và chọn Nhắn tin để bắt đầu.</small>
                </div>
              ) : null}
            </div>
          </aside>

          <main className="chat-panel">
            {activeConversation || (activeParticipantId && activeProductId) ? (
              <>
                <div className="chat-panel-header">
                  <button
                    className="chat-back-button"
                    type="button"
                    onClick={showConversationList}
                    title="Quay lại danh sách"
                    aria-label="Quay lại danh sách cuộc trò chuyện"
                  >
                    <ArrowLeft size={21} />
                  </button>
                  <div className="chat-product-context">
                    <span className="chat-header-avatar">
                      <img
                        src={activeConversation?.productImage || '/products_hq/coffee_maker.jpg'}
                        alt=""
                      />
                      {connected ? <i aria-label="Đang hoạt động" /> : null}
                    </span>
                    <div>
                      <strong>Người bán {activeParticipantId}</strong>
                      <span>{connected ? 'Đang hoạt động' : 'Đang kết nối...'}</span>
                    </div>
                  </div>
                  <Link to={`/products/${activeProductId}`} className="view-product-link">
                    <Package size={18} />
                    <span>Xem sản phẩm</span>
                  </Link>
                </div>

                <div className="message-list shopee-message-list" ref={messageListRef}>
                  <div className="chat-context-card">
                    <img
                      src={activeConversation?.productImage || '/products_hq/coffee_maker.jpg'}
                      alt={activeConversation?.productTitle || `Sản phẩm #${activeProductId}`}
                    />
                    <strong>{activeConversation?.productTitle || `Sản phẩm #${activeProductId}`}</strong>
                    <span>Cuộc trò chuyện về sản phẩm này</span>
                  </div>
                  {loadingMessages ? <div className="chat-state chat-loading">Đang tải cuộc trò chuyện...</div> : null}
                  {activeOffers.map((offer) => {
                    const isSellerView = String(offer.sellerId) === currentUserId;
                    const isBuyerView = String(offer.buyerId) === currentUserId;
                    return (
                      <article className="chat-offer-card" key={offer.id}>
                        <div>
                          <strong>{isSellerView ? 'Người mua gửi lời đề nghị' : 'Bạn đã gửi lời đề nghị'}</strong>
                          <span>{Number(offer.offerPrice || 0).toLocaleString('vi-VN')} VND · Giảm {offer.discountPercent}%</span>
                          <small>Trạng thái: {offer.status}</small>
                        </div>
                        <div className="chat-offer-actions">
                          {isSellerView && offer.status === 'PENDING' ? (
                            <>
                              <button type="button" onClick={() => updateOffer(offer, 'accept')}>Chấp nhận</button>
                              <button type="button" onClick={() => updateOffer(offer, 'reject')}>Từ chối</button>
                            </>
                          ) : null}
                          {isBuyerView && offer.status === 'PENDING' ? (
                            <button type="button" onClick={() => updateOffer(offer, 'cancel')}>Hủy đề nghị</button>
                          ) : null}
                          {isBuyerView && offer.status === 'ACCEPTED' ? (
                            <button type="button" onClick={() => checkoutOffer(offer)}>Mua giá ưu đãi</button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {!loadingMessages && messages.map((message) => {
                    const isMine = String(message.senderId) === currentUserId;
                    return (
                      <article key={message.id} className={isMine ? 'message-row mine' : 'message-row'}>
                        {!isMine ? (
                          <span className="message-avatar" aria-hidden="true">
                            {String(activeParticipantId).charAt(0).toUpperCase()}
                          </span>
                        ) : null}
                        <div className="message-content">
                          <div className="market-message">
                            <p>{message.content}</p>
                          </div>
                          <time>{formatMessageTime(message.timestamp)}</time>
                        </div>
                      </article>
                    );
                  })}
                  {!loadingMessages && messages.length === 0 ? (
                    <div className="chat-state">
                      <MessageCircle size={28} />
                      <p>Chưa có tin nhắn.</p>
                      <small>Gửi tin nhắn đầu tiên về sản phẩm này.</small>
                    </div>
                  ) : null}
                </div>

                <form className="chat-composer" onSubmit={send}>
                  <div className="chat-composer-input">
                    <input
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder={connected ? 'Aa' : 'Đang kết nối chat...'}
                      disabled={!connected}
                      aria-label="Nội dung tin nhắn"
                    />
                  </div>
                  <button disabled={!connected || !content.trim()} title="Gửi tin nhắn" aria-label="Gửi tin nhắn">
                    <Send size={17} />
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-start-state">
                <span className="chat-start-icon"><MessageCircle size={34} /></span>
                <h2>Tin nhắn của bạn</h2>
                <p>Chọn một cuộc trò chuyện để tiếp tục trao đổi với người bán.</p>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
};

export default Chat;
