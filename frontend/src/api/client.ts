import axios from 'axios';

const api = axios.create({
  baseURL: 'https://dacosta-inventory.onrender.com/api',
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

