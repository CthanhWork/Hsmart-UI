import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, Trash2 } from 'lucide-react';
import { apiChatAssistant, apiGetAssistantHistory, apiDeleteAssistantHistory } from '../../services/api';
import { useUser } from '../../context/UserContext';
import './AssistantWidget.css';

const WELCOME_MESSAGE = {
  id: 'welcome',
  text: 'Xin chao! Toi la AI H-Smart. Toi co the ho tro dinh gia do gia dung, giai thich quy trinh kiem duyet hoac giup ban tim san pham phu hop.',
  isBot: true,
};

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
  }, [messages, isOpen]);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { id: Date.now(), text: userMsg, isBot: false }]);
    setIsLoading(true);

    try {
      const response = await apiChatAssistant(userMsg);
      const botReply = response?.reply || response?.response || response?.message || response;
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botReply, isBot: true }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: 'Xin loi, hien toi chua the ket noi toi dich vu AI. Vui long thu lai sau.',
        isBot: true,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="assistant-widget-container">
      {!isOpen && (
        <button className="assistant-toggle-btn" onClick={() => setIsOpen(true)}>
          <Sparkles size={20} className="pulse-anim" />
          <span>Hoi AI</span>
        </button>
      )}

      {isOpen && (
        <div className="assistant-chat-window">
          <div className="chat-header">
            <div className="flex items-center gap-2">
              <div className="bot-avatar"><Bot size={16} /></div>
              <span className="font-bold text-sm">Tro ly H-Smart</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="close-btn"
                title="Xoa lich su hoi thoai"
                aria-label="Xoa lich su hoi thoai"
                onClick={handleClearHistory}
                disabled={isClearing}
              >
                <Trash2 size={15} />
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Dong">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble ${msg.isBot ? 'bot' : 'user'} ${msg.isError ? 'error' : ''}`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble bot loading-bubble">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Nhap cau hoi..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={!inputValue.trim() || isLoading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AssistantWidget;
