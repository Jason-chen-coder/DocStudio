'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, setToken, clearToken, User, RegisterData, LoginData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 页面加载时检查登录状态
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authAPI.getMe();
      setUser(user);
    } catch (error) {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(data: LoginData) {
    const response = await authAPI.login(data);
    setToken(response.access_token);
    setUser(response.user);
    router.push('/dashboard');
  }

  async function register(data: RegisterData) {
    const response = await authAPI.register(data);
    setToken(response.access_token);
    setUser(response.user);
    router.push('/dashboard');
  }

  function logout() {
    clearToken();
    setUser(null);
    router.push('/auth/login');
  }

  function updateUser(newUser: User) {
    setUser(newUser);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
