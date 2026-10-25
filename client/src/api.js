const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('washflow_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('washflow_token', token);
  } else {
    localStorage.removeItem('washflow_token');
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error occurred');
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Dealers / Carwash Settings
  getDealers: () => request('/dealers'),
  getDealer: (id) => request(`/dealers/${id}`),
  updateDealer: (id, body) => request(`/dealers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getServices: (dealerId) => request(`/dealers/${dealerId}/services`),

  // Washes
  getWashes: (dealerId, status = '') => request(`/washes?dealer_id=${dealerId}${status ? `&status=${status}` : ''}`),
  getWash: (id) => request(`/washes/${id}`),
  checkinWash: (body) => request('/washes/checkin', { method: 'POST', body: JSON.stringify(body) }),
  updateWashStatus: (id, status, afterPhoto = null) => 
    request(`/washes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, after_photo: afterPhoto }) }),
  updateWashDetails: (id, body) =>
    request(`/washes/${id}/details`, { method: 'PATCH', body: JSON.stringify(body) }),
  archiveWash: (id) =>
    request(`/washes/${id}/archive`, { method: 'POST' }),
  clearAllDelivered: (dealerId) =>
    request('/washes/clear-delivered', { method: 'POST', body: JSON.stringify({ dealer_id: dealerId }) }),
  updateInspection: (id, body) => request(`/washes/${id}/inspection`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Customers
  getCustomers: (dealerId) => request(`/customers?dealer_id=${dealerId}`),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  addVehicle: (customerId, body) => request(`/customers/${customerId}/vehicles`, { method: 'POST', body: JSON.stringify(body) }),
  updateSubscription: (customerId, body) => request(`/customers/${customerId}/subscription`, { method: 'PATCH', body: JSON.stringify(body) }),
  lookupCustomer: (query, dealerId) => request(`/customers/lookup?query=${encodeURIComponent(query)}${dealerId ? `&dealer_id=${dealerId}` : ''}`),

  // Invoices
  getInvoices: (dealerId, status = '') => request(`/invoices?dealer_id=${dealerId}${status ? `&status=${status}` : ''}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  payInvoice: (id, paymentMethod = 'Card') => request(`/invoices/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ payment_method: paymentMethod }) }),
  sendInvoiceWhatsApp: (id) => request(`/invoices/${id}/send-whatsapp`, { method: 'POST' }),

  // WhatsApp Logs & Simulation
  getWhatsAppLogs: (dealerId) => request(`/whatsapp/logs?dealer_id=${dealerId}`),
  sendWhatsAppMessage: (body) => request('/whatsapp/send', { method: 'POST', body: JSON.stringify(body) }),

  // Super Admin Platform Master
  getAdminStats: () => request('/admin/stats'),
  getAdminFacilities: () => request('/admin/facilities'),
  updateFacilitySubscription: (id, body) => request(`/admin/facilities/${id}/subscription`, { method: 'PATCH', body: JSON.stringify(body) }),
  impersonateFacility: (dealerId) => request(`/admin/impersonate/${dealerId}`, { method: 'POST' }),
  deleteFacility: (id) => request(`/admin/facilities/${id}`, { method: 'DELETE' })
};
