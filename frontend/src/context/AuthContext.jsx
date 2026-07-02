import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Configure auth header
  if (token) {
    setAuthToken(token);
  } else {
    setAuthToken(null);
  }

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Failed to restore auth state', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);
      setAuthToken(receivedToken);
      return receivedUser;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const response = await api.post('/api/auth/change-password', { oldPassword, newPassword });
      
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Password update failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    changePassword,
    logout,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
