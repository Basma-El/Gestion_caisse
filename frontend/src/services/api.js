import axios from 'axios';

// Laravel API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Attach token automatically if exists
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const parsed = JSON.parse(user);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});


// ================= AUTH =================
export const auth = {
  login: async (username, password) => {
    try {
      const response = await api.post('/login', {
        username,
        password
      });

      return {
        success: true,
        data: response.data.user,
        message: response.data.message
      };

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }
};


// ================= OPERATIONS =================
export const operations = {
  list: async (params = {}) => {
    try {
      const response = await api.get('/operations', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  create: async (operationData) => {
    try {
      const response = await api.post('/operations', operationData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  update: async (id, operationData) => {
    try {
      const response = await api.put(`/operations/${id}`, operationData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/operations/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
};


// ================= BALANCE =================
export const balance = {
  get: async () => {
    try {
      const response = await api.get('/balance');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
};


// ================= MOTIFS =================
export const motifs = {
  list: async (type) => {
    try {
      const response = await api.get('/motifs', { params: { type } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  create: async (motifData) => {
    try {
      const response = await api.post('/motifs', motifData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
};

export default api;
