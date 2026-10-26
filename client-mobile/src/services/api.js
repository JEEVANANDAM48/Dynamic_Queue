import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Normalizes and resolves the API base URL for Expo Customer App
 * - Prioritizes EXPO_PUBLIC_API_URL
 * - In production/standalone builds, defaults to live Render backend
 * - Strips trailing slashes and normalizes /api prefix
 */
const resolveApiUrl = () => {
  let envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!envUrl) {
    if (__DEV__ && Platform.OS !== 'web') {
      const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoClient?.hostUri;
      if (hostUri) {
        const ip = hostUri.split(':')[0];
        envUrl = `http://${ip}:5000/api`;
      }
    }
  }

  // Deployed production default
  if (!envUrl || (!__DEV__ && envUrl.includes('localhost'))) {
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
console.log('[Mobile API Base URL]', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Attach JWT Bearer token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API Interceptor] Failed to retrieve token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiry safely
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;
