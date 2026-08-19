// Shared formatting helpers for the admin section.
const currencyFormatter = new Intl.NumberFormat('vi-VN');

export const emptyPage = {
  content: [],
  pageNo: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

export const formatMoney = (value) => `${currencyFormatter.format(Number(value || 0))} VND`;

export const formatDateTime = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
};

export const formatRole = (role) => (role
  ? String(role)
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
  : '—');

export const formatTrustScore = (value) => {
  if (value === null || value === undefined || value === '') return '0.0';
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);
  return numberValue.toFixed(1);
};

export const deliveryLabel = (method) => {
  if (method === 'GHTK') return 'Giao Hàng Tiết Kiệm';
  if (method === 'VIETTEL_POST') return 'Viettel Post';
  return method || 'Chưa rõ';
};
