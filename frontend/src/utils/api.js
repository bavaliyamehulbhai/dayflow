import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';
const CLIENT_VERSION = '1.0.0';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': CLIENT_VERSION,
  }
});

// Global 401 handler — uses custom event so AuthContext can react cleanly
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    // Don't trigger unauthorized flow for logout/login/register requests to avoid infinite loops
    const isAuthAction = url?.includes('/auth/logout') || 
                         url?.includes('/auth/login') || 
                         url?.includes('/auth/register');

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
  updateDashboardLayout: (layout) => api.put('/auth/preferences/layout', { layout })
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkDelete: (ids) => api.post('/tasks/bulk/delete', { ids }),
  bulkStatus: (ids, status) => api.post('/tasks/bulk/status', { ids, status }),
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
  stats: (id) => api.get(`/habits/${id}/stats`)
};

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const scheduleAPI = {
  getAll: (params) => api.get('/schedule', { params }),
  create: (data) => api.post('/schedule', data),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
  toggleComplete: (id) => api.patch(`/schedule/${id}/complete`)
};

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
export const pomodoroAPI = {
  getAll: (params) => api.get('/pomodoro', { params }),
  start: (data) => api.post('/pomodoro/start', data),
  complete: (id, data) => api.patch(`/pomodoro/${id}/complete`, data),
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
  get: () => api.get('/dashboard'),
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

// ─── Google Calendar ──────────────────────────────────────────────────────────
export const googleAPI = {
  getAuthUrl: () => api.get('/google/auth'),
  getEvents: () => api.get('/google/events'),
  disconnect: () => api.delete('/google/disconnect')
};

