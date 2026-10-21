import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: (data: { email: string; full_name?: string; avatar?: string; id_token?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updated: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('nexora_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      api.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('nexora_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('nexora_auth_expired', handleAuthExpired);
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    api.setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    api.setToken(res.access_token);
    setUser(res.user);
  };

  const loginWithGoogle = async (data: { email: string; full_name?: string; avatar?: string; id_token?: string }) => {
    const res = await api.googleAuth(data);
    api.setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
