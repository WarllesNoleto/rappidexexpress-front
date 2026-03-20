import axios from 'axios';

export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
});

export default api;
