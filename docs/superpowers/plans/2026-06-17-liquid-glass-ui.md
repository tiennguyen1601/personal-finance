# Liquid Glass UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay diện mạo phẳng hiện tại bằng phong cách liquid glass (glassmorphism) hiện đại, hỗ trợ light + dark mode (system/light/dark), responsive, nhiều hiệu ứng chuyển động.

**Architecture:** Hệ design-token bằng CSS thuần trong `index.css` (biến cho 2 theme) + class kính tái sử dụng (`.glass-card`, `.glass-btn`, `.glass-input`…) + animation utilities. Một `themeStore` (Zustand) gắn `data-theme` lên `<html>`, persist localStorage. Các component chuyển từ style inline (màu hardcode) sang class kính. Không thêm dependency mới.

**Tech Stack:** React 18, TypeScript, Vite, Zustand (đã có), CSS custom properties + `backdrop-filter`.

**Lưu ý kiểm chứng:** Đây là thay đổi lớp trình bày. Mỗi task verify bằng: (a) `npm run build` trong `frontend/` pass không lỗi TS; (b) xem trực quan trên dev server (`npm run dev`, mở http://localhost:5173). Không có unit test cho CSS.

**Quy ước commit:** chạy lệnh trong thư mục `frontend/` trừ khi nói khác. Build: `npm run build`. Dev: `npm run dev`.

---

## Task 1: Theme store + khởi tạo sớm

**Files:**
- Create: `frontend/src/store/themeStore.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Tạo themeStore**

Tạo `frontend/src/store/themeStore.ts`:

```ts
import { create } from 'zustand';

export type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readStored(): Theme {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

/** Gắn/gỡ data-theme trên <html> theo lựa chọn. system => gỡ thuộc tính. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStored(),
  setTheme: (t) => {
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    set({ theme: t });
  },
  cycleTheme: () => {
    const order: Theme[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(get().theme) + 1) % order.length];
    get().setTheme(next);
  },
}));
```

- [ ] **Step 2: Khởi tạo theme sớm trong main.tsx**

Trong `frontend/src/main.tsx`, thêm import và gọi `applyTheme` trước khi render (sau dòng `import './index.css';`):

```ts
import { applyTheme, useThemeStore } from './store/themeStore';

// Áp theme đã lưu trước khi render để tránh nháy theme khi tải lại.
applyTheme(useThemeStore.getState().theme);
```

- [ ] **Step 3: Build kiểm tra**

Run: `npm run build`
Expected: PASS, không lỗi TypeScript.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/store/themeStore.ts frontend/src/main.tsx
git commit -m "feat(ui): add theme store with system/light/dark + early apply"
```

---

## Task 2: Design tokens 2 theme + nền aurora trong index.css

**Files:**
- Modify: `frontend/src/index.css` (thay phần `:root`, block dark, body, `.app-layout`)

- [ ] **Step 1: Thay block `:root` và dark mode bằng hệ token glass**

Trong `frontend/src/index.css`, thay toàn bộ block `:root { ... }` (dòng 1–31) và block `@media (prefers-color-scheme: dark) { :root {...} }` (dòng 33–51) bằng:

```css
:root {
  /* Light theme tokens */
  --text: #4b5563;
  --text-muted: #94a3b8;
  --text-strong: #0f172a;

  --accent: #7c3aed;
  --accent-2: #2563eb;
  --accent-grad: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);

  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-bg-strong: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.6);
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.12), 0 2px 8px rgba(31, 38, 135, 0.06);
  --blur: 18px;

  --income: #16a34a;
  --expense: #dc2626;
  --saving: #7c3aed;
  --balance: #2563eb;

  --radius: 18px;
  --radius-sm: 12px;

  --page-bg: #eef1f9;
  --blob-1: rgba(124, 58, 237, 0.45);
  --blob-2: rgba(37, 99, 235, 0.40);
  --blob-3: rgba(236, 72, 153, 0.32);

  --sidebar-bg: rgba(30, 41, 59, 0.72);
  --sidebar-text: #e2e8f0;
  --sidebar-muted: #94a3b8;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  font: 16px/1.5 var(--sans);
  color: var(--text);
  color-scheme: light dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

