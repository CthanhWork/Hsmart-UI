import { useEffect } from 'react';
import { X } from 'lucide-react';

const ConfirmModal = ({ open, title, message, confirmLabel, pending, onConfirm, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !pending) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div className="adm-modal-backdrop" role="presentation" onClick={() => !pending && onClose()}>
      <div
        className="adm-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="adm-modal-head">
          <h3 id="adm-confirm-title">{title}</h3>
          <button
            type="button"
            className="adm-icon-button"
            onClick={onClose}
            disabled={pending}
            aria-label="Đóng xác nhận"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <p className="adm-modal-copy">{message}</p>

        <div className="adm-modal-actions">
          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            onClick={onClose}
            disabled={pending}
          >
            Hủy
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Đang xử lý…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
