import api from './api';

export const issueService = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),

  // Metadata
  getDepartments: () => api.get('/users/meta/departments'),
  getWards: () => api.get('/users/meta/wards'),
  getCategories: () => api.get('/users/meta/categories'),

  // Users (Admin)
  getUsers: (params) => api.get('/users', { params }),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Issues CRUD
  getIssues: (params) => api.get('/issues', { params }),
  getIssueById: (id) => api.get(`/issues/${id}`),
  createIssue: (formData) => api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateIssue: (id, data) => api.put(`/issues/${id}`, data),
  deleteIssue: (id) => api.delete(`/issues/${id}`),

  // Workflows
  assignIssue: (id, data) => api.post(`/issues/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/issues/${id}/status`, data),
  resolveIssue: (id, formData) => api.post(`/issues/${id}/resolution`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  referIssue: (id, data) => api.post(`/issues/${id}/refer`, data),
  submitFeedback: (id, data) => api.post(`/issues/${id}/feedback`, data),
  getHistory: (id) => api.get(`/issues/${id}/history`),

  // GIS
  getGisIssues: (params) => api.get('/gis/issues', { params }),
  getHeatmapData: (params) => api.get('/gis/heatmap', { params }),

  // Dashboard & Analytics
  getStats: () => api.get('/dashboard/stats'),
  getAnalytics: () => api.get('/dashboard/analytics'),

  // Reports, Audit & Notifications
  exportCsvUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/reports/issues.csv${query ? '?' + query : ''}`;
  },
  getAuditLogs: (params) => api.get('/audit-logs', { params }),
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/read-all'),

  // Helper to format image URLs in dev vs production
  getImageUrl: (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}${url.startsWith('/') ? url : '/' + url}`;
  },

  // Reverse Geocoding via Nominatim
  reverseGeocode: async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'GIS-Civic-Platform-College-Project/1.0'
          }
        }
      );
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch (err) {
      console.warn('Reverse geocoding error:', err.message);
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  }
};

export default issueService;
