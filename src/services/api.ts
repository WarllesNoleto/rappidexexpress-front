import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:3000/api';

function normalizeApiUrl(rawUrl?: string) {
  if (!rawUrl) return DEFAULT_API_URL;

  const trimmedUrl = rawUrl.trim().replace(/\/+$/, '');

  return /\/api$/i.test(trimmedUrl) ? trimmedUrl : `${trimmedUrl}/api`;
}

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
});

export default api;
