import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Paperclip, Search, Send, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import {
  apiAcceptOffer,
  apiCancelOffer,
  apiFetchConversations,
  apiFetchMessages,
  apiFetchOffers,
  apiFetchProductById,
  apiRejectOffer,
  apiUploadChatMedia,
  resolveMediaUrl,
} from '../services/api';
import { startDepositCheckout } from '../services/payment';
import { useRealtime } from '../context/RealtimeContext';
import './Chat.css';

const CONVERSATION_STORAGE_KEY = 'hsmart_chat_conversations';
const OPTIMISTIC_MESSAGE_WINDOW_MS = 15000;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;

const PRODUCT_STATUS_LABELS = {
  APPROVED: 'Còn hàng',
  PENDING_APPROVAL: 'Chờ duyệt',
  SOLD: 'Đã bán',
  REJECTED: 'Bị từ chối',
  HIDDEN: 'Đã ẩn',
};

const OFFER_STATUS_LABELS = {
  PENDING: 'Đang chờ phản hồi',
  ACCEPTED: 'Đã được chấp nhận',
  REJECTED: 'Đã bị từ chối',
  CANCELLED: 'Đã hủy',
  ORDERED: 'Đã đặt hàng',
};

const conversationKey = (participantId, productId) => `${participantId || ''}:${productId || ''}`;

const isImageFile = (mimeType = '') => IMAGE_MIME_TYPES.includes(String(mimeType).toLowerCase());
const isVideoFile = (mimeType = '') => VIDEO_MIME_TYPES.includes(String(mimeType).toLowerCase());

const normalizeMessage = (message) => ({
  ...message,
  messageType: String(message?.messageType || (message?.mediaUrl ? 'IMAGE' : 'TEXT')).toUpperCase(),
  senderId: String(message?.senderId || ''),
  receiverId: String(message?.receiverId || ''),
  productId: String(message?.productId || ''),
  mediaUrl: resolveMediaUrl(message?.mediaUrl || ''),
  mediaMimeType: String(message?.mediaMimeType || ''),
  mediaSizeBytes: Number(message?.mediaSizeBytes || 0),
  mediaOriginalFilename: String(message?.mediaOriginalFilename || ''),
});

