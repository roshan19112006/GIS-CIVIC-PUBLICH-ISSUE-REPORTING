import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '';
const cleanBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const api = axios.create({
  baseURL: cleanBase ? `${cleanBase}/api` : '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and has token, clear session
      if (localStorage.getItem('civic_token') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('civic_token');
        localStorage.removeItem('civic_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
