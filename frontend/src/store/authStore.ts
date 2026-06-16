import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthState {
  token: string | null; // Firebase uid
  fullName: string;
  email: string;
  authReady: boolean; // đã biết trạng thái đăng nhập ban đầu từ Firebase chưa
  login: (token: string, fullName: string, email: string) => void;
  logout: () => void;
  setReady: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  fullName: '',
  email: '',
  authReady: false,
  login: (token, fullName, email) => set({ token, fullName, email }),
  logout: () => {
    void signOut(auth);
    set({ token: null, fullName: '', email: '' });
  },
  setReady: () => set({ authReady: true }),
  isAuthenticated: () => !!get().token,
}));