:root[data-theme='dark'],
:root:not([data-theme]) {
  /* defaults stay light unless system prefers dark — handled below */
}

/* Dark via explicit toggle */
:root[data-theme='dark'] {
  --text: #cbd5e1;
  --text-muted: #94a3b8;
  --text-strong: #f1f5f9;

  --accent: #c084fc;
  --accent-2: #60a5fa;
  --accent-grad: linear-gradient(135deg, #c084fc 0%, #60a5fa 100%);

  --glass-bg: rgba(30, 32, 48, 0.55);
  --glass-bg-strong: rgba(30, 32, 48, 0.78);
  --glass-border: rgba(148, 163, 184, 0.22);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.30);
  --blur: 18px;

  --income: #4ade80;
  --expense: #f87171;
  --saving: #c084fc;
  --balance: #60a5fa;

  --page-bg: #0b1020;
  --blob-1: rgba(124, 58, 237, 0.55);
  --blob-2: rgba(37, 99, 235, 0.50);
  --blob-3: rgba(236, 72, 153, 0.38);

  --sidebar-bg: rgba(15, 18, 32, 0.70);
  --sidebar-text: #e2e8f0;
  --sidebar-muted: #94a3b8;
}

/* Dark via system preference (only when user has NOT chosen explicitly) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --text: #cbd5e1;
    --text-muted: #94a3b8;
    --text-strong: #f1f5f9;
    --accent: #c084fc;
    --accent-2: #60a5fa;
    --accent-grad: linear-gradient(135deg, #c084fc 0%, #60a5fa 100%);
    --glass-bg: rgba(30, 32, 48, 0.55);
    --glass-bg-strong: rgba(30, 32, 48, 0.78);
    --glass-border: rgba(148, 163, 184, 0.22);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.30);
    --income: #4ade80;
    --expense: #f87171;
    --saving: #c084fc;
    --balance: #60a5fa;
    --page-bg: #0b1020;
    --blob-1: rgba(124, 58, 237, 0.55);
    --blob-2: rgba(37, 99, 235, 0.50);
    --blob-3: rgba(236, 72, 153, 0.38);
    --sidebar-bg: rgba(15, 18, 32, 0.70);
  }
}
```

- [ ] **Step 2: Cập nhật body + `.app-layout` cho nền gradient**

Trong `index.css`, đổi block `body` thành:

```css
body {
  margin: 0;
  background: var(--page-bg);
  color: var(--text);
  min-height: 100vh;
}
```

Và đổi block `.app-layout` (hiện `background: #f1f5f9;`) thành:

```css
.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  background: var(--page-bg);
}
```

- [ ] **Step 3: Build kiểm tra**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(ui): glass design tokens for light/dark + gradient page bg"
```

---

## Task 3: Nền aurora động + class kính + animation utilities

**Files:**
- Modify: `frontend/src/index.css` (thêm phần mới vào cuối file)

- [ ] **Step 1: Thêm nền aurora, class kính, animation vào cuối index.css**

Thêm vào cuối `frontend/src/index.css`:

```css
/* ===== AURORA BACKGROUND ===== */
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.aurora span {
  position: absolute;
  display: block;
  width: 45vmax;
  height: 45vmax;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.85;
}
.aurora .b1 { background: var(--blob-1); top: -10vmax; left: -8vmax; animation: drift1 22s ease-in-out infinite; }
.aurora .b2 { background: var(--blob-2); bottom: -12vmax; right: -6vmax; animation: drift2 26s ease-in-out infinite; }
.aurora .b3 { background: var(--blob-3); top: 30vmax; left: 40vw; animation: drift3 30s ease-in-out infinite; }

@keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(8vmax,6vmax) scale(1.15); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-7vmax,-5vmax) scale(1.1); } }
@keyframes drift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-6vmax,4vmax) scale(1.2); } }

/* ===== GLASS SURFACES ===== */
.glass-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--blur));
  backdrop-filter: blur(var(--blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: var(--glass-shadow);
}
.glass-card.interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.glass-card.interactive:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 14px 40px rgba(31, 38, 135, 0.22);
}

