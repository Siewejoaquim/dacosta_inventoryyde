import axios from 'axios';

// In development, Vite proxies /api → http://localhost:4000
// In production, VITE_API_URL points to the deployed backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dacosta_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
