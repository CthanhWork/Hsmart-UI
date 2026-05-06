const BASE_URL = 'http://localhost:8000/api/v1';

// Helper to get token
export const getToken = () => localStorage.getItem('hsmart_token');

// Utility function to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};

// ==========================================
// USER SERVICE & AUTHENTICATION
// ==========================================

export const apiRegister = async (username, password, email) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email })
  });
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
};

export const apiLogin = async (username, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) throw new Error('Login failed');
  const result = await response.json();
  if (result.data?.token || result.token) {
    localStorage.setItem('hsmart_token', result.data?.token || result.token);
  }
  return result;
};

export const apiGetProfile = async () => {
  const response = await authFetch(`${BASE_URL}/users/profile`);
  if (!response.ok) throw new Error('Failed to fetch profile');
  const json = await response.json();
  return json.data || json;
};

export const apiUpdateProfile = async (profileData) => {
  const response = await authFetch(`${BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};


// ==========================================
// PRODUCT SERVICE
// ==========================================

export const apiFetchCategories = async () => {
  const response = await authFetch(`${BASE_URL}/products/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const json = await response.json();
  return json.data || json;
};

export const apiCreateCategory = async (categoryData) => {
  const response = await authFetch(`${BASE_URL}/products/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData)
  });
  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
};

export const apiFetchProducts = async () => {
  try {
    const response = await authFetch(`${BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const apiFetchProductById = async (id) => {
  const response = await authFetch(`${BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  const json = await response.json();
  return json.data || json;
};

export const apiCreateProduct = async (formData) => {
  const response = await authFetch(`${BASE_URL}/products`, {
    method: 'POST',
    body: formData, // FormData containing 'file' and metadata
  });
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
};

export const apiUpdateProduct = async (id, formData) => {
  const response = await authFetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    body: formData, // form fields via @ModelAttribute as per doc
  });
  if (!response.ok) throw new Error('Failed to update product');
  return response.json();
};

export const apiDeleteProduct = async (id) => {
  // Soft delete
  const response = await authFetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete product');
  return response.json();
};


// ==========================================
// INTERACTION SERVICE
// ==========================================

export const apiFetchMessages = async (participantId) => {
  const response = await authFetch(`${BASE_URL}/interactions/messages?participantId=${participantId}`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  const json = await response.json();
  return json.data || json;
};

export const apiFetchNotifications = async () => {
  const response = await authFetch(`${BASE_URL}/interactions/notifications`);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  const json = await response.json();
  return json.data || json;
};

export const apiCreateNotification = async (notificationData) => {
  const response = await authFetch(`${BASE_URL}/interactions/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData)
  });
  if (!response.ok) throw new Error('Failed to create notification');
  return response.json();
};

export const apiChatAssistant = async (message) => {
  const response = await authFetch(`${BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!response.ok) throw new Error('Failed to communicate with assistant');
  const json = await response.json();
  return json.data || json;
};

// WebSocket setup helper
export const getWebSocketUrl = () => {
  const token = getToken();
  return `ws://localhost:8000/api/v1/interactions/ws${token ? `?token=${token}` : ''}`;
};