/* ===== BUTTONS ===== */
.glass-btn {
  font: inherit;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 10px 18px;
  cursor: pointer;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-strong);
  color: var(--text-strong);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
}
.glass-btn:hover { transform: translateY(-2px); box-shadow: var(--glass-shadow); }
.glass-btn:active { transform: translateY(0); }
.glass-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.glass-btn-primary {
  background: var(--accent-grad);
  color: #fff;
  border: none;
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
}
.glass-btn-primary:hover { filter: brightness(1.08); box-shadow: 0 10px 28px rgba(124, 58, 237, 0.5); }
.glass-btn-danger { background: rgba(220, 38, 38, 0.9); color: #fff; border: none; }
.glass-btn-danger:hover { filter: brightness(1.08); }

/* ===== INPUTS ===== */
.glass-input, .glass-select {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-strong);
  color: var(--text-strong);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.glass-input:focus, .glass-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg, rgba(124, 58, 237, 0.25));
}
.glass-input::placeholder { color: var(--text-muted); }

/* ===== CHIPS / BADGES ===== */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
}

/* ===== ANIMATIONS ===== */
@media (prefers-reduced-motion: no-preference) {
  .fade-in { animation: fadeIn 0.5s ease both; }
  .fade-in-up { animation: fadeInUp 0.5s ease both; }
  .stagger > * { animation: fadeInUp 0.5s ease both; }
  .stagger > *:nth-child(1) { animation-delay: 0.05s; }
  .stagger > *:nth-child(2) { animation-delay: 0.12s; }
  .stagger > *:nth-child(3) { animation-delay: 0.19s; }
  .stagger > *:nth-child(4) { animation-delay: 0.26s; }
  .stagger > *:nth-child(5) { animation-delay: 0.33s; }
  .stagger > *:nth-child(6) { animation-delay: 0.40s; }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
```

- [ ] **Step 2: Build kiểm tra**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(ui): aurora background, glass classes, animation utilities"
```

---

## Task 4: AppLayout — gắn nền aurora + loading kính

**Files:**
- Modify: `frontend/src/components/Layout/AppLayout.tsx`

- [ ] **Step 1: Thêm aurora vào app-layout**

Thay block `return (...)` của AppLayout (phần authenticated, dòng ~20–29) bằng:

```tsx
  return (
    <div className="app-layout">
      <div className="aurora" aria-hidden="true">
        <span className="b1" /><span className="b2" /><span className="b3" />
      </div>
      <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content fade-in">
        <Outlet />
      </main>
    </div>
  );
```

Và đổi block loading (dòng ~10–16) dùng token màu:

```tsx
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Đang tải...
      </div>
    );
  }
```

- [ ] **Step 2: Build kiểm tra**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Verify trực quan**

Run: `npm run dev`, mở http://localhost:5173 sau khi đăng nhập.
Expected: thấy các blob gradient mờ trôi nền sau nội dung; nội dung fade-in.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Layout/AppLayout.tsx
git commit -m "feat(ui): aurora background + fade-in in AppLayout"
```

---

## Task 5: Sidebar — kính + item active gradient + nút đổi theme

**Files:**
- Modify: `frontend/src/index.css` (thêm style sidebar glass — ghi đè phần `.sidebar` cũ về màu)
- Modify: `frontend/src/components/Layout/Sidebar.tsx`

- [ ] **Step 1: Thêm style sidebar glass vào cuối index.css**

```css
/* ===== SIDEBAR (glass) ===== */
.sidebar {
  background: var(--sidebar-bg);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  color: var(--sidebar-text);
  border-right: 1px solid var(--glass-border);
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 18px; margin: 2px 10px;
  color: var(--sidebar-text); text-decoration: none;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease, transform 0.15s ease;
}
.nav-item:hover { background: rgba(255,255,255,0.08); transform: translateX(3px); }
.nav-item.active {
  background: var(--accent-grad);
  color: #fff;
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.4);
}
.theme-toggle {
  display: flex; align-items: center; gap: 8px;
  width: 100%; margin-bottom: 12px;
  padding: 8px 12px; border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.08);
  border: 1px solid var(--glass-border);
  color: var(--sidebar-text); cursor: pointer; font: inherit; font-size: 13px;
  transition: background 0.2s ease;
}
.theme-toggle:hover { background: rgba(255,255,255,0.16); }
```

- [ ] **Step 2: Cập nhật Sidebar.tsx — NavLink dùng class, thêm nút theme**

Thay nội dung `frontend/src/components/Layout/Sidebar.tsx` bằng:

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Giao dịch', icon: '💳' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️' },
  { to: '/statistics', label: 'Thống kê', icon: '📈' },
  { to: '/savings', label: 'Tiết kiệm', icon: '🐷' },
];

const themeLabel: Record<string, string> = { system: '🖥️ Hệ thống', light: '☀️ Sáng', dark: '🌙 Tối' };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { fullName, email, logout } = useAuthStore();
  const { theme, cycleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 700, background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>💰 Chi Tiêu</div>
        <button onClick={onClose}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--sidebar-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          className="sidebar-close">✕</button>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)' }}>
        <button className="theme-toggle" onClick={cycleTheme} title="Đổi giao diện sáng/tối">
          <span>{themeLabel[theme]}</span>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{fullName}</div>
        <div style={{ fontSize: 12, color: 'var(--sidebar-muted)', marginBottom: 12 }}>{email}</div>
        <button onClick={handleLogout} className="glass-btn glass-btn-danger" style={{ fontSize: 13, padding: '6px 14px' }}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Build + verify**

Run: `npm run build` (Expected PASS), rồi `npm run dev`.
Expected: sidebar kính mờ, item active có nền gradient tím→xanh, nút đổi theme xoay vòng system→light→dark và đổi màu toàn app tức thì.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/src/components/Layout/Sidebar.tsx
git commit -m "feat(ui): glass sidebar, gradient active item, theme toggle"
```

