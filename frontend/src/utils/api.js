import axios from 'axios';
import { safeToLocalISO } from './dateUtils';

const API_BASE = process.env.REACT_APP_API_URL || '/api';
const CLIENT_VERSION = '1.0.0';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s timeout prevents requests from hanging or freezing the UI indefinitely
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': CLIENT_VERSION,
  }
});

// Global request interceptor — automatically synchronizes clientDate
api.interceptors.request.use(
  config => {
    try {
      const localToday = safeToLocalISO(new Date());
      config.headers['X-Client-Date'] = localToday;
      const method = config.method?.toLowerCase();
      if (['post', 'put', 'patch'].includes(method)) {
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
          if (!config.data.clientDate) {
            config.data.clientDate = localToday;
          }
        }
      }
    } catch {
      // safe fallback
    }
    return config;
  },
  error => Promise.reject(error)
);

// Global 401 handler — uses custom event so AuthContext can react cleanly
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    // Don't trigger unauthorized flow for logout/login/register/me requests to avoid infinite loops
    const isAuthAction = url?.includes('/auth/logout') || 
                         url?.includes('/auth/login') || 
                         url?.includes('/auth/register') ||
                         url?.includes('/auth/me');

    if (status === 401 && !isAuthAction) {
      // Dispatch event so AuthContext can clear user state without hard reload
      window.dispatchEvent(new CustomEvent('dayflow:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  completeOnboarding: () => api.put('/auth/onboarding'),
  changePassword: (data) => api.put('/auth/password', data),
  getSecurityHistory: () => api.get('/auth/security-history'),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),
  revokeAllSessions: () => api.delete('/auth/sessions/revoke/all'),
  exportData: () => api.get('/auth/export', { responseType: 'blob' }),
  deleteAccount: () => api.delete('/auth/account'),
  updateDashboardLayout: (layout) => api.put('/auth/preferences/layout', { layout }),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (password) => api.post('/auth/2fa/disable', { password }),
  login2FA: (data) => api.post('/auth/2fa/login', data),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkDelete: (ids) => api.post('/tasks/bulk/delete', { ids }),
  bulkStatus: (ids, status, clientDate) => api.post('/tasks/bulk/status', { ids, status, clientDate }),
  toggleSubtask: (taskId, subtaskId) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`),
  stats: () => api.get('/tasks/stats/summary')
};

// ─── Habits ───────────────────────────────────────────────────────────────────
export const habitsAPI = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  complete: (id, data) => api.post(`/habits/${id}/complete`, data),
  reorder: (habitIds) => api.put('/habits/reorder', { habitIds }),
  stats: (id) => api.get(`/habits/${id}/stats`)
};

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const scheduleAPI = {
  getAll: (params) => api.get('/schedule', { params }),
  create: (data) => api.post('/schedule', data),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
  toggleComplete: (id, data) => {
    const payload = (typeof id === 'object' && id !== null && id.id) ? id : data;
    const targetId = (typeof id === 'object' && id !== null && id.id) ? id.id : id;
    return api.patch(`/schedule/${targetId}/complete`, payload);
  }
};

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
export const pomodoroAPI = {
  getAll: (params) => api.get('/pomodoro', { params }),
  start: (data) => api.post('/pomodoro/start', data),
  record: (data) => api.post('/pomodoro/record', data),
  complete: (id, data) => api.patch(`/pomodoro/${id}/complete`, data),
  delete: (id) => api.delete(`/pomodoro/${id}`),
  stats: (params) => api.get('/pomodoro/stats', { params })
};

// ─── Notes ────────────────────────────────────────────────────────────────────
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  pin: (id) => api.patch(`/notes/${id}/pin`),
  archive: (id) => api.patch(`/notes/${id}/archive`)
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: (params) => api.get('/dashboard', { params }),
  getActivity12m: () => api.get('/dashboard/activity/12m').then(r => ({ data: { activity: r.data.logs, analytics: r.data.analytics } }))
};

// ─── Badges ───────────────────────────────────────────────────────────────────
export const badgesAPI = {
  get: () => api.get('/badges'),
  check: () => api.post('/badges/check')
};

// ─── AI Coach ─────────────────────────────────────────────────────────────────
export const aiAPI = {
  getCoach: () => api.get('/ai/coach')
};


