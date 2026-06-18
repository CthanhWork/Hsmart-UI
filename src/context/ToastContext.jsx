import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

const DEFAULT_DURATION = 3200;
const ToastContext = createContext(null);

const TOAST_ICON = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((message, options = {}) => {
    if (!message) return;

    const id = globalThis.crypto?.randomUUID?.() || `toast-${Date.now()}-${Math.random()}`;
    const {
      type = 'info',
      title = '',
      duration = DEFAULT_DURATION,
    } = options;

    setToasts((current) => [...current, {
      id,
      type,
      title,
      message,
    }]);

    const timer = window.setTimeout(() => dismiss(id), duration);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  const value = useMemo(() => ({
    push,
    success: (message, options = {}) => push(message, { ...options, type: 'success' }),
    error: (message, options = {}) => push(message, { ...options, type: 'error', duration: options.duration ?? 4200 }),
    info: (message, options = {}) => push(message, { ...options, type: 'info' }),
    dismiss,
  }), [dismiss, push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = TOAST_ICON[toast.type] || Info;

          return (
            <article className={`toast-card toast-${toast.type}`} key={toast.id} role="status">
              <div className="toast-icon-wrap" aria-hidden="true">
                <Icon size={18} />
              </div>

              <div className="toast-copy">
                {toast.title ? <strong>{toast.title}</strong> : null}
                <p>{toast.message}</p>
              </div>

              <button
                type="button"
                className="toast-close"
                aria-label="Đóng thông báo"
                onClick={() => dismiss(toast.id)}
              >
                <X size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
