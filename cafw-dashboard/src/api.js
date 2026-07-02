import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED') console.error('Request timed out');
    else if (!err.response) console.error('Network error — is the backend running?');
    return Promise.reject(err);
  }
);

export const getStats           = () => api.get('/api/dashboard/stats').then(r => r.data);
export const getRecentAttacks   = () => api.get('/api/dashboard/recent-attacks').then(r => r.data);
export const getCategoryBreakdown = () => api.get('/api/dashboard/category-breakdown').then(r => r.data);
export const getTopAttackers    = () => api.get('/api/dashboard/top-attackers').then(r => r.data);
export const getLast7Days       = () => api.get('/api/dashboard/last-7-days').then(r => r.data);
export const getLogs            = (p) => api.get('/api/logs', { params: p }).then(r => r.data);
export const getLogsCount       = (p) => api.get('/api/logs/count', { params: p }).then(r => r.data);
export const getRules           = () => api.get('/api/rules').then(r => r.data);
export const toggleRule         = (id, v) => api.patch(`/api/rules/${id}`, { is_active: v }).then(r => r.data);
