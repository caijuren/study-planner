import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { User, AuthState, LoginCredentials, ChildLoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  childLogin: (credentials: ChildLoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  addChild: (child: { name: string; pin: string; avatar: string }) => Promise<void>;
  switchUser: (user: User) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'auth_state';

function getStoredAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse auth state from localStorage', e);
  }
  return { user: null, token: null, isAuthenticated: false };
}

function saveAuthState(state: AuthState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.token) {
    localStorage.setItem('auth_token', state.token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(getStoredAuthState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    saveAuthState(state);
  }, [state]);

  const redirectByRole = useCallback((user: User) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login' && from !== '/register') {
      navigate(from, { replace: true });
      return;
    }
    if (user.role === 'parent') {
      navigate('/parent', { replace: true });
    } else {
      navigate('/child', { replace: true });
    }
  }, [navigate, location]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const { user, token } = response.data;
      setState({ user, token, isAuthenticated: true });
      redirectByRole(user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [redirectByRole]);

  const childLogin = useCallback(async (credentials: ChildLoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/child-login', credentials);
      const { user, token } = response.data;
      setState({ user, token, isAuthenticated: true });
      redirectByRole(user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [redirectByRole]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      const { user, token } = response.data;
      setState({ user, token, isAuthenticated: true });
      redirectByRole(user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [redirectByRole]);

  const logout = useCallback(() => {
    setState({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('auth_token');
    navigate('/login', { replace: true });
  }, [navigate]);

  const addChild = useCallback(async (child: { name: string; pin: string; avatar: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/add-child', child);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, user }));
    redirectByRole(user);
  }, [redirectByRole]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        childLogin,
        register,
        logout,
        addChild,
        switchUser,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
