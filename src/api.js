// Determine API base URL based on environment
// In production on Railway, use relative path (same origin)
// In development with Vite proxy, use relative path
// If VITE_API_URL is explicitly set, use that
function getApiBase() {
  // Check for explicitly configured API URL (for separate frontend/backend deployments)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, if we're on a Railway domain, use relative path
  // The Express server serves both frontend and API from the same origin
  if (import.meta.env.PROD) {
    return '/api';
  }

  // In development, Vite proxy handles /api -> localhost:3001
  return '/api';
}

const API_BASE = getApiBase();

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Auth API
export const authApi = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  status: async () => {
    const response = await fetch(`${API_BASE}/auth/status`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Company API
export const companyApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/companies`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (company) => {
    const response = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(company),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Category API
export const categoryApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/categories`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (category) => {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(category),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Transaction API
export const transactionApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/transactions`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (transaction) => {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transaction),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Exchange Rate API
export const exchangeRateApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/exchange-rates`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  upsert: async (fromCurrency, toCurrency, rate) => {
    const response = await fetch(`${API_BASE}/exchange-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fromCurrency, toCurrency, rate }),
    });
    return handleResponse(response);
  },

  bulkUpsert: async (rates) => {
    const response = await fetch(`${API_BASE}/exchange-rates/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rates }),
    });
    return handleResponse(response);
  },

  refresh: async () => {
    const response = await fetch(`${API_BASE}/exchange-rates/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Settings API
export const settingsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/settings`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  update: async (settings) => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },

  set: async (key, value) => {
    const response = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value }),
    });
    return handleResponse(response);
  },
};

// Currency API
export const currencyApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/currencies`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (currency) => {
    const response = await fetch(`${API_BASE}/currencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(currency),
    });
    return handleResponse(response);
  },

  update: async (code, data) => {
    const response = await fetch(`${API_BASE}/currencies/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (code) => {
    const response = await fetch(`${API_BASE}/currencies/${code}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  setDefault: async (code) => {
    const response = await fetch(`${API_BASE}/currencies/${code}/set-default`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Recurring Template API
export const recurringTemplateApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/recurring-templates`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${id}`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (template) => {
    const response = await fetch(`${API_BASE}/recurring-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(template),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  pause: async (id) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${id}/pause`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  resume: async (id) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${id}/resume`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  skip: async (templateId, transactionId) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${templateId}/skip/${transactionId}`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  generate: async () => {
    const response = await fetch(`${API_BASE}/recurring-templates/generate`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getTransactions: async (id) => {
    const response = await fetch(`${API_BASE}/recurring-templates/${id}/transactions`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};
