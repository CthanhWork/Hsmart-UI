const isLocalDevelopmentHost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_API_BASE_URL = isLocalDevelopmentHost
  ? 'http://localhost:8000/api/v1'
  : '/api/v1';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL)
  .trim()
  .replace(/^\uFEFF/, '')
  .replace(/\/+$/, '');
const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || API_BASE_URL)
  .trim()
  .replace(/^\uFEFF/, '')
  .replace(/\/+$/, '');
const DEFAULT_PRODUCT_IMAGE = '/products_hq/coffee_maker.jpg';

const TOKEN_KEY = 'hsmart_token';
const REFRESH_TOKEN_KEY = 'hsmart_refresh_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Backend lưu media bằng URL tuyệt đối tới host nội bộ của gateway (có thể sai
// cert / không truy cập được từ trình duyệt). Viết lại các URL media về cùng
// origin/API base mà app đang dùng; bỏ qua URL ngoài (vd Unsplash).
const MEDIA_PATH_PATTERN = /\/api\/v1\/(?:users\/media|users\/avatar|products\/media|interactions\/media)\//;

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    if (MEDIA_PATH_PATTERN.test(parsed.pathname)) {
      const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/, '');
      return `${apiOrigin}${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
};

const CATEGORY_LABELS = {
  air_conditioner: 'Máy lạnh',
  automatic_washer: 'Máy giặt',
  bed: 'Giường',
  bedspread: 'Ga trải giường',
  bench: 'Ghế băng',
  blender: 'Máy xay',
  bunk_bed: 'Giường tầng',
  cabinet: 'Tủ',
  chair: 'Ghế',
  coffee_table: 'Bàn cà phê',
  cupboard: 'Tủ chén',
  deck_chair: 'Ghế thư giãn',
  desk: 'Bàn làm việc',
  dining_table: 'Bàn ăn',
  drawer: 'Ngăn kéo',
  electric_chair: 'Ghế điện',
  fan: 'Quạt',
  faucet: 'Vòi nước',
  file_cabinet: 'Tủ hồ sơ',
  folding_chair: 'Ghế gấp',
  highchair: 'Ghế trẻ em',
  kettle: 'Ấm đun nước',
  kitchen_sink: 'Bồn rửa bếp',
  kitchen_table: 'Bàn bếp',
  lamp: 'Đèn',
  mattress: 'Nệm',
  microwave_oven: 'Lò vi sóng',
  mirror: 'Gương',
  oven: 'Lò nướng',
  recliner: 'Ghế tựa',
  rocking_chair: 'Ghế bập bênh',
  sink: 'Bồn rửa',
  sofa: 'Sofa',
  sofa_bed: 'Sofa giường',
  stool: 'Ghế đẩu',
  stove: 'Bếp',
  table: 'Bàn',
  table_lamp: 'Đèn bàn',
  television_set: 'Tivi',
  toaster_oven: 'Lò nướng mini',
  vacuum_cleaner: 'Máy hút bụi',
  wardrobe: 'Tủ quần áo',
  water_faucet: 'Vòi nước',
};

const formatCategoryName = (name = '') => name
  ? CATEGORY_LABELS[name] || name
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
  : '';

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'object' && body?.message
      ? body.message
      : body || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.response = body;
    throw error;
  }

  return body;
};

let refreshPromise = null;

// Rotate the access token using the stored refresh token. Single-flight so
// concurrent 401s only trigger one /auth/refresh call.
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) throw new Error('refresh-failed');
        const body = await response.json();
        const data = body?.data ?? body;
        if (data?.accessToken) localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        return data?.accessToken || null;
      } catch {
        clearStoredTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

const request = async (path, options = {}, authenticated = false, retried = false) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // Access token expired: try a one-time silent refresh, then replay the request.
  if (response.status === 401 && authenticated && !retried && getRefreshToken()) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return request(path, options, authenticated, true);
    }
  }

  return parseResponse(response);
};

const jsonRequest = (path, method, body, authenticated = false) => request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}, authenticated);

const unwrapData = (payload) => payload?.data ?? payload;

const toArray = (value) => {
  const data = unwrapData(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizeProduct = (product) => ({
  ...product,
  id: product?.id,
  title: product?.title || 'Sản phẩm chưa đặt tên',
  description: product?.description || '',
  price: Number(product?.price ?? 0),
  imageUrl: resolveMediaUrl(product?.imageUrl) || DEFAULT_PRODUCT_IMAGE,
  imageUrls: Array.isArray(product?.imageUrls) && product.imageUrls.length
    ? product.imageUrls.map(resolveMediaUrl)
    : [resolveMediaUrl(product?.imageUrl) || DEFAULT_PRODUCT_IMAGE],
  sellerDistrict: product?.sellerDistrict || '',
  sellerProvince: product?.sellerProvince || '',
  categoryName: formatCategoryName(product?.categoryName || ''),
  likeCount: Number(product?.likeCount || 0),
  aiMetadata: Array.isArray(product?.aiMetadata) ? product.aiMetadata : [],
  negotiable: Boolean(product?.negotiable),
  minPrice: product?.minPrice != null && product?.minPrice !== ''
    ? Number(product.minPrice)
    : null,
});

const normalizePage = (payload, mapper = (item) => item) => {
  const data = unwrapData(payload);
  const content = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.data)
        ? data.data
        : [];
  return {
    content: content.map(mapper),
    pageNo: Number(data?.pageNo || 0),
    pageSize: Number(data?.pageSize || content?.length || 0),
    totalElements: Number(data?.totalElements || content?.length || 0),
    totalPages: Number(data?.totalPages || 0),
    last: data?.last ?? true,
  };
};

const saveAccessToken = (payload) => {
  const data = unwrapData(payload);
  if (data?.accessToken) localStorage.setItem(TOKEN_KEY, data.accessToken);
  if (data?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
};

export const apiRegister = async (registration) => unwrapData(
  await jsonRequest('/auth/register', 'POST', registration),
);

export const apiForgotPassword = async (email) => unwrapData(
  await jsonRequest('/auth/forgot-password', 'POST', { email }),
);

export const apiVerifyEmail = async (token) => unwrapData(
  await jsonRequest('/auth/verify-email', 'POST', { token }),
);

export const apiResendVerification = async (email) => unwrapData(
  await jsonRequest('/auth/resend-verification', 'POST', { email }),
);

export const apiResetPassword = async (token, newPassword) => unwrapData(
  await jsonRequest('/auth/reset-password', 'POST', { token, newPassword }),
);

export const apiLogin = async (usernameOrEmail, password) => saveAccessToken(
  await jsonRequest('/auth/login', 'POST', { usernameOrEmail, password }),
);

export const apiGetProfile = async () => unwrapData(
  await request('/users/profile', {}, true),
);

export const apiFetchProvinces = async () => unwrapData(
  await request('/locations/provinces'),
);

export const apiFetchDistricts = async (provinceCode) => unwrapData(
  await request(`/locations/districts?provinceCode=${encodeURIComponent(provinceCode)}`),
);

export const apiFetchWards = async (provinceCode, districtCode) => unwrapData(
  await request(`/locations/wards?provinceCode=${encodeURIComponent(provinceCode)}&districtCode=${encodeURIComponent(districtCode)}`),
);

export const apiUpdateProfile = async (profileData) => unwrapData(
  await jsonRequest('/users/profile', 'PUT', profileData, true),
);

export const apiUploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return unwrapData(await request('/users/avatar', { method: 'PUT', body: formData }, true));
};

export const apiChangePassword = async ({ currentPassword, newPassword }) => unwrapData(
  await jsonRequest('/users/password', 'PUT', { currentPassword, newPassword }, true),
);

export const apiRequestEmailChange = async (newEmail) => unwrapData(
  await jsonRequest('/users/email/change', 'POST', { newEmail }, true),
);

export const apiConfirmEmailChange = async (token) => unwrapData(
  await jsonRequest('/users/email/confirm', 'POST', { token }, true),
);

export const apiLogout = async () => {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await jsonRequest('/auth/logout', 'POST', { refreshToken });
    }
  } finally {
    clearStoredTokens();
  }
};

export const apiFetchCategories = async () => {
  const categories = toArray(await request('/products/categories'));
  return categories.map((category) => ({
    ...category,
    displayName: formatCategoryName(category.name),
  }));
};

export const apiCreateCategory = async (name) => unwrapData(
  await jsonRequest('/products/categories', 'POST', { name }, true),
);

export const apiFetchProductPage = async ({
  keyword,
  status,
  categoryId,
  provinceCode,
  page = 0,
  size = 24,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (keyword) params.set('keyword', keyword);
  if (status) params.set('status', status);
  if (categoryId) params.set('categoryId', String(categoryId));
  if (provinceCode) params.set('provinceCode', String(provinceCode));
  return normalizePage(await request(`/products?${params.toString()}`), normalizeProduct);
};

export const apiFetchProducts = async (options = {}) => {
  const page = await apiFetchProductPage(options);
  return page.content;
};

// search-service contract: q, category (text match on categoryName), minPrice,
// maxPrice, provinceCode (term filter on seller province), Spring Pageable page
// (0-based), size, sort (e.g. 'price,asc').
export const apiSearchProducts = async (query, {
  category,
  minPrice,
  maxPrice,
  provinceCode,
  page = 0,
  size = 12,
  sort,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') params.set('minPrice', String(minPrice));
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') params.set('maxPrice', String(maxPrice));
  if (provinceCode) params.set('provinceCode', String(provinceCode));
  if (sort) params.set('sort', sort);
  return normalizePage(await request(`/search/products?${params.toString()}`), normalizeProduct);
};

export const apiFetchProductById = async (id) => normalizeProduct(
  unwrapData(await request(`/products/${id}`)),
);

// Admin xem chi tiết tin đăng (kể cả PENDING_REVIEW) qua endpoint internal.
export const apiAnalyzeImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return unwrapData(await request('/products/analyze-image', {
    method: 'POST',
    body: formData,
  }, true));
};

export const apiPrepareListing = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return unwrapData(await request('/products/prepare-listing', {
    method: 'POST',
    body: formData,
  }, true));
};

export const apiCreateProduct = async (formData) => {
  const payload = await request('/products', { method: 'POST', body: formData }, true);
  return { ...normalizeProduct(unwrapData(payload)), apiMessage: payload?.message };
};

export const apiUpdateProduct = async (id, formData) => normalizeProduct(
  unwrapData(await request(`/products/${id}`, { method: 'PUT', body: formData }, true)),
);

export const apiDeleteProduct = async (id) => request(
  `/products/${id}`,
  { method: 'DELETE' },
  true,
);

export const apiToggleWishlist = async (id) => request(
  `/products/${id}/like`,
  { method: 'POST' },
  true,
);

export const apiFetchWishlist = async (page = 0, size = 24) => normalizePage(
  await request(`/products/wishlist?page=${page}&size=${size}`, {}, true),
  normalizeProduct,
);

// Tin đăng của người dùng đang đăng nhập — server tự lọc theo seller (không lọc ở client).
export const apiFetchMyProducts = async (page = 0, size = 100) => normalizePage(
  await request(`/products/mine?page=${page}&size=${size}`, {}, true),
  normalizeProduct,
);

export const apiGenerateDescription = async ({
  productName,
  category,
  condition,
  price,
  sellerNotes,
}) => unwrapData(await jsonRequest('/assistant/generate-description', 'POST', {
  productName,
  category,
  condition,
  price,
  ...(sellerNotes ? { sellerNotes } : {}),
}, true));

export const apiChatAssistant = async (message) => unwrapData(
  await jsonRequest('/assistant/chat', 'POST', { message }, true),
);

const extractStreamToken = (data) => {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'string') return parsed;
    return parsed.content ?? parsed.token ?? parsed.text ?? parsed.delta ?? parsed.message ?? '';
  } catch {
    return data;
  }
};

// SSE stream trợ lý. onChunk(fullText, deltaText) gọi mỗi token; trả full text.
// EventSource không gắn được Authorization header nên dùng fetch + ReadableStream.
export const apiStreamAssistant = async (message, { onChunk, signal } = {}) => {
  const token = getToken();
  const headers = { Accept: 'text/event-stream' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const params = new URLSearchParams({ message });
  const response = await fetch(`${API_BASE_URL}/assistant/chat/stream?${params.toString()}`, {
    method: 'GET',
    headers,
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('Không thể kết nối luồng trợ lý.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLines = event.split('\n').filter((line) => line.startsWith('data:'));
      if (!dataLines.length) continue;
      const data = dataLines.map((line) => line.slice(5).replace(/^ /, '')).join('\n');
      if (!data || data === '[DONE]') continue;
      full += extractStreamToken(data);
      onChunk?.(full, data);
    }
  }

  return full;
};

export const apiGetAssistantHistory = async (limit = 30) => unwrapData(
  await request(`/assistant/history?limit=${limit}`, {}, true),
);

export const apiDeleteAssistantHistory = async () => request(
  '/assistant/history',
  { method: 'DELETE' },
  true,
);

export const apiFetchMessages = async (participantId, productId) => {
  const params = new URLSearchParams({ participantId, productId: String(productId) });
  return unwrapData(await request(`/interactions/messages?${params.toString()}`, {}, true));
};

export const apiUploadChatMedia = async ({
  receiverId,
  productId,
  content,
  file,
}) => {
  const formData = new FormData();
  formData.append('receiverId', String(receiverId));
  formData.append('productId', String(productId));
  if (String(content || '').trim()) {
    formData.append('content', String(content).trim());
  }
  formData.append('file', file);

  return unwrapData(await request('/interactions/messages/media', {
    method: 'POST',
    body: formData,
  }, true));
};

export const apiFetchConversations = async () => unwrapData(
  await request('/interactions/conversations', {}, true),
);

export const apiFetchNotifications = async () => unwrapData(
  await request('/interactions/notifications', {}, true),
);

export const apiFetchNotificationsPage = async ({
  read,
  type,
  page = 0,
  size = 20,
  sort,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (typeof read === 'boolean') params.set('read', String(read));
  if (type) params.set('type', type);
  if (sort) params.set('sort', sort);
  return normalizePage(await request(`/interactions/notifications/page?${params.toString()}`, {}, true));
};

export const apiMarkNotificationRead = async (notificationId) => unwrapData(
  await request(`/interactions/notifications/${notificationId}/read`, { method: 'PATCH' }, true),
);

export const apiMarkAllNotificationsRead = async () => unwrapData(
  await request('/interactions/notifications/read-all', { method: 'PATCH' }, true),
);

// unread-count có thể trả số trực tiếp hoặc { unreadCount }. Chuẩn hoá về number.
export const apiFetchNotificationUnreadCount = async () => {
  const data = unwrapData(await request('/interactions/notifications/unread-count', {}, true));
  if (typeof data === 'number') return data;
  return Number(data?.unreadCount ?? data?.count ?? 0) || 0;
};

// Tạo đơn trực tiếp đã bị gỡ ở backend. Mọi đơn hàng giờ được tạo sau khi người
// mua thanh toán cọc (= phí vận chuyển) qua VNPay. payment-service sẽ tự gọi
// order-service tạo Order khi cọc thành công.
export const apiCreateDeposit = async (
  productId,
  deliveryMethod = 'VIETTEL_POST',
  offerId = null,
) => unwrapData(
  await jsonRequest('/payments/deposit', 'POST', {
    productId,
    deliveryMethod,
    ...(offerId ? { offerId } : {}),
  }, true),
);

// FE poll trạng thái cọc sau khi VNPay điều hướng trình duyệt về.
export const apiFetchPayment = async (id) => unwrapData(
  await request(`/payments/${id}`, {}, true),
);

// Seller tạo giao dịch VNPay cho phí nền tảng của một đơn (mục 3.1 bàn giao BE).
// Trả về PlatformFeeResponseDTO kèm paymentUrl để redirect sang VNPay.
export const apiCreatePlatformFeePayment = async (orderId) => unwrapData(
  await jsonRequest('/payments/platform-fee', 'POST', { orderId }, true),
);

// Poll trạng thái giao dịch phí nền tảng sau khi quay lại từ VNPay (mục 3.2).
// status ∈ { PENDING, PAID, FAILED, EXPIRED }; PAID nghĩa là đơn đã mở khoá xác nhận.
export const apiFetchPlatformFeePayment = async (id) => unwrapData(
  await request(`/payments/platform-fee/${id}`, {}, true),
);

export const apiEstimateShipping = async (productId, deliveryMethod = 'VIETTEL_POST') => {
  const params = new URLSearchParams({
    productId: String(productId),
    deliveryMethod,
  });
  return unwrapData(await request(`/orders/shipping-estimate?${params.toString()}`, {}, true));
};

export const apiEstimateGuestShipping = async ({
  productId,
  deliveryMethod = 'VIETTEL_POST',
  province,
  district,
}) => {
  const params = new URLSearchParams({
    productId: String(productId),
    deliveryMethod,
    province,
    district,
  });
  return unwrapData(await request(`/orders/shipping-estimate/guest?${params.toString()}`));
};

export const apiCreateOffer = async ({ productId, discountPercent }) => unwrapData(
  await jsonRequest('/orders/offers', 'POST', { productId, discountPercent }, true),
);

// GET /orders/offers now returns PageResponseDTO; toArray unwraps `.content`.
export const apiFetchOffers = async () => toArray(
  await request('/orders/offers', {}, true),
);

export const apiAcceptOffer = async (id) => unwrapData(
  await request(`/orders/offers/${id}/accept`, { method: 'POST' }, true),
);

export const apiRejectOffer = async (id) => unwrapData(
  await request(`/orders/offers/${id}/reject`, { method: 'POST' }, true),
);

export const apiCancelOffer = async (id) => unwrapData(
  await request(`/orders/offers/${id}/cancel`, { method: 'POST' }, true),
);

export const apiFetchOrder = async (id) => unwrapData(
  await request(`/orders/${id}`, {}, true),
);

// GET /orders trả PageResponseDTO. Backend mặc định 20 đơn/trang, nên ta gộp hết
// các trang để user thấy ĐẦY ĐỦ đơn từng tương tác (mua/bán, mọi trạng thái kể cả
// đã hủy/đã trả), không bị cắt ở 20 đơn mới nhất.
export const apiFetchOrders = async (pageSize = 50) => {
  const all = [];
  let page = 0;
  // Chốt chặn an toàn phòng metadata phân trang bất thường gây lặp vô hạn.
  for (let guard = 0; guard < 200; guard += 1) {
    const result = normalizePage(
      await request(`/orders?page=${page}&size=${pageSize}`, {}, true),
    );
    all.push(...result.content);
    if (result.last || result.content.length === 0 || page + 1 >= result.totalPages) break;
    page += 1;
  }
  return all;
};

// Seller xác nhận đơn; có thể kèm 1+ ảnh bằng chứng (multipart) hoặc không.
export const apiConfirmOrder = async (id, files = []) => {
  const fileList = Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean);
  if (fileList.length) {
    const formData = new FormData();
    fileList.forEach((file) => formData.append('files', file));
    return unwrapData(await request(`/orders/${id}/confirm`, { method: 'POST', body: formData }, true));
  }
  return unwrapData(await request(`/orders/${id}/confirm`, { method: 'POST' }, true));
};

export const apiCompleteOrder = async (id) => unwrapData(
  await request(`/orders/${id}/complete`, { method: 'POST' }, true),
);

export const apiCancelOrder = async (id) => unwrapData(
  await request(`/orders/${id}/cancel`, { method: 'POST' }, true),
);

// Trả hàng: buyer yêu cầu, seller duyệt/từ chối.
export const apiRequestReturn = async (id, reason) => unwrapData(
  await jsonRequest(`/orders/${id}/return-request`, 'POST', { reason }, true),
);

export const apiApproveReturn = async (id) => unwrapData(
  await request(`/orders/${id}/return-approve`, { method: 'POST' }, true),
);

export const apiRejectReturn = async (id, reason) => unwrapData(
  await jsonRequest(`/orders/${id}/return-reject`, 'POST', reason ? { reason } : {}, true),
);

export const apiCreateReview = async ({ orderId, rating, comment }) => unwrapData(
  await jsonRequest('/reviews', 'POST', { orderId, rating, comment }, true),
);

export const apiFetchSellerReviews = async (sellerId) => unwrapData(
  await request(`/reviews/sellers/${encodeURIComponent(sellerId)}`),
);

export const apiSubmitReport = async (productId, reason) => unwrapData(
  await jsonRequest('/reports', 'POST', { productId, reason }, true),
);

// stats/overview nay trả thêm platformFeeRevenue (tổng doanh thu phí nền tảng).
export const apiFetchAdminStats = async () => unwrapData(
  await request('/admin/stats/overview', {}, true),
);

// Tổng quan tài khoản hệ thống: số dư ví + tổng phí thu/chi + số bút toán (mục 4.1).
export const apiFetchSystemAccount = async () => unwrapData(
  await request('/admin/system-account', {}, true),
);

// Sổ giao dịch ví hệ thống, phân trang, mới nhất trước (mục 4.2).
export const apiFetchSystemLedger = async ({ page = 0, size = 20 } = {}) => normalizePage(
  await request(`/admin/system-account/ledger?page=${page}&size=${size}`, {}, true),
);

export const apiModerateProduct = async (productId, action) => unwrapData(
  await jsonRequest(`/admin/products/${productId}/moderate`, 'POST', { action }, true),
);

export const apiFetchAdminUsers = async ({
  search,
  isActive,
  page = 0,
  size = 10,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set('search', search);
  if (typeof isActive === 'boolean') params.set('isActive', String(isActive));
  return normalizePage(await request(`/admin/users?${params.toString()}`, {}, true));
};

export const apiFetchAdminUserById = async (userId) => unwrapData(
  await request(`/admin/users/${encodeURIComponent(userId)}`, {}, true),
);

export const apiBanUser = async (username) => unwrapData(
  await request(`/admin/users/${encodeURIComponent(username)}/ban`, { method: 'POST' }, true),
);

export const apiUnbanUser = async (username) => unwrapData(
  await request(`/admin/users/${encodeURIComponent(username)}/unban`, { method: 'POST' }, true),
);

// GET /admin/reports hỗ trợ lọc theo status (PENDING|RESOLVED|DISMISSED). Mặc
// định lấy hàng chờ PENDING vì đây là danh sách cần admin xử lý.
export const apiFetchPendingReports = async ({ status = 'PENDING', page = 0, size = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  return normalizePage(await request(`/admin/reports?${params.toString()}`, {}, true));
};

// action hợp lệ: HIDE_PRODUCT | DISMISS, kèm resolutionReason tuỳ chọn.
export const apiProcessReport = async (reportId, action, resolutionReason) => unwrapData(
  await jsonRequest(`/admin/reports/${reportId}/action`, 'POST', {
    action,
    ...(resolutionReason ? { resolutionReason } : {}),
  }, true),
);

export const apiFetchAdminOrders = async ({
  status,
  page = 0,
  size = 10,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  return normalizePage(await request(`/admin/orders?${params.toString()}`, {}, true));
};

export const apiAdminCancelOrder = async (orderId) => unwrapData(
  await request(`/admin/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' }, true),
);

