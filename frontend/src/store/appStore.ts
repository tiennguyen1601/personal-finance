import { create } from 'zustand';
import type { Category } from '../types';

interface AppState {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
}));
