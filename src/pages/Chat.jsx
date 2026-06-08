import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { apiFetchMessages } from '../services/api';
import { createChatClient } from '../services/chatClient';
import './Operations.css';

const Chat = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [participantId, setParticipantId] = useState(searchParams.get('participantId') || '');
  const [productId, setProductId] = useState(searchParams.get('productId') || '');
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const currentUserId = String(user?.username || user?.id || '');

  useEffect(() => {
    const routeParticipant = searchParams.get('participantId');
    const routeProduct = searchParams.get('productId');
    if (!routeParticipant || !routeProduct || !currentUserId) return undefined;

    apiFetchMessages(routeParticipant, routeProduct)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(requestError.message));

    const client = createChatClient({
      userId: currentUserId,
      onConnect: () => setConnected(true),
      onMessage: (message) => {
        if (String(message.productId) === String(routeProduct)) {
          setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
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
  }, [currentUserId, searchParams]);

  const openConversation = (event) => {
    event.preventDefault();
    setMessages([]);
    setSearchParams({ participantId, productId });
  };

  const send = (event) => {
    event.preventDefault();
    if (!content.trim() || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ receiverId: participantId, productId: Number(productId), content: content.trim() }),
    });
    setContent('');
  };

  return (
    <div className="operations-page container">
      <header className="operations-header"><div><p className="eyebrow">Messages</p><h1>Product chat</h1><p>Open a conversation using its seller and product identifiers.</p></div></header>
      <form className="conversation-picker" onSubmit={openConversation}>
        <label>Participant ID<input required value={participantId} onChange={(event) => setParticipantId(event.target.value)} /></label>
        <label>Product ID<input required type="number" value={productId} onChange={(event) => setProductId(event.target.value)} /></label>
        <button className="btn btn-secondary">Open conversation</button>
      </form>
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      <section className="chat-shell">
        <div className="chat-status"><span className={connected ? 'online-dot' : 'offline-dot'} />{connected ? 'Connected' : 'Disconnected'}
          {productId ? <Link to={`/products/${productId}`}>Product #{productId}</Link> : null}
        </div>
        <div className="message-list">
          {messages.map((message) => (
            <article key={message.id} className={String(message.senderId) === currentUserId ? 'message mine' : 'message'}>
              <strong>{message.senderId}</strong><p>{message.content}</p>
              <time>{message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}</time>
            </article>
          ))}
          {messages.length === 0 ? <div className="page-state">No messages in this conversation.</div> : null}
        </div>
        <form className="message-composer" onSubmit={send}>
          <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a message" disabled={!connected} />
          <button className="btn btn-primary" disabled={!connected || !content.trim()} title="Send message"><Send size={17} /></button>
        </form>
      </section>
    </div>
  );
};

export default Chat;