export const apiFetchAdminNotifications = async ({
  processed,
  page = 0,
  size = 20,
  sort,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (typeof processed === 'boolean') params.set('processed', String(processed));
  if (sort) params.set('sort', sort);
  return normalizePage(await request(`/admin/notifications?${params.toString()}`, {}, true));
};

export const apiFetchAdminNotificationUnreadCount = async () => {
  const data = unwrapData(await request('/admin/notifications/unread-count', {}, true));
  if (typeof data === 'number') return data;
  return Number(data?.unreadCount ?? data?.count ?? 0) || 0;
};

export const apiAdminApproveReturn = async (orderId) => unwrapData(
  await request(`/admin/orders/${encodeURIComponent(orderId)}/return-approve`, { method: 'POST' }, true),
);

export const apiAdminRejectReturn = async (orderId, reason) => unwrapData(
  await jsonRequest(
    `/admin/orders/${encodeURIComponent(orderId)}/return-reject`,
    'POST',
    reason ? { reason } : {},
    true,
  ),
);

export const apiFetchAdminReviews = async ({
  page = 0,
  size = 10,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return normalizePage(await request(`/admin/reviews?${params.toString()}`, {}, true));
};

export const apiHideAdminReview = async (reviewId) => unwrapData(
  await request(`/admin/reviews/${encodeURIComponent(reviewId)}/hide`, { method: 'POST' }, true),
);

export const apiRestoreAdminReview = async (reviewId) => unwrapData(
  await request(`/admin/reviews/${encodeURIComponent(reviewId)}/restore`, { method: 'POST' }, true),
);

export const getWebSocketUrl = () => {
  const token = getToken();
  const url = new URL(WS_BASE_URL, window.location.origin);
  if (url.protocol === 'https:') {
    url.protocol = 'wss:';
  } else if (url.protocol === 'http:') {
    url.protocol = 'ws:';
  }
  const basePath = url.pathname.replace(/\/+$/, '');
  url.pathname = (basePath.endsWith('/api/v1')
    ? `${basePath}/interactions/ws`
    : `${basePath}/api/v1/interactions/ws`).replace(/\/+/g, '/');
  url.search = token ? new URLSearchParams({ token }).toString() : '';
  return url.toString();
};

export const apiBaseUrl = API_BASE_URL;