---

## Task 6: Hook useCountUp

**Files:**
- Create: `frontend/src/hooks/useCountUp.ts`

- [ ] **Step 1: Tạo hook**

Tạo `frontend/src/hooks/useCountUp.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

/** Đếm từ 0 tới `target` trong `duration` ms khi target đổi. Tôn trọng reduced-motion. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) { setValue(target); return; }

    let startTs: number | null = null;
    const from = 0;
    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}
```

- [ ] **Step 2: Build kiểm tra**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useCountUp.ts
git commit -m "feat(ui): useCountUp hook (reduced-motion aware)"
```

---

## Task 7: Dashboard — thẻ kính, count-up, token màu

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

Context hiện tại: dùng `cardStyle(color)` inline + màu hardcode (`#22c55e`, `#16a34a`…). Các thẻ tổng thu/chi/tiết kiệm/số dư nằm trong `.dashboard-cards`; 2 panel dưới trong `.dashboard-bottom`.

- [ ] **Step 1: Thêm component số đếm + chuyển thẻ sang glass**

Sửa `frontend/src/pages/Dashboard.tsx`:

1. Thêm import: `import { useCountUp } from '../hooks/useCountUp';`
2. Thêm component nội bộ (trên `export default`):

```tsx
function StatCard({ label, value, color, ready }: { label: string; value: number; color: string; ready: boolean }) {
  const n = useCountUp(ready ? value : 0);
  return (
    <div className="glass-card interactive" style={{ padding: '20px 22px', borderLeft: `4px solid ${color}` }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>
        {ready ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '...'}
      </div>
    </div>
  );
}
```

3. Thay block `.dashboard-cards` (4 thẻ inline) bằng:

```tsx
      <div className="dashboard-cards stagger">
        <StatCard label="Tổng thu tháng này" value={summary?.totalIncome ?? 0} color="var(--income)" ready={!!summary} />
        <StatCard label="Tổng chi tháng này" value={summary?.totalExpense ?? 0} color="var(--expense)" ready={!!summary} />
        <StatCard label="Đã tiết kiệm" value={summary?.totalSaved ?? 0} color="var(--saving)" ready={!!summary} />
        <StatCard label="Số dư" value={summary?.balance ?? 0} color="var(--balance)" ready={!!summary} />
      </div>
```

