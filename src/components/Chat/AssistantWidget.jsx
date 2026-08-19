import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, Trash2 } from 'lucide-react';
import {
  apiChatAssistant,
  apiDeleteAssistantHistory,
  apiGetAssistantHistory,
  apiStreamAssistant,
} from '../../services/api';
import { useUser } from '../../context/UserContext';
import './AssistantWidget.css';

const WELCOME_MESSAGE = {
  id: 'welcome',
  text: 'Xin chào! Tôi là trợ lý AI của H-Smart. Tôi có thể giúp bạn định giá đồ gia dụng, hướng dẫn đăng bán hoặc gợi ý sản phẩm phù hợp.',
  isBot: true,
};

const QUICK_PROMPTS = [
  'Định giá đồ gia dụng cũ',
  'Cách đăng bán sản phẩm',
  'Gợi ý sản phẩm đáng mua',
];

const historyToMessages = (historyItems) => {
  if (!Array.isArray(historyItems) || historyItems.length === 0) return [WELCOME_MESSAGE];
  return historyItems.map((item) => ({
    id: item.id || item.timestamp || Math.random(),
    text: item.content || '',
    isBot: String(item.senderId || '') === 'h-smart-assistant',
  }));
};

const AssistantWidget = () => {
  const { isAuthenticated } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;
    try {
      const history = await apiGetAssistantHistory(30);
      setMessages(historyToMessages(history));
    } catch {
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [historyLoaded]);

  useEffect(() => {
    if (isOpen && isAuthenticated) loadHistory();
  }, [isOpen, isAuthenticated, loadHistory]);

  const upsertBot = (botId, text, extra = {}) => {
    setMessages((prev) => {
      const bot = { id: botId, text, isBot: true, ...extra };
      return prev.some((message) => message.id === botId)
        ? prev.map((message) => (message.id === botId ? bot : message))
        : [...prev, bot];
    });
  };

  const sendMessage = async (rawText) => {
    const userMsg = rawText.trim();
    if (!userMsg || isLoading) return;

    setInputValue('');
    const botId = `bot-${Date.now()}`;
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, text: userMsg, isBot: false }]);
    setIsLoading(true);

    let streamed = false;
    try {
      // Ưu tiên SSE để hiển thị câu trả lời theo từng token.
      await apiStreamAssistant(userMsg, {
        onChunk: (full) => {
          streamed = true;
          upsertBot(botId, full);
        },
      });
      if (!streamed) throw new Error('empty-stream');
    } catch {
      // Fallback sang chat thường nếu stream lỗi hoặc không khả dụng.
      try {
        const response = await apiChatAssistant(userMsg);
        const botReply = response?.reply || response?.response || response?.message || response;
        upsertBot(botId, botReply);
      } catch {
        upsertBot(botId, 'Xin lỗi, hiện chưa thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.', { isError: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  const handleClearHistory = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await apiDeleteAssistantHistory();
      setMessages([WELCOME_MESSAGE]);
      setHistoryLoaded(false);
    } catch {
      // silently ignore
    } finally {
      setIsClearing(false);
    }
  };

  if (!isAuthenticated) return null;

  const showSuggestions = messages.length <= 1 && !isLoading;
  const lastMessage = messages[messages.length - 1];
  const showTyping = isLoading && (!lastMessage || !lastMessage.isBot);

  return (
    <div className="aiw-root">
      {!isOpen && (
        <button className="aiw-fab" onClick={() => setIsOpen(true)} aria-label="Mở trợ lý AI">
          <span className="aiw-fab-icon"><Sparkles size={18} /></span>
          <span>Hỏi AI</span>
        </button>
      )}

      {isOpen && (
        <div className="aiw-window" role="dialog" aria-label="Trợ lý AI H-Smart">
          <div className="aiw-header">
            <div className="aiw-header-peer">
              <span className="aiw-bot-avatar"><Bot size={18} /></span>
              <div className="aiw-header-info">
                <strong>Trợ lý H-Smart</strong>
                <span><i /> Luôn sẵn sàng hỗ trợ</span>
              </div>
            </div>
            <div className="aiw-header-actions">
              <button
                type="button"
                className="aiw-icon-btn"
                title="Xóa lịch sử hội thoại"
                aria-label="Xóa lịch sử hội thoại"
                onClick={handleClearHistory}
                disabled={isClearing}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="aiw-icon-btn"
                title="Đóng"
                aria-label="Đóng"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="aiw-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`aiw-bubble ${msg.isBot ? 'bot' : 'user'} ${msg.isError ? 'error' : ''}`}
              >
                {msg.text}
              </div>
            ))}

            {showSuggestions && (
              <div className="aiw-suggestions">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="aiw-chip"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {showTyping && (
              <div className="aiw-bubble bot aiw-typing">
                <span className="aiw-dot" /><span className="aiw-dot" /><span className="aiw-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="aiw-composer" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nhập câu hỏi…"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={isLoading}
              aria-label="Nội dung câu hỏi"
            />
            <button type="submit" className="aiw-send" disabled={!inputValue.trim() || isLoading} aria-label="Gửi">
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AssistantWidget;
