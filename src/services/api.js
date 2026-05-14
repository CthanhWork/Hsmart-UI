import { mockProducts, mockCategories, mockProfile, mockProfiles, mockNotifications, mockMessages } from './mockData';

const BASE_URL = 'http://localhost:8000/api/v1';
const USE_MOCK = true; // Set to false to use real backend

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

// Helper to determine mock user based on token
const getMockUser = () => {
  const token = getToken();
  if (token === 'mock-token-admin') return mockProfiles.admin;
  if (token === 'mock-token-seller01') return mockProfiles.seller;
  return mockProfiles.buyer;
};

// ==========================================
// USER SERVICE & AUTHENTICATION
// ==========================================

export const apiRegister = async (username, password, email) => {
  if (USE_MOCK) return { data: { token: 'mock-token-buyer01', user: mockProfiles.buyer } };
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    if (!response.ok) throw new Error('Registration failed');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiRegister');
    return { data: { token: 'mock-token-buyer01', user: mockProfiles.buyer } };
  }
};

export const apiLogin = async (username, password) => {
  if (USE_MOCK) {
    let mockToken = 'mock-token-buyer01';
    let user = mockProfiles.buyer;
    if (username === 'admin') { mockToken = 'mock-token-admin'; user = mockProfiles.admin; }
    else if (username === 'seller01') { mockToken = 'mock-token-seller01'; user = mockProfiles.seller; }
    localStorage.setItem('hsmart_token', mockToken);
    return { data: { token: mockToken, user } };
  }
  try {
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
  } catch (error) {
    console.warn('API Fallback: apiLogin');
    localStorage.setItem('hsmart_token', 'mock-token-buyer01');
    return { data: { token: 'mock-token-buyer01', user: mockProfiles.buyer } };
  }
};

export const apiGetProfile = async () => {
  if (USE_MOCK) return getMockUser();
  try {
    const response = await authFetch(`${BASE_URL}/users/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiGetProfile');
    return getMockUser();
  }
};

export const apiUpdateProfile = async (profileData) => {
  if (USE_MOCK) return { ...getMockUser(), ...profileData };
  try {
    const response = await authFetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiUpdateProfile');
    return { ...getMockUser(), ...profileData };
  }
};


// ==========================================
// PRODUCT SERVICE
// ==========================================

export const apiFetchCategories = async () => {
  if (USE_MOCK) return mockCategories;
  try {
    const response = await authFetch(`${BASE_URL}/products/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiFetchCategories');
    return mockCategories;
  }
};

export const apiCreateCategory = async (categoryData) => {
  if (USE_MOCK) return { id: String(Date.now()), ...categoryData };
  try {
    const response = await authFetch(`${BASE_URL}/products/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    if (!response.ok) throw new Error('Failed to create category');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiCreateCategory');
    return { id: String(Date.now()), ...categoryData };
  }
};

export const apiFetchProducts = async () => {
  if (USE_MOCK) return mockProducts;
  try {
    const response = await authFetch(`${BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiFetchProducts');
    return mockProducts;
  }
};

export const apiFetchProductById = async (id) => {
  if (USE_MOCK) return mockProducts.find(p => p.id === id) || mockProducts[0];
  try {
    const response = await authFetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiFetchProductById');
    return mockProducts.find(p => p.id === id) || mockProducts[0];
  }
};

export const apiCreateProduct = async (formData) => {
  if (USE_MOCK) return mockProducts[0];
  try {
    const response = await authFetch(`${BASE_URL}/products`, {
      method: 'POST',
      body: formData, // FormData containing 'file' and metadata
    });
    if (!response.ok) throw new Error('Failed to create product');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiCreateProduct');
    return mockProducts[0];
  }
};

export const apiUpdateProduct = async (id, formData) => {
  if (USE_MOCK) return mockProducts.find(p => p.id === id) || mockProducts[0];
  try {
    const response = await authFetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: formData, // form fields via @ModelAttribute as per doc
    });
    if (!response.ok) throw new Error('Failed to update product');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiUpdateProduct');
    return mockProducts.find(p => p.id === id) || mockProducts[0];
  }
};

export const apiDeleteProduct = async (id) => {
  if (USE_MOCK) return { success: true };
  try {
    // Soft delete
    const response = await authFetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiDeleteProduct');
    return { success: true };
  }
};


// ==========================================
// INTERACTION SERVICE
// ==========================================

export const apiFetchMessages = async (participantId) => {
  if (USE_MOCK) return mockMessages;
  try {
    const response = await authFetch(`${BASE_URL}/interactions/messages?participantId=${participantId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiFetchMessages');
    return mockMessages;
  }
};

export const apiFetchNotifications = async () => {
  if (USE_MOCK) return mockNotifications;
  try {
    const response = await authFetch(`${BASE_URL}/interactions/notifications`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiFetchNotifications');
    return mockNotifications;
  }
};

export const apiCreateNotification = async (notificationData) => {
  if (USE_MOCK) return { id: String(Date.now()), ...notificationData, createdAt: new Date().toISOString(), read: false };
  try {
    const response = await authFetch(`${BASE_URL}/interactions/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return await response.json();
  } catch (error) {
    console.warn('API Fallback: apiCreateNotification');
    return { id: String(Date.now()), ...notificationData, createdAt: new Date().toISOString(), read: false };
  }
};

export const apiChatAssistant = async (message) => {
  if (USE_MOCK) return { 
    id: String(Date.now()), 
    senderId: 'assistant', 
    text: 'Đây là tin nhắn trả lời tự động từ H-Smart AI Assistant (Mock Mode). Tính năng này sẽ sớm được hoàn thiện với backend thật!', 
    createdAt: new Date().toISOString() 
  };
  try {
    const response = await authFetch(`${BASE_URL}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('Failed to communicate with assistant');
    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.warn('API Fallback: apiChatAssistant');
    return { 
      id: String(Date.now()), 
      senderId: 'assistant', 
      text: 'Đây là tin nhắn trả lời tự động từ H-Smart AI Assistant (Mock Mode). Tính năng này sẽ sớm được hoàn thiện với backend thật!', 
      createdAt: new Date().toISOString() 
    };
  }
};

// WebSocket setup helper
export const getWebSocketUrl = () => {
  const token = getToken();
  return `ws://localhost:8000/api/v1/interactions/ws${token ? `?token=${token}` : ''}`;
};