const getMessagePreview = (message) => {
  const normalized = normalizeMessage(message);
  const caption = String(normalized.content || '').trim();

  if (normalized.messageType === 'IMAGE') {
    return caption ? `📷 ${caption}` : '📷 Ảnh';
  }

  if (normalized.messageType === 'VIDEO') {
    return caption ? `🎬 ${caption}` : '🎬 Video';
  }

  return caption || 'Tin nhắn mới';
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

const formatFileSize = (sizeBytes = 0) => {
  if (!sizeBytes) return '';
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isLikelySameMessage = (first, second) => {
  const normalizedFirst = normalizeMessage(first);
  const normalizedSecond = normalizeMessage(second);

  if (
    normalizedFirst.senderId !== normalizedSecond.senderId
    || normalizedFirst.receiverId !== normalizedSecond.receiverId
    || normalizedFirst.productId !== normalizedSecond.productId
    || String(normalizedFirst.content || '').trim() !== String(normalizedSecond.content || '').trim()
    || normalizedFirst.messageType !== normalizedSecond.messageType
    || String(normalizedFirst.mediaUrl || '') !== String(normalizedSecond.mediaUrl || '')
    || String(normalizedFirst.mediaOriginalFilename || '') !== String(normalizedSecond.mediaOriginalFilename || '')
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

const Chat = () => {
  const toast = useToast();
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState(readStoredConversations);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [sendingMedia, setSendingMedia] = useState(false);
  const { connected, publishMessage, setMessageHandler } = useRealtime();
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationFilter, setConversationFilter] = useState('');
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const messageListRef = useRef(null);
  const fileInputRef = useRef(null);
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
    setMessageHandler((message) => {
      const nextMessage = normalizeMessage(message);
      const participantId = nextMessage.senderId === currentUserIdRef.current
        ? String(nextMessage.receiverId || activeParticipantIdRef.current)
        : String(nextMessage.senderId || activeParticipantIdRef.current);
      const productId = String(nextMessage.productId || activeProductIdRef.current);

      if (participantId && productId) {
        upsertConversation({
          participantId,
          productId,
          lastMessage: getMessagePreview(nextMessage),
          updatedAt: nextMessage.timestamp || new Date().toISOString(),
        });
      }

      const isActiveProduct = productId === String(activeProductIdRef.current);
      const isActiveParticipant = [nextMessage.senderId, nextMessage.receiverId]
        .some((id) => String(id) === String(activeParticipantIdRef.current));
      if (isActiveProduct && isActiveParticipant) {
        setMessages((current) => dedupeMessages([...current, nextMessage]));
      }
    });

    return () => setMessageHandler(null);
  }, [setMessageHandler]);

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
              productTitle: product?.title || `Sản phẩm #${summary.productId}`,
              productImage: product?.imageUrl,
              productPrice: product?.price,
              productStatus: product?.status,
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
          productPrice: product?.price,
          productStatus: product?.status,
          lastMessage: latestMessage ? getMessagePreview(latestMessage) : undefined,
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

  useEffect(() => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeKey]);

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

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateSelectedFile = (file) => {
    if (!file) return 'Vui lòng chọn một tệp hợp lệ.';

    const mimeType = String(file.type || '').toLowerCase();

    if (isImageFile(mimeType)) {
      return file.size > MAX_IMAGE_SIZE_BYTES ? 'Ảnh phải nhỏ hơn hoặc bằng 5MB.' : '';
    }

    if (isVideoFile(mimeType)) {
      return file.size > MAX_VIDEO_SIZE_BYTES ? 'Video phải nhỏ hơn hoặc bằng 20MB.' : '';
    }

    return 'Chỉ hỗ trợ JPG, PNG, WEBP, MP4 hoặc WEBM.';
  };

  const onPickFile = (event) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) return;

    const nextError = validateSelectedFile(nextFile);
    if (nextError) {
      setSelectedFile(null);
      setFileError(nextError);
      toast.error(nextError);
      event.target.value = '';
      return;
    }

    setSelectedFile(nextFile);
    setFileError('');
  };

  const send = async (event) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!activeParticipantId || !activeProductId || sendingMedia) return;

    if (selectedFile) {
      setSendingMedia(true);
      setError('');
      try {
        const savedMessage = normalizeMessage(await apiUploadChatMedia({
          receiverId: activeParticipantId,
          productId: activeProductId,
          content: trimmedContent,
          file: selectedFile,
        }));

        setMessages((current) => dedupeMessages([...current, savedMessage]));
        upsertConversation({
          participantId: activeParticipantId,
          productId: activeProductId,
          productTitle: activeConversation?.productTitle || `Sản phẩm #${activeProductId}`,
          productImage: activeConversation?.productImage,
          lastMessage: getMessagePreview(savedMessage),
          updatedAt: savedMessage.timestamp || new Date().toISOString(),
        });
        setContent('');
        clearSelectedFile();
        toast.success(savedMessage.messageType === 'VIDEO' ? 'Đã gửi video.' : 'Đã gửi ảnh.');
      } catch (requestError) {
        setError(requestError.message);
        toast.error(requestError.message || 'Không gửi được tệp đính kèm.');
      } finally {
        setSendingMedia(false);
      }
      return;
    }

    if (!trimmedContent || !connected) return;

    const optimisticMessage = normalizeMessage({
      id: `local-${Date.now()}`,
      senderId: currentUserId,
      receiverId: activeParticipantId,
      productId: activeProductId,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
    });

    publishMessage('/app/chat.send', {
      receiverId: activeParticipantId,
      productId: Number(activeProductId),
      content: trimmedContent,
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
      // Đơn từ offer cũng phải trả cọc qua VNPay trước khi được tạo.
      await startDepositCheckout(offer.productId, 'VIETTEL_POST', offer.id);
      // Trình duyệt sẽ rời trang sang cổng VNPay.
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const canSend = Boolean(
    activeParticipantId
    && activeProductId
    && !sendingMedia
    && (selectedFile || (connected && content.trim()))
  );

  return (
    <div className="hsmart-chat-page">
      <div className="hsmart-chat-wrap">
        {error ? <div className="chat-error">{error}</div> : null}

        <section className={`hsmart-chat-shell ${activeKey !== ':' ? 'has-active-chat' : ''}`}>
          <aside className="chat-aside">
            <div className="chat-aside-head">
              <div className="chat-aside-title">
                <h1>Tin nhắn</h1>
                <span className={`chat-presence ${connected ? 'online' : ''}`}>
                  <i /> {connected ? 'Đang hoạt động' : 'Đang kết nối'}
                </span>
              </div>
              <span className="chat-conv-count">{conversations.length}</span>
            </div>

            <label className="chat-aside-search">
              <Search size={16} aria-hidden="true" />
              <input
                value={conversationFilter}
                onChange={(event) => setConversationFilter(event.target.value)}
                placeholder="Tìm cuộc trò chuyện"
                aria-label="Tìm cuộc trò chuyện"
              />
            </label>

            <div className="chat-thread-list">
              {filteredConversations.map((conversation) => {
                const key = conversationKey(conversation.participantId, conversation.productId);
                const isActive = key === activeKey;
                return (
                  <button
                    key={key}
                    className={`chat-thread ${isActive ? 'active' : ''}`}
                    onClick={() => selectConversation(conversation)}
                    type="button"
                  >
                    <span className="chat-thread-avatar">
                      <img
                        src={conversation.productImage || '/products_hq/coffee_maker.jpg'}
                        alt=""
                      />
                      {connected && isActive ? <i aria-label="Đang hoạt động" /> : null}
                    </span>
                    <span className="chat-thread-body">
                      <span className="chat-thread-top">
                        <strong>Người bán {conversation.participantId}</strong>
                        <time>{formatConversationTime(conversation.updatedAt)}</time>
                      </span>
                      <span className="chat-thread-product">
                        {conversation.productTitle || `Sản phẩm #${conversation.productId}`}
                      </span>
                      <small>{conversation.lastMessage || 'Bắt đầu cuộc trò chuyện'}</small>
                    </span>
                  </button>
                );
              })}
              {filteredConversations.length === 0 ? (
                <div className="chat-thread-empty">
                  <MessageCircle size={26} />
                  <p>Chưa có cuộc trò chuyện</p>
                  <small>Mở trang sản phẩm và chọn “Nhắn tin” để bắt đầu.</small>
                </div>
              ) : null}
            </div>
          </aside>

          <main className="chat-room">
            {activeConversation || (activeParticipantId && activeProductId) ? (
              <>
                <div className="chat-room-head">
                  <button
                    className="chat-back-btn"
                    type="button"
                    onClick={showConversationList}
                    title="Quay lại danh sách"
                    aria-label="Quay lại danh sách cuộc trò chuyện"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <span className="chat-room-avatar">
                    <img
                      src={activeConversation?.productImage || '/products_hq/coffee_maker.jpg'}
                      alt=""
                    />
                    {connected ? <i aria-label="Đang hoạt động" /> : null}
                  </span>
                  <div className="chat-room-peer">
                    <strong>Người bán {activeParticipantId}</strong>
                    <span>{connected ? 'Đang hoạt động' : 'Đang kết nối…'}</span>
                  </div>
                </div>

                {activeProductId ? (
                  <div className="chat-product-bar">
                    <img
                      src={activeConversation?.productImage || '/products_hq/coffee_maker.jpg'}
                      alt={activeConversation?.productTitle || `Sản phẩm #${activeProductId}`}
                    />
                    <div className="chat-product-bar-info">
                      <span className="chat-product-bar-title">
                        {activeConversation?.productTitle || `Sản phẩm #${activeProductId}`}
                      </span>
                      <span className="chat-product-bar-meta">
                        {activeConversation?.productPrice ? (
                          <b>{Number(activeConversation.productPrice).toLocaleString('vi-VN')}đ</b>
                        ) : null}
                        {activeConversation?.productStatus ? (
                          <em className={`product-status-badge status-${activeConversation.productStatus.toLowerCase()}`}>
                            {PRODUCT_STATUS_LABELS[activeConversation.productStatus] || activeConversation.productStatus}
                          </em>
                        ) : null}
                      </span>
                    </div>
                    <Link to={`/products/${activeProductId}`} className="chat-product-bar-link">
                      Xem sản phẩm
                    </Link>
                  </div>
                ) : null}

                <div className="chat-messages" ref={messageListRef}>
                  {loadingMessages ? <div className="chat-state chat-loading">Đang tải cuộc trò chuyện…</div> : null}
                  {activeOffers.map((offer) => {
                    const isSellerView = String(offer.sellerId) === currentUserId;
                    const isBuyerView = String(offer.buyerId) === currentUserId;
                    return (
                      <article className="chat-offer-card" key={offer.id}>
                        <div className="chat-offer-info">
                          <strong>{isSellerView ? 'Người mua gửi lời đề nghị' : 'Bạn đã gửi lời đề nghị'}</strong>
                          <span>{Number(offer.offerPrice || 0).toLocaleString('vi-VN')}đ · Giảm {offer.discountPercent}%</span>
                          <small>{OFFER_STATUS_LABELS[offer.status] || offer.status}</small>
                        </div>
                        <div className="chat-offer-actions">
                          {isSellerView && offer.status === 'PENDING' ? (
                            <>
                              <button type="button" className="offer-btn primary" onClick={() => updateOffer(offer, 'accept')}>Chấp nhận</button>
                              <button type="button" className="offer-btn" onClick={() => updateOffer(offer, 'reject')}>Từ chối</button>
                            </>
                          ) : null}
                          {isBuyerView && offer.status === 'PENDING' ? (
                            <button type="button" className="offer-btn" onClick={() => updateOffer(offer, 'cancel')}>Hủy đề nghị</button>
                          ) : null}
                          {isBuyerView && offer.status === 'ACCEPTED' ? (
                            <button type="button" className="offer-btn primary" onClick={() => checkoutOffer(offer)}>Mua giá ưu đãi</button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {!loadingMessages && messages.map((message) => {
                    const isMine = String(message.senderId) === currentUserId;
                    const mimeType = String(message.mediaMimeType || '').toLowerCase();
                    const isImageMessage = message.messageType === 'IMAGE' || isImageFile(mimeType);
                    const isVideoMessage = message.messageType === 'VIDEO' || isVideoFile(mimeType);
                    const hasMedia = Boolean(message.mediaUrl);

                    return (
                      <article key={message.id} className={isMine ? 'message-row mine' : 'message-row'}>
                        {!isMine ? (
                          <span className="message-avatar" aria-hidden="true">
                            {String(activeParticipantId).charAt(0).toUpperCase()}
                          </span>
                        ) : null}
                        <div className="message-content">
                          <div className={`message-bubble ${hasMedia ? 'has-media' : ''}`}>
                            {hasMedia && isImageMessage ? (
                              <img
                                className="message-media"
                                src={message.mediaUrl}
                                alt={message.mediaOriginalFilename || 'Ảnh đính kèm'}
                                loading="lazy"
                              />
                            ) : null}
                            {hasMedia && isVideoMessage ? (
                              <video
                                className="message-media"
                                controls
                                preload="metadata"
                                src={message.mediaUrl}
                              >
                                Trình duyệt không hỗ trợ phát video.
                              </video>
                            ) : null}
                            {hasMedia && !isImageMessage && !isVideoMessage ? (
                              <a
                                className="message-media-link"
                                href={message.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Mở tệp đính kèm
                              </a>
                            ) : null}
                            {message.content ? (
                              <p className={hasMedia ? 'message-caption' : ''}>{message.content}</p>
                            ) : null}
                            {hasMedia && (message.mediaOriginalFilename || message.mediaSizeBytes) ? (
                              <span className="message-media-meta">
                                {message.mediaOriginalFilename || 'Tệp đính kèm'}
                                {message.mediaSizeBytes ? ` · ${formatFileSize(message.mediaSizeBytes)}` : ''}
                              </span>
                            ) : null}
                            {!hasMedia && !message.content ? (
                              <p>[Tin nhắn trống]</p>
                            ) : null}
                          </div>
                          <time>{formatMessageTime(message.timestamp)}</time>
                        </div>
                      </article>
                    );
                  })}
                  {!loadingMessages && messages.length === 0 ? (
                    <div className="chat-state">
                      <MessageCircle size={28} />
                      <p>Chưa có tin nhắn</p>
                      <small>Gửi tin nhắn đầu tiên về sản phẩm này.</small>
                    </div>
                  ) : null}
                </div>

                <form className="chat-composer" onSubmit={send}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="chat-file-input"
                    accept={[...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES].join(',')}
                    onChange={onPickFile}
                    hidden
                  />
                  <button
                    type="button"
                    className="chat-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!activeParticipantId || !activeProductId || sendingMedia}
                    title="Đính kèm ảnh hoặc video"
                    aria-label="Đính kèm ảnh hoặc video"
                  >
                    <Paperclip size={18} />
                  </button>
                  <div className="chat-composer-main">
                    {selectedFile ? (
                      <div className="chat-selected-file">
                        <div className="chat-selected-file-copy">
                          <strong>{selectedFile.name}</strong>
                          <span>{formatFileSize(selectedFile.size)} · {isImageFile(selectedFile.type) ? 'Ảnh' : 'Video'}</span>
                        </div>
                        <button
                          type="button"
                          className="chat-selected-file-remove"
                          onClick={clearSelectedFile}
                          aria-label="Bỏ tệp đính kèm"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : null}
                    {fileError ? <p className="chat-file-error">{fileError}</p> : null}
                    <div className="chat-composer-input">
                      <input
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={selectedFile ? 'Thêm chú thích cho ảnh hoặc video…' : connected ? 'Nhập tin nhắn…' : 'Nhập chú thích hoặc chờ kết nối lại…'}
                        aria-label="Nội dung tin nhắn"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!canSend}
                    title={selectedFile ? 'Gửi tệp đính kèm' : 'Gửi tin nhắn'}
                    aria-label={selectedFile ? 'Gửi tệp đính kèm' : 'Gửi tin nhắn'}
                  >
                    {sendingMedia ? <Loader2 size={18} className="is-spinning" /> : <Send size={18} />}
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-blank">
                <span className="chat-blank-icon"><MessageCircle size={34} /></span>
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
