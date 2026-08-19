import BooleanBadge from './BooleanBadge';
import { formatRole, formatTrustScore } from '../../pages/admin/format';

const UserPreview = ({ user }) => {
  if (!user) return null;

  return (
    <div className="adm-preview">
      <div className="adm-meta-grid">
        <div>
          <span>ID</span>
          <strong translate="no">#{user.id}</strong>
        </div>
        <div>
          <span>Username</span>
          <strong translate="no">@{user.username || '—'}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{user.email || '—'}</strong>
        </div>
        <div>
          <span>Vai trò</span>
          <strong>{formatRole(user.role)}</strong>
        </div>
        <div>
          <span>Trạng thái</span>
          <BooleanBadge value={Boolean(user.active)} trueLabel="Active" falseLabel="Banned" />
        </div>
        <div>
          <span>Email verified</span>
          <BooleanBadge value={Boolean(user.emailVerified)} trueLabel="Verified" falseLabel="Unverified" />
        </div>
      </div>

      <section className="adm-preview-section">
        <h3>Thông tin cá nhân</h3>
        <div className="adm-meta-grid">
          <div>
            <span>Họ tên</span>
            <strong>{user.fullName || '—'}</strong>
          </div>
          <div>
            <span>Số điện thoại</span>
            <strong>{user.phoneNumber || '—'}</strong>
          </div>
          <div>
            <span>Tỉnh / Thành</span>
            <strong>{user.province || '—'}</strong>
          </div>
          <div>
            <span>Quận / Huyện</span>
            <strong>{user.district || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="adm-preview-section">
        <h3>Độ tin cậy</h3>
        <div className="adm-meta-grid">
          <div>
            <span>Trust score</span>
            <strong>{formatTrustScore(user.trustScore)}</strong>
          </div>
          <div>
            <span>Số lượng review</span>
            <strong>{user.reviewCount || 0}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserPreview;