4. Xóa hàm `cardStyle` (không còn dùng).

5. Hai panel dưới: đổi `style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '...' }}` thành `className="glass-card" style={{ padding: 24 }}` (cho cả 2 panel). Đổi tiêu đề `h3` và text `#94a3b8`/`#f1f5f9` sang `color: 'var(--text-muted)'` / `borderBottom: '1px solid var(--glass-border)'`. Giữ màu income/expense của số tiền: đổi `'#16a34a'`→`'var(--income)'`, `'#dc2626'`→`'var(--expense)'`.

6. Tiêu đề trang: đổi `<h2 style={{ margin: '0 0 24px', fontSize: 22 }}>Dashboard</h2>` giữ nguyên (h2 đã style theo token màu chữ).

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`.
Expected: 4 thẻ kính fade-in lần lượt, số tiền đếm tăng dần; hover thẻ nâng lên + sáng viền; light/dark đều đẹp.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat(ui): glass dashboard cards with count-up + semantic tokens"
```

---

## Task 8: Login + Register — thẻ kính trên nền aurora

**Files:**
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Login.tsx — bọc aurora + glass card**

Trong `frontend/src/pages/Login.tsx`, thay block `return (...)` để:
- Container ngoài: `style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'var(--page-bg)' }}` và thêm ngay trong nó:
  ```tsx
  <div className="aurora" aria-hidden="true"><span className="b1" /><span className="b2" /><span className="b3" /></div>
  ```
- Thẻ login: đổi `style={{ background: 'white', padding: 40, borderRadius: 12, width: 380, boxShadow: '...' }}` → `className="glass-card fade-in-up" style={{ padding: 40, width: 380, maxWidth: '90vw' }}`.
- Tiêu đề `💰 Chi Tiêu`: đổi style thành gradient text: `style={{ margin: '0 0 8px', fontSize: 24, background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}`.
- Dòng phụ đề `<p>`: `color: 'var(--text-muted)'`.
- Box lỗi: đổi sang `style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--expense)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}`.
- Label: `color: 'var(--text-strong)'`.
- 2 input: thay `style={{...}}` bằng `className="glass-input"` (bỏ style inline cũ).
- Nút submit: thay `style={{...}}` bằng `className="glass-btn glass-btn-primary" style={{ width: '100%', padding: '11px', fontSize: 15 }}`.
- Link đăng ký: `style={{ color: 'var(--accent)' }}`; dòng `<p>` bao ngoài: `color: 'var(--text-muted)'`.

- [ ] **Step 2: Register.tsx — áp dụng y hệt Login**

Mở `frontend/src/pages/Register.tsx`. Áp dụng đúng các thay đổi như Step 1 cho các phần tương ứng (container + aurora, glass card, gradient title, text-muted, glass-input cho mọi input, glass-btn-primary cho nút, màu link/lỗi theo token). Register có nhiều input hơn — áp `className="glass-input"` cho tất cả.

- [ ] **Step 3: Build + verify**

Run: `npm run build` (PASS), `npm run dev`, mở /login và /register (đăng xuất trước).
Expected: thẻ đăng nhập kính mờ nổi trên nền aurora, input/nút phong cách glass, fade-in mượt; đẹp cả light/dark.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat(ui): glass auth cards on aurora for login/register"
```

---

## Task 9: Modal — kính + scale-in + overlay blur

**Files:**
- Modify: `frontend/src/components/Common/Modal.tsx`

- [ ] **Step 1: Cập nhật Modal.tsx**

Thay nội dung `frontend/src/components/Common/Modal.tsx` bằng:

```tsx
import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="glass-card" onClick={e => e.stopPropagation()}
        style={{ padding: 28, width: 460, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--glass-bg-strong)', animation: 'modalIn 0.25s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-strong)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`.
Expected: mở modal (vd thêm giao dịch) thấy nền blur, hộp kính scale-in; click nền ngoài đóng modal.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Common/Modal.tsx
git commit -m "feat(ui): glass modal with scale-in and blurred overlay"
```

