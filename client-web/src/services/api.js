import axios from 'axios';

/**
 * Robust API Base URL Resolver
 * - Handles both http://... and https://...
 * - Gracefully appends /api if omitted in Vercel environment variables
 * - Safeguards against deployed Vercel frontend falling back to localhost
 */
const resolveApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;

  const isBrowser = typeof window !== 'undefined';
  const isDeployedHost = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (!envUrl || (isDeployedHost && envUrl.includes('localhost'))) {
    envUrl = 'https://dynamic-queue-r6bt.onrender.com/api';
  }

  // Strip trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');

  // Normalize /api suffix
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }

  return envUrl;
};

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Add bearer token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors and expired auth tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Token expired or invalid
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // If not already on login page, redirect smoothly
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
