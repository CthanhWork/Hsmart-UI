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

const StatusBadge = ({ status = 'UNKNOWN' }) => (
  <span className={`status-badge status-${toneByStatus[status] || 'neutral'}`}>
    {String(status).replaceAll('_', ' ')}
  </span>
);

export default StatusBadge;
