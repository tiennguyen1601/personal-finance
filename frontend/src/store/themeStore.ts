import { create } from 'zustand';

export type Skin = 'manga' | 'anime';
export type Mode = 'light' | 'dark';

const SKIN_KEY = 'app-skin';
const MODE_KEY = 'app-mode';

function readSkin(): Skin {
  const v = localStorage.getItem(SKIN_KEY);
  return v === 'manga' || v === 'anime' ? v : 'anime'; // mặc định Anime
}
function readMode(): Mode {
  const v = localStorage.getItem(MODE_KEY);
  return v === 'light' || v === 'dark' ? v : 'dark'; // mặc định Tối
}

/** Gắn data-skin và data-mode lên <html>. */
export function applyTheme(skin: Skin, mode: Mode) {
  const root = document.documentElement;
  root.setAttribute('data-skin', skin);
  root.setAttribute('data-mode', mode);
}

interface ThemeState {
  skin: Skin;
  mode: Mode;
  setSkin: (s: Skin) => void;
  setMode: (m: Mode) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  skin: readSkin(),
  mode: readMode(),
  setSkin: (s) => {
    localStorage.setItem(SKIN_KEY, s);
    applyTheme(s, get().mode);
    set({ skin: s });
  },
  setMode: (m) => {
    localStorage.setItem(MODE_KEY, m);
    applyTheme(get().skin, m);
    set({ mode: m });
  },
}));
