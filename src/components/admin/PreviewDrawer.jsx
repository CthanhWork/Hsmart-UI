import { useEffect } from 'react';
import { X } from 'lucide-react';

// Detail viewer rendered as a centered modal dialog (small window).
const PreviewDrawer = ({ open, kicker, title, loading, onClose, children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="adm-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="adm-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Chi tiết'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="adm-detail-modal-head">
          <div>
            {kicker ? <span className="adm-drawer-kicker">{kicker}</span> : null}
            <h2>{loading ? 'Đang tải chi tiết…' : title}</h2>
          </div>
          <button
            type="button"
            className="adm-icon-button"
            onClick={onClose}
            aria-label="Đóng khung chi tiết"
            title="Đóng"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="adm-detail-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PreviewDrawer;
