import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to load user session', err);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const userData = res.data.data;
      localStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async ({ name, email, password, role }) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const userData = res.data.data;
      localStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkLoggedInUser }}>
      {children}
    </AuthContext.Provider>
  );
};
