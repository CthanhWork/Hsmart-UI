import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import BooleanBadge from './BooleanBadge';
import { formatDateTime } from '../../pages/admin/format';

const NotificationPreview = ({ notification }) => {
  if (!notification) return null;

  return (
    <div className="adm-preview">
      <div className="adm-meta-grid">
        <div>
          <span>Mã thông báo</span>
          <strong translate="no">#{notification.id}</strong>
        </div>
        <div>
          <span>Loại</span>
          <strong>{notification.type || '—'}</strong>
        </div>
        <div>
          <span>Trạng thái</span>
          <BooleanBadge value={Boolean(notification.processed)} trueLabel="Đã xử lý" falseLabel="Chờ xử lý" />
        </div>
        <div>
          <span>Thời gian</span>
          <strong>{formatDateTime(notification.createdAt)}</strong>
        </div>
      </div>

      <section className="adm-preview-section">
        <h3>{notification.title || 'Thông báo hệ thống'}</h3>
        <p>{notification.message || 'Không có nội dung.'}</p>
      </section>

      {(notification.productId || notification.reportId) ? (
        <section className="adm-preview-section">
          <h3>Đối tượng liên quan</h3>
          <div className="adm-meta-grid">
            {notification.productId ? (
              <div>
                <span>Sản phẩm</span>
                <strong translate="no">#{notification.productId}</strong>
              </div>
            ) : null}
            {notification.reportId ? (
              <div>
                <span>Báo cáo</span>
                <strong translate="no">#{notification.reportId}</strong>
              </div>
            ) : null}
          </div>
          {notification.productId ? (
            <div className="adm-preview-actions">
              <Link
                to={`/products/${notification.productId}`}
                target="_blank"
                rel="noreferrer"
                className="adm-btn adm-btn-soft"
              >
                Mở trang sản phẩm
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {notification.processed ? (
        <section className="adm-preview-section">
          <h3>Thông tin xử lý</h3>
          <div className="adm-meta-grid">
            <div>
              <span>Xử lý bởi</span>
              <strong translate="no">{notification.processedBy || '—'}</strong>
            </div>
            <div>
              <span>Thời điểm</span>
              <strong>{formatDateTime(notification.processedAt)}</strong>
            </div>
            {notification.resolutionReason ? (
              <div className="adm-meta-wide">
                <span>Ghi chú</span>
                <strong>{notification.resolutionReason}</strong>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default NotificationPreview;
