/**
 * API client for Gestion de Caisse backend.
 * REACT_APP_API_URL must point to your PHP API (see frontend/.env).
 * Example: http://localhost/Projet%20de%20stage/backend/api
 */
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || '';
if (!baseURL && process.env.NODE_ENV === 'development') {
  console.warn('REACT_APP_API_URL is not set. Login will 404. Add it in frontend/.env');
}

function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token || '';
  } catch {
    return '';
  }
}

const api = axios.create({
  baseURL: baseURL || '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If the request data is FormData, let axios handle Content-Type
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']; // Let axios set it to multipart/form-data
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('unauthorized'));
    }
    const msg = err.response?.data?.message || err.message || 'Erreur réseau';
    return Promise.reject({ message: msg, status, data: err.response?.data });
  }
);

export const auth = {
  login: (username, password) => api.post('/login', { username, password }),
  register: (data) => api.post('/register', data),
  me: () => api.get('/me'),
};

export const operations = {
  list: (params) => api.get('/operations', { params }),
  get: (id) => api.get(`/operations/${id}`),
  create: (data) => api.post('/operations', data),
  update: (id, data) => api.put(`/operations/${id}`, data),
  updateWithDocument: (id, data) => api.post(`/operations/${id}?_method=PUT`, data), // Use POST with _method=PUT for file upload
  delete: (id) => api.delete(`/operations/${id}`),
};

export const balance = {
  get: (params) => api.get('/balance', { params }),
  stats: (params) => api.get('/balance/stats', { params }),
};

export const caisses = {
  list: () => api.get('/caisses'),
  create: (data) => api.post('/caisses', data),
};

export const motifs = {
  list: (type) => api.get('/motifs', { params: type ? { type } : {} }),
  create: (data) => api.post('/motifs', data),
};

export const users = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
