import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getStats() {
  return api.get('/api/dashboard/stats').then(res => res.data);
}

export function getRecentAttacks() {
  return api.get('/api/dashboard/recent-attacks').then(res => res.data);
}

export function getCategoryBreakdown() {
  return api.get('/api/dashboard/category-breakdown').then(res => res.data);
}

export function getTopAttackers() {
  return api.get('/api/dashboard/top-attackers').then(res => res.data);
}

export function getLast7Days() {
  return api.get('/api/dashboard/last-7-days').then(res => res.data);
}

export function getLogs(params = {}) {
  return api.get('/api/logs', { params }).then(res => res.data);
}

export function getLogsCount() {
  return api.get('/api/logs/count').then(res => res.data);
}

export function getRules() {
  return api.get('/api/rules').then(res => res.data);
}

export function toggleRule(id, is_active) {
  return api.patch(`/api/rules/${id}`, { is_active }).then(res => res.data);
}

export default api;
