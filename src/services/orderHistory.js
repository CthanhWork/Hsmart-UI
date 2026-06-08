const STORAGE_KEY = 'hsmart_recent_order_ids';

export const getRecentOrderIds = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const rememberOrderId = (orderId) => {
  const nextIds = [
    String(orderId),
    ...getRecentOrderIds().filter((id) => String(id) !== String(orderId)),
  ].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
  return nextIds;
};
