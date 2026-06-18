const toneByStatus = {
  ACTIVE: 'success',
  APPROVED: 'success',
  COMPLETED: 'success',
  SOLD: 'neutral',
  PENDING: 'warning',
  PROCESSING: 'warning',
  PENDING_REVIEW: 'warning',
  HIDDEN: 'danger',
  CANCELLED: 'danger',
};

const labelByStatus = {
  ACTIVE: 'Đang bán',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Hoàn tất',
  SOLD: 'Đã bán',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  PENDING_REVIEW: 'Chờ duyệt',
  HIDDEN: 'Đã ẩn',
  CANCELLED: 'Đã hủy',
  UNKNOWN: 'Không rõ',
};

const StatusBadge = ({ status = 'UNKNOWN' }) => (
  <span className={`status-badge status-${toneByStatus[status] || 'neutral'}`}>
    {labelByStatus[status] || String(status).replaceAll('_', ' ')}
  </span>
);

export default StatusBadge;
