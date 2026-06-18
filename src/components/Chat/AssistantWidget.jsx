import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { apiChatAssistant } from '../../services/api';
import { useUser } from '../../context/UserContext';
import './AssistantWidget.css';

const AssistantWidget = () => {
  const { isAuthenticated } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Xin chào! Tôi là AI H-Smart. Tôi có thể hỗ trợ định giá đồ gia dụng, giải thích quy trình kiểm duyệt hoặc giúp bạn tìm sản phẩm phù hợp.', isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, isBot: false }]);
    setIsLoading(true);

    try {
      // Call the interaction-service assistant endpoint
      const response = await apiChatAssistant(userMsg);
      // Assuming response has a 'reply' or 'response' field, or is just a string
      const botReply = response.reply || response.response || response.message || response;
      
      setMessages(prev => [...prev, { id: Date.now(), text: botReply, isBot: true }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), text: 'Xin lỗi, hiện tôi chưa thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.', isBot: true, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="assistant-widget-container">
      {!isOpen && (
        <button className="assistant-toggle-btn" onClick={() => setIsOpen(true)}>
          <Sparkles size={20} className="pulse-anim" />
          <span>Hỏi AI</span>
        </button>
      )}

      {isOpen && (
        <div className="assistant-chat-window">
          <div className="chat-header">
            <div className="flex items-center gap-2">
              <div className="bot-avatar"><Bot size={16} /></div>
              <span className="font-bold text-sm">Trợ lý H-Smart</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}><X size={16} /></button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.isBot ? 'bot' : 'user'} ${msg.isError ? 'error' : ''}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble bot loading-bubble">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chat-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Nhập câu hỏi..." 
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
