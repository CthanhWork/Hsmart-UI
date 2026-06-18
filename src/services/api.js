const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL)
  .trim()
  .replace(/^\uFEFF/, '')
  .replace(/\/+$/, '');
const DEFAULT_PRODUCT_IMAGE = '/products_hq/coffee_maker.jpg';

export const getToken = () => localStorage.getItem('hsmart_token');

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

const request = async (path, options = {}, authenticated = false) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
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
  imageUrl: product?.imageUrl || DEFAULT_PRODUCT_IMAGE,
  imageUrls: Array.isArray(product?.imageUrls) && product.imageUrls.length
    ? product.imageUrls
    : [product?.imageUrl || DEFAULT_PRODUCT_IMAGE],
  sellerDistrict: product?.sellerDistrict || '',
  sellerProvince: product?.sellerProvince || '',
  categoryName: formatCategoryName(product?.categoryName || ''),
  likeCount: Number(product?.likeCount || 0),
  aiMetadata: Array.isArray(product?.aiMetadata) ? product.aiMetadata : [],
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
  if (data?.accessToken) localStorage.setItem('hsmart_token', data.accessToken);
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
  page = 0,
  size = 24,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (keyword) params.set('keyword', keyword);
  if (status) params.set('status', status);
  if (categoryId) params.set('categoryId', String(categoryId));
  return normalizePage(await request(`/products?${params.toString()}`), normalizeProduct);
};

export const apiFetchProducts = async (options = {}) => {
  const page = await apiFetchProductPage(options);
  return page.content;
};

export const apiSearchProducts = async (query, page = 0, size = 24) => {
  const params = new URLSearchParams({ q: query || '', page: String(page), size: String(size) });
  return normalizePage(await request(`/search/products?${params.toString()}`), normalizeProduct);
};

export const apiFetchProductById = async (id) => normalizeProduct(
  unwrapData(await request(`/products/${id}`)),
);

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

export const apiGenerateDescription = async ({
  productName,
  category,
  condition,
  price,
}) => unwrapData(await jsonRequest('/assistant/generate-description', 'POST', {
  productName,
  category,
  condition,
  price,
}, true));

export const apiChatAssistant = async (message) => unwrapData(
  await jsonRequest('/assistant/chat', 'POST', { message }, true),
);

export const apiFetchMessages = async (participantId, productId) => {
  const params = new URLSearchParams({ participantId, productId: String(productId) });
  return unwrapData(await request(`/interactions/messages?${params.toString()}`, {}, true));
};

export const apiFetchConversations = async () => unwrapData(
  await request('/interactions/conversations', {}, true),
);

export const apiFetchNotifications = async () => unwrapData(
  await request('/interactions/notifications', {}, true),
);

export const apiCreateOrder = async (productId, deliveryMethod = 'VIETTEL_POST', offerId = null) => unwrapData(
  await jsonRequest('/orders', 'POST', {
    productId,
    deliveryMethod,
    ...(offerId ? { offerId } : {}),
  }, true),
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

export const apiFetchOffers = async () => unwrapData(
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

export const apiFetchOrders = async () => unwrapData(
  await request('/orders', {}, true),
);

export const apiConfirmOrder = async (id) => unwrapData(
  await request(`/orders/${id}/confirm`, { method: 'POST' }, true),
);

export const apiCompleteOrder = async (id) => unwrapData(
  await request(`/orders/${id}/complete`, { method: 'POST' }, true),
);

export const apiCancelOrder = async (id) => unwrapData(
  await request(`/orders/${id}/cancel`, { method: 'POST' }, true),
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

export const apiFetchAdminStats = async () => unwrapData(
  await request('/admin/stats/overview', {}, true),
);

export const apiModerateProduct = async (productId, action) => unwrapData(
  await jsonRequest(`/admin/products/${productId}/moderate`, 'POST', { action }, true),
);

export const apiBanUser = async (userId) => unwrapData(
  await request(`/admin/users/${encodeURIComponent(userId)}/ban`, { method: 'POST' }, true),
);

export const apiFetchPendingReports = async (page = 0, size = 20) => normalizePage(
  await request(`/admin/reports?page=${page}&size=${size}`, {}, true),
);

export const apiProcessReport = async (reportId, action) => unwrapData(
  await jsonRequest(`/admin/reports/${reportId}/action`, 'POST', { action }, true),
);

export const getWebSocketUrl = () => {
  const token = getToken();
  const url = new URL(API_BASE_URL, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname}/interactions/ws`.replace(/\/+/g, '/');
  url.search = token ? new URLSearchParams({ token }).toString() : '';
  return url.toString();
};

export const apiBaseUrl = API_BASE_URL;
