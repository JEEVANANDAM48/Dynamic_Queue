import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

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
        if (res.data.success) {
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
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const userData = res.data.data;
      await AsyncStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password, role: 'CUSTOMER' });
    if (res.data.success) {
      const userData = res.data.data;
      await AsyncStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};
