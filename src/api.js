const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Company API
export const companyApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/companies`);
    return handleResponse(response);
  },

  create: async (company) => {
    const response = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/companies/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Category API
export const categoryApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/categories`);
    return handleResponse(response);
  },

  create: async (category) => {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Transaction API
export const transactionApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/transactions`);
    return handleResponse(response);
  },

  create: async (transaction) => {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
