import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data.data);
        } else {
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (e) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', {
        email: (email || '').trim().toLowerCase(),
        password
      });

      if (res.data && res.data.success) {
        const userData = res.data.data;
        await AsyncStorage.setItem('token', userData.token);
        setUser(userData);
        return userData;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', {
        name: (name || '').trim(),
        email: (email || '').trim().toLowerCase(),
        password,
        role: 'CUSTOMER'
      });

      if (res.data && res.data.success) {
        const userData = res.data.data;
        await AsyncStorage.setItem('token', userData.token);
        setUser(userData);
        return userData;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
    } catch (e) {}
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};
