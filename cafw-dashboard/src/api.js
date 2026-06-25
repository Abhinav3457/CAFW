import axios from 'axios';

// In production, set VITE_API_URL to your Render backend URL (e.g. https://cafw-k3d1.onrender.com)
// In local dev, it falls back to http://localhost:8000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
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