---

## Task 10: TransactionForm — input/select/nút kính

**Files:**
- Modify: `frontend/src/components/Transaction/TransactionForm.tsx`

- [ ] **Step 1: Áp class kính cho form**

Mở `frontend/src/components/Transaction/TransactionForm.tsx`. Với mỗi `<input>`, `<select>`, `<textarea>`: thay `style={{...}}` (viền/padding) bằng `className="glass-input"` (hoặc `glass-select` cho select). Với label: dùng `color: 'var(--text-strong)'`. Với nút submit/hủy: dùng `className="glass-btn glass-btn-primary"` (submit) và `className="glass-btn"` (hủy). Giữ nguyên toàn bộ logic state/handler — chỉ đổi lớp trình bày. Nếu form có nút chọn loại Thu/Chi, dùng `className="chip"` + nền `var(--accent-grad)` cho trạng thái chọn.

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`, mở modal thêm giao dịch.
Expected: input/select/nút theo phong cách glass, focus có glow tím; light/dark ổn.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Transaction/TransactionForm.tsx
git commit -m "feat(ui): glass inputs and buttons in TransactionForm"
```

---

## Task 11: Transactions page — glass

**Files:**
- Modify: `frontend/src/pages/Transactions.tsx`

- [ ] **Step 1: Chuyển sang glass**

Mở `frontend/src/pages/Transactions.tsx`. Thực hiện:
- Mọi vùng nền trắng (`background: 'white'` / `#fff`) bo góc thành `className="glass-card"` (bỏ background/boxShadow inline, giữ padding).
- Nút "Thêm giao dịch" / nút hành động chính → `className="glass-btn glass-btn-primary"`; nút phụ → `className="glass-btn"`; nút xóa → `className="glass-btn glass-btn-danger"`.
- Input/select lọc → `className="glass-input"` / `glass-select`.
- Bảng (nếu có): giữ `.table-wrapper`; đổi màu viền hàng `#f1f5f9`/`#e2e8f0` → `var(--glass-border)`; màu chữ phụ → `var(--text-muted)`; số tiền thu/chi → `var(--income)`/`var(--expense)`.
- Tiêu đề trang giữ `<h2>` (đã theo token).

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`, mở /transactions.
Expected: bảng/thẻ kính, nút glass, màu thu/chi theo token, đẹp light/dark.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Transactions.tsx
git commit -m "feat(ui): glass styling for Transactions page"
```

---

## Task 12: Categories page — glass

**Files:**
- Modify: `frontend/src/pages/Categories.tsx`

- [ ] **Step 1: Chuyển sang glass**

Mở `frontend/src/pages/Categories.tsx`. Áp dụng cùng nguyên tắc Task 11:
- Vùng nền trắng → `className="glass-card"`.
- Nút thêm/sửa → `glass-btn glass-btn-primary`; nút xóa → `glass-btn glass-btn-danger`.
- Input/select → `glass-input`/`glass-select`.
- Thẻ danh mục (nếu hiển thị dạng lưới): mỗi thẻ `className="glass-card interactive"`, icon to, tên `color: 'var(--text-strong)'`.
- Màu viền/chữ phụ → token (`var(--glass-border)`, `var(--text-muted)`).

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`, mở /categories.
Expected: danh mục dạng thẻ kính, hover nâng; nút glass; light/dark ổn.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Categories.tsx
git commit -m "feat(ui): glass styling for Categories page"
```

---

## Task 13: Statistics page — glass + chart hợp tông

**Files:**
- Modify: `frontend/src/pages/Statistics.tsx`

- [ ] **Step 1: Chuyển sang glass**

