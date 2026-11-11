import { create } from 'zustand';
import type { AuthUser } from '../api/endpoints';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const getInitialToken = (): string | null => {
  try {
    return localStorage.getItem('bb_auth_token');
  } catch {
    return null;
  }
};

const getInitialUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('bb_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),

  setAuth: (token: string, user: AuthUser) => {
    try {
      localStorage.setItem('bb_auth_token', token);
      localStorage.setItem('bb_auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem('bb_auth_token');
      localStorage.removeItem('bb_auth_user');
    } catch {
      // ignore
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

