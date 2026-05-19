import { create } from 'zustand';

interface AuthState {
  token: string | null;
  fullName: string;
  email: string;
  login: (token: string, fullName: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  fullName: localStorage.getItem('fullName') ?? '',
  email: localStorage.getItem('email') ?? '',
  login: (token, fullName, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('fullName', fullName);
    localStorage.setItem('email', email);
    set({ token, fullName, email });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('email');
    set({ token: null, fullName: '', email: '' });
  },
  isAuthenticated: () => !!get().token,
}));