Mở `frontend/src/pages/Statistics.tsx`. Áp dụng:
- Vùng nền trắng chứa biểu đồ/bảng → `className="glass-card" style={{ padding: 24 }}`.
- Bộ chọn tháng/năm → `glass-select`.
- Màu chữ phụ/viền → token.
- Với recharts: màu series thu/chi dùng `#16a34a`→giữ hoặc đổi sang token literal (recharts cần màu literal, không nhận CSS var qua thuộc tính `fill`/`stroke` JS). Giữ literal: thu `#22c55e`, chi `#ef4444`, tiết kiệm `#8b5cf6`. Đổi `stroke` lưới `#f1f5f9` → `rgba(148,163,184,0.2)` để hợp cả 2 theme. Tooltip giữ format `vi-VN`.

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`, mở /statistics.
Expected: biểu đồ nằm trong thẻ kính, lưới mờ hợp cả light/dark, bộ lọc glass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Statistics.tsx
git commit -m "feat(ui): glass styling for Statistics page"
```

---

## Task 14: Savings page — glass + thanh tiến độ gradient

**Files:**
- Modify: `frontend/src/pages/Savings.tsx`

- [ ] **Step 1: Chuyển sang glass**

Mở `frontend/src/pages/Savings.tsx`. Áp dụng:
- Vùng nền trắng → `className="glass-card"`.
- Nút nạp/thêm mục tiêu → `glass-btn glass-btn-primary`; xóa → `glass-btn glass-btn-danger`.
- Input/select → `glass-input`/`glass-select`.
- Thanh tiến độ (progress bar): nền `rgba(148,163,184,0.25)`, bo `999px`; phần đã đạt `background: 'var(--accent-grad)'`, có `transition: width 0.6s ease`.
- Màu chữ phụ/viền → token; số tiền tiết kiệm → `var(--saving)`.
- Mỗi mục tiêu hiển thị dạng `className="glass-card interactive"`.

- [ ] **Step 2: Build + verify**

Run: `npm run build` (PASS), `npm run dev`, mở /savings.
Expected: mục tiêu dạng thẻ kính, thanh tiến độ gradient mượt, nút glass; light/dark ổn.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Savings.tsx
git commit -m "feat(ui): glass styling + gradient progress for Savings page"
```

---

## Task 15: Dọn App.css + verify tổng thể + build cuối

**Files:**
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/App.tsx` (chỉ nếu còn import App.css mà không dùng)

- [ ] **Step 1: Kiểm tra App.css còn được dùng không**

Run: `grep -rn "App.css" frontend/src`
- Nếu chỉ `App.tsx` import và các class trong App.css (`.hero`, `#next-steps`, `.counter`, `#center`, `.ticks`…) KHÔNG xuất hiện trong bất kỳ `.tsx` nào (grep từng class), thì xóa nội dung App.css để trống (giữ file) hoặc xóa file + bỏ import trong App.tsx.

Run kiểm chứng từng class còn dùng: `grep -rn "hero\|next-steps\|counter\|#center\|ticks" frontend/src --include=*.tsx`
Expected: không kết quả → an toàn để dọn.

- [ ] **Step 2: Dọn App.css**

Nếu Step 1 xác nhận không dùng: thay toàn bộ `frontend/src/App.css` bằng:

```css
/* App-specific styles (liquid glass system lives in index.css) */
```

Và nếu `App.tsx` import `'./App.css'` mà không cần, có thể giữ import (file vẫn tồn tại) — không bắt buộc xóa.

- [ ] **Step 3: Build cuối + verify toàn bộ**

Run: `npm run build`
Expected: PASS, không lỗi TS, không cảnh báo mới (ngoài cảnh báo chunk-size đã biết).

Run: `npm run dev` và duyệt tất cả trang: Login, Register, Dashboard, Giao dịch, Danh mục, Thống kê, Tiết kiệm. Đổi theme system/light/dark. Thu nhỏ cửa sổ < 768px kiểm tra mobile (hamburger, sidebar trượt, grid 1 cột).
Expected: mọi trang phong cách glass nhất quán, hiệu ứng mượt, không vỡ layout mobile, đổi theme không nháy.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.css frontend/src/App.tsx
git commit -m "chore(ui): remove leftover Vite template styles"
```

---

## Tổng kết

Sau 15 task: hệ token glass 2 theme, theme switcher, nền aurora động, các class kính dùng chung, count-up Dashboard, và toàn bộ trang/component chuyển sang phong cách liquid glass — không thêm dependency, build pass, responsive giữ nguyên hành vi.
