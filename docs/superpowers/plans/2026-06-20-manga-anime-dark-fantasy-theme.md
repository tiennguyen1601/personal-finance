# Manga/Anime Dark-Fantasy Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay giao diện glassmorphism hiện tại bằng hệ thống 4 theme phong cách Dark Fantasy (Manga/Anime × Sáng/Tối) chuyển được như công tắc, áp cho toàn bộ frontend của app quản lý chi tiêu.

**Architecture:** Dùng 2 thuộc tính trên `<html>` — `data-skin` (`manga`/`anime`) và `data-mode` (`light`/`dark`). Toàn bộ màu/cấu trúc khai báo trong `index.css` bằng CSS custom properties theo 4 tổ hợp, **giữ nguyên tên biến semantic cũ** (`--glass-border`, `--income`...) để các trang đang dùng tự đổi diện mạo. State theme nằm trong `themeStore` (Zustand) + `localStorage`, áp trước khi React mount để chống nháy.

**Tech Stack:** React 18 + TypeScript + Vite, Zustand, recharts, react-hot-toast. Google Fonts (Be Vietnam Pro, Oswald, Playfair Display — đều có subset tiếng Việt).

**Tham chiếu thị giác chuẩn:** spec `docs/superpowers/specs/2026-06-20-manga-anime-dark-fantasy-theme-design.md` và mockup đã duyệt (Dashboard 4 kiểu).

---

## Lưu ý về kiểm thử (đọc trước khi bắt đầu)

Frontend **không có test runner** (`package.json` chỉ có `dev`/`build`/`lint`/`preview`). Đây là công việc thuần trình bày (CSS/markup). Vì vậy mỗi task xác minh bằng:

1. **`npm run build`** (chạy `tsc -b && vite build`) — phải PASS, không lỗi type/build.
2. **Kiểm tra trực quan** trên `npm run dev` — mở `http://localhost:5173`, bấm đổi cả 4 kiểu, xác nhận tiêu chí "Expected" của task.

Không cài thêm test framework (ngoài phạm vi, không tương xứng công sức cho CSS).
Mọi lệnh chạy trong thư mục `frontend/`. Làm việc trên nhánh mới `feat/dark-fantasy-theme` (tách từ `feat/liquid-glass-ui`).

---

## Cấu trúc file

| File | Trách nhiệm | Thao tác |
|---|---|---|
| `frontend/src/store/themeStore.ts` | State + áp `data-skin`/`data-mode`, lưu localStorage | Viết lại |
| `frontend/index.html` | Inline script chống nháy + nạp Google Fonts | Sửa |
| `frontend/src/main.tsx` | Gọi `applyTheme` lúc khởi động | Sửa |
| `frontend/src/components/Layout/Sidebar.tsx` | 2 công tắc skin + mode | Sửa |
| `frontend/src/components/Layout/ThemeBackdrop.tsx` | Lớp nền trang trí theo skin | Tạo mới |
| `frontend/src/components/Layout/AppLayout.tsx` | Render `ThemeBackdrop` thay `.aurora` | Sửa |
| `frontend/src/index.css` | 4 khối token + cấu trúc theo skin + restyle component dùng chung + backdrop CSS + typography | Viết lại phần lớn |
| `frontend/src/pages/Dashboard.tsx` | Dọn inline-style → token/class, màu chart theo theme | Sửa |
| `frontend/src/pages/Transactions.tsx` | Dùng class/token theo skin | Sửa |
| `frontend/src/pages/Categories.tsx` | Dùng class/token theo skin | Sửa |
| `frontend/src/pages/Savings.tsx` | Dùng class/token, thanh tiến độ gradient | Sửa |
| `frontend/src/pages/Statistics.tsx` | Màu recharts đọc từ CSS var | Sửa |

---

## Task 0: Tạo nhánh làm việc

- [ ] **Step 1: Tạo và chuyển nhánh**

```bash
cd frontend && cd ..
git checkout -b feat/dark-fantasy-theme
```

- [ ] **Step 2: Xác nhận build sạch trước khi bắt đầu**

Run: `cd frontend && npm run build`
Expected: build PASS (baseline xanh trước khi sửa).

---

## Task 1: Viết lại `themeStore` thành 2 trục skin + mode

**Files:**
- Modify: `frontend/src/store/themeStore.ts` (viết lại toàn bộ)

- [ ] **Step 1: Thay toàn bộ nội dung file**

```ts
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
```

- [ ] **Step 2: Build (sẽ FAIL ở main.tsx & Sidebar vì API cũ đã đổi)**

Run: `cd frontend && npm run build`
Expected: FAIL — lỗi type ở `main.tsx` (gọi `applyTheme` 1 tham số) và `Sidebar.tsx` (`theme`, `cycleTheme` không còn). Đây là kỳ vọng đúng; Task 2 & 3 sửa tiếp.

---

## Task 2: Chống nháy theme + nạp font (index.html) và cập nhật main.tsx

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/main.tsx:8,11`

- [ ] **Step 1: Cập nhật `<head>` của `frontend/index.html`**

Thay khối `<head>...</head>` hiện tại bằng:

```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hắc Khố · Quản lý chi tiêu</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Oswald:wght@500;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
      rel="stylesheet"
    />

    <!-- Áp skin/mode trước khi paint để không nháy theme -->
    <script>
      (function () {
        try {
          var s = localStorage.getItem('app-skin');
          var m = localStorage.getItem('app-mode');
          var root = document.documentElement;
          root.setAttribute('data-skin', s === 'manga' || s === 'anime' ? s : 'anime');
          root.setAttribute('data-mode', m === 'light' || m === 'dark' ? m : 'dark');
        } catch (e) {}
      })();
    </script>
  </head>
```

- [ ] **Step 2: Cập nhật `frontend/src/main.tsx`**

Sửa import dòng 8 và lời gọi dòng 11:

```ts
import { applyTheme, useThemeStore } from './store/themeStore';

// Áp theme đã lưu trước khi render (đồng bộ với script trong index.html).
const { skin, mode } = useThemeStore.getState();
applyTheme(skin, mode);
```

- [ ] **Step 3: Build (vẫn FAIL ở Sidebar — đúng kỳ vọng)**

Run: `cd frontend && npm run build`
Expected: FAIL chỉ còn ở `Sidebar.tsx`. Task 3 sửa nốt.

---

## Task 3: Hai công tắc skin + mode trong Sidebar

**Files:**
- Modify: `frontend/src/components/Layout/Sidebar.tsx`

- [ ] **Step 1: Thay import & lấy state theme**

Dòng 3 đổi import:

```ts
import { useThemeStore } from '../../store/themeStore';
```

Dòng 13 xoá `themeLabel`. Trong component, thay dòng 22:

```ts
  const { skin, mode, setSkin, setMode } = useThemeStore();
```

- [ ] **Step 2: Thay khối nút theme (dòng 47-49) bằng 2 segmented control**

```tsx
        <div className="theme-switch">
          <div className="seg" role="group" aria-label="Phong cách">
            <button className={skin === 'manga' ? 'on' : ''} onClick={() => setSkin('manga')}>📖 Manga</button>
            <button className={skin === 'anime' ? 'on' : ''} onClick={() => setSkin('anime')}>✨ Anime</button>
          </div>
          <div className="seg" role="group" aria-label="Sáng tối">
            <button className={mode === 'light' ? 'on' : ''} onClick={() => setMode('light')}>☀️</button>
            <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>🌙</button>
          </div>
        </div>
```

- [ ] **Step 3: Build PASS**

Run: `cd frontend && npm run build`
Expected: PASS (CSS `.theme-switch`/`.seg` thêm ở Task 5; tạm thời nút chưa đẹp nhưng hoạt động).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/store/themeStore.ts frontend/index.html frontend/src/main.tsx frontend/src/components/Layout/Sidebar.tsx
git commit -m "feat(theme): 2-axis skin+mode engine with no-FOUC + sidebar switch"
```

---

## Task 4: Khối token 4 kiểu + token cấu trúc theo skin (index.css)

**Files:**
- Modify: `frontend/src/index.css` (thay khối `:root` + `[data-theme='dark']` + `@media prefers-color-scheme` cũ, dòng 1-97)

> Giữ NGUYÊN tên biến semantic cũ để các trang tự đổi diện mạo. Thêm biến mới: `--page2`, `--bw`, `--surface-shadow`, `--glow`, `--accent-glow`, `--arcane`, `--ornament`, `--halftone`, `--body-font`, `--display-font`.

- [ ] **Step 1: Thay dòng 1-97 của `index.css` bằng khối dưới**

```css
:root {
  --radius: 18px;
  --radius-sm: 12px;
  --blur: 14px;
  color-scheme: light dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* ===== CẤU TRÚC THEO SKIN ===== */
:root[data-skin='manga'] {
  --radius: 3px;
  --radius-sm: 2px;
  --bw: 2.5px;
  --body-font: 'Be Vietnam Pro', system-ui, sans-serif;
  --display-font: 'Oswald', 'Be Vietnam Pro', sans-serif;
  --glow: none;
}
:root[data-skin='anime'] {
  --radius: 20px;
  --radius-sm: 13px;
  --bw: 1px;
  --body-font: 'Be Vietnam Pro', system-ui, sans-serif;
  --display-font: 'Playfair Display', Georgia, serif;
  --glow: 0 0 24px var(--accent-glow);
}

/* ===== PALETTE 4 KIỂU ===== */
/* Manga – Sáng */
:root[data-skin='manga'][data-mode='light'] {
  --page-bg: #ece5d4; --page2: #e3dac4;
  --text: #3a342a; --text-muted: #6b6151; --text-strong: #211d16;
  --accent: #b3121b; --accent-2: #6d28d9; --accent-glow: transparent;
  --accent-grad: linear-gradient(135deg, #b3121b 0%, #6d28d9 100%);
  --arcane: #6d28d9; --ornament: #9a6a07;
  --income: #1f7a3d; --expense: #b3121b; --saving: #6d28d9; --balance: #9a6a07;
  --glass-bg: rgba(246,241,228,0.7); --glass-bg-strong: #f6f1e4;
  --glass-border: #1a1610; --glass-shadow: 4px 4px 0 #1a1610;
  --surface-shadow: 4px 4px 0 #1a1610;
  --halftone: rgba(26,22,16,0.14);
  --sidebar-bg: #f6f1e4; --sidebar-text: #211d16; --sidebar-muted: #6b6151;
  --blob-1: transparent; --blob-2: transparent; --blob-3: transparent;
}
/* Manga – Tối */
:root[data-skin='manga'][data-mode='dark'] {
  --page-bg: #08080c; --page2: #0d0d13;
  --text: #cfc8b5; --text-muted: #8f8775; --text-strong: #ece4cf;
  --accent: #ef3b3b; --accent-2: #b07cf5; --accent-glow: rgba(239,59,59,0.35);
  --accent-grad: linear-gradient(135deg, #ef3b3b 0%, #b07cf5 100%);
  --arcane: #b07cf5; --ornament: #f5c451;
  --income: #52d27f; --expense: #ff6b6b; --saving: #b07cf5; --balance: #f5c451;
  --glass-bg: rgba(19,19,27,0.7); --glass-bg-strong: #13131b;
  --glass-border: #c9bea4; --glass-shadow: 4px 4px 0 #000;
  --surface-shadow: 4px 4px 0 #000;
  --halftone: rgba(236,228,207,0.10);
  --sidebar-bg: #13131b; --sidebar-text: #ece4cf; --sidebar-muted: #8f8775;
  --blob-1: transparent; --blob-2: transparent; --blob-3: transparent;
}
/* Anime – Sáng */
:root[data-skin='anime'][data-mode='light'] {
  --page-bg: #ece7f6; --page2: #e6def4;
  --text: #4a3b78; --text-muted: #6c5b9c; --text-strong: #2c1065;
  --accent: #7c3aed; --accent-2: #d61f4e; --accent-glow: rgba(124,58,237,0.30);
  --accent-grad: linear-gradient(135deg, #7c3aed 0%, #d61f4e 100%);
  --arcane: #7c3aed; --ornament: #c2790a;
  --income: #0a8a5f; --expense: #d61f4e; --saving: #7c3aed; --balance: #c2790a;
  --glass-bg: rgba(255,255,255,0.72); --glass-bg-strong: rgba(255,255,255,0.85);
  --glass-border: rgba(124,58,237,0.22); --glass-shadow: 0 18px 50px rgba(80,40,160,0.18);
  --surface-shadow: 0 18px 50px rgba(80,40,160,0.18);
  --halftone: transparent;
  --sidebar-bg: rgba(255,255,255,0.8); --sidebar-text: #2c1065; --sidebar-muted: #6c5b9c;
  --blob-1: rgba(124,58,237,0.30); --blob-2: rgba(214,31,78,0.16); --blob-3: rgba(124,58,237,0.16);
}
/* Anime – Tối ⭐ */
:root[data-skin='anime'][data-mode='dark'] {
  --page-bg: #0a0612; --page2: #120a20;
  --text: #cfc4e8; --text-muted: #a294c9; --text-strong: #ece7ff;
  --accent: #a855f7; --accent-2: #fb6f8a; --accent-glow: rgba(168,85,247,0.45);
  --accent-grad: linear-gradient(135deg, #a855f7 0%, #fb6f8a 100%);
  --arcane: #c084fc; --ornament: #fbbf24;
  --income: #34d399; --expense: #fb6f8a; --saving: #c084fc; --balance: #fbbf24;
  --glass-bg: rgba(32,21,54,0.55); --glass-bg-strong: rgba(32,21,54,0.7);
  --glass-border: rgba(168,85,247,0.32); --glass-shadow: 0 18px 50px rgba(0,0,0,0.5);
  --surface-shadow: 0 18px 50px rgba(0,0,0,0.5);
  --halftone: transparent;
  --sidebar-bg: rgba(18,10,32,0.7); --sidebar-text: #ece7ff; --sidebar-muted: #a294c9;
  --blob-1: rgba(168,85,247,0.40); --blob-2: rgba(251,111,138,0.18); --blob-3: rgba(192,132,252,0.16);
}

body {
  font: 16px/1.5 var(--body-font);
  color: var(--text);
}
```

- [ ] **Step 2: Cập nhật `body` background dùng page2 (tìm rule `body {` cũ ~dòng 107)**

Đảm bảo `body` có:

```css
body {
  margin: 0;
  color: var(--text);
  min-height: 100vh;
  background:
    radial-gradient(120% 80% at 50% 0%, var(--page2) 0%, var(--page-bg) 60%) fixed;
}
```

- [ ] **Step 3: Build PASS + kiểm tra trực quan**

Run: `cd frontend && npm run build` → PASS.
Run: `cd frontend && npm run dev`, mở app, bấm 4 kiểu.
Expected: Màu nền/chữ/accent đổi rõ giữa 4 kiểu; chưa có halftone/glow/font display (các task sau).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(theme): dark-fantasy token palette for 4 skin/mode combos"
```

---

## Task 5: Typography + restyle component dùng chung (index.css)

**Files:**
- Modify: `frontend/src/index.css` (các rule heading dòng ~247-289; `.glass-card`, `.glass-btn*`, `.glass-input/select`, `.chip`, `.nav-item`, `.theme-toggle`; thêm `.theme-switch`, `.seg`)

- [ ] **Step 1: Thay khối heading (dòng ~247-289) bằng**

```css
h1, h2, h3 { font-family: var(--display-font); color: var(--text-strong); margin: 0; }
h1 { font-size: 40px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.05; margin: 8px 0 4px; }
h2 { font-size: 26px; font-weight: 700; letter-spacing: 0.3px; }
h3 { font-size: 17px; font-weight: 700; }
:root[data-skin='manga'] h1,
:root[data-skin='manga'] h2,
:root[data-skin='manga'] h3 { text-transform: uppercase; letter-spacing: 1px; }
@media (max-width: 1024px) { h1 { font-size: 30px; } h2 { font-size: 21px; } }
p { margin: 0; }
```

- [ ] **Step 2: Restyle `.glass-card` (dòng ~317-332)**

```css
.glass-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--blur));
  backdrop-filter: blur(var(--blur));
  border: var(--bw) solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: var(--surface-shadow);
}
.glass-card.interactive { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
:root[data-skin='anime'] .glass-card.interactive:hover {
  transform: translateY(-4px); box-shadow: var(--surface-shadow), var(--glow);
}
:root[data-skin='manga'] .glass-card.interactive:hover {
  transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--glass-shadow, #000);
}
```

- [ ] **Step 3: Restyle buttons (dòng ~335-357)**

```css
.glass-btn {
  font: inherit; font-weight: 600; border-radius: var(--radius-sm);
  padding: 10px 18px; cursor: pointer;
  border: var(--bw) solid var(--glass-border);
  background: var(--glass-bg-strong); color: var(--text-strong);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
}
.glass-btn:hover { transform: translateY(-2px); box-shadow: var(--surface-shadow); }
.glass-btn:active { transform: translateY(0); }
.glass-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.glass-btn-primary { background: var(--accent-grad); color: #fff; border: none; box-shadow: var(--glow); }
.glass-btn-primary:hover { filter: brightness(1.08); }
.glass-btn-danger { background: var(--expense); color: #fff; border: none; }
.glass-btn-danger:hover { filter: brightness(1.08); }
```

- [ ] **Step 4: Restyle inputs (dòng ~360-376) — thay `rgba(124,58,237,0.25)` focus ring bằng accent**

```css
.glass-input, .glass-select {
  width: 100%; box-sizing: border-box; font: inherit;
  padding: 10px 12px; border-radius: var(--radius-sm);
  border: var(--bw) solid var(--glass-border);
  background: var(--glass-bg-strong); color: var(--text-strong);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.glass-input:focus, .glass-select:focus {
  outline: none; border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.glass-input::placeholder { color: var(--text-muted); }
```

- [ ] **Step 5: Cập nhật `.nav-item.active` & `.theme-toggle`, thêm `.theme-switch`/`.seg`**

Thay `.nav-item.active` (dòng ~423-427) và xoá `.theme-toggle` (dòng ~428-437), thêm:

```css
.nav-item.active {
  background: var(--accent-grad); color: #fff; box-shadow: var(--glow);
}
:root[data-skin='manga'] .nav-item.active { box-shadow: 3px 3px 0 var(--glass-shadow, #000); }

.theme-switch { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.seg {
  display: flex; border: var(--bw) solid var(--glass-border);
  border-radius: var(--radius-sm); overflow: hidden; background: var(--glass-bg-strong);
}
.seg button {
  flex: 1; font: inherit; font-size: 12.5px; font-weight: 700;
  padding: 8px 10px; border: none; cursor: pointer;
  background: transparent; color: var(--sidebar-muted); transition: all 0.15s ease;
}
.seg button.on { background: var(--accent); color: #fff; }
:root[data-skin='anime'] .seg button.on { background: var(--accent-grad); }
```

- [ ] **Step 6: Build PASS + visual**

Run: `cd frontend && npm run build` → PASS.
Visual: font heading đổi (Oswald hoa cho manga, Playfair cho anime); nút/thẻ/ô input đổi theo skin; công tắc theme đẹp.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(theme): typography + skin-aware shared components"
```

---

## Task 6: Lớp nền trang trí ThemeBackdrop

**Files:**
- Create: `frontend/src/components/Layout/ThemeBackdrop.tsx`
- Modify: `frontend/src/components/Layout/AppLayout.tsx:22-25`
- Modify: `frontend/src/index.css` (thay khối `.aurora` dòng ~291-314, thêm halftone/embers/speedlines)

- [ ] **Step 1: Tạo `ThemeBackdrop.tsx`**

```tsx
import { useThemeStore } from '../../store/themeStore';

const EMBERS = Array.from({ length: 22 }, (_, i) => i);

export default function ThemeBackdrop() {
  const { skin } = useThemeStore();
  return (
    <div className="backdrop" aria-hidden="true">
      {skin === 'anime' ? (
        <>
          <span className="neb a" /><span className="neb b" /><span className="neb c" />
          <div className="embers">
            {EMBERS.map(i => (
              <span
                key={i}
                className="ember"
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDuration: `${7 + (i % 9)}s`,
                  animationDelay: `${-(i % 12)}s`,
                  width: `${2 + (i % 4)}px`,
                  height: `${2 + (i % 4)}px`,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="speedlines" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Thay `.aurora` trong AppLayout (dòng 22-25)**

Import ở đầu file:

```tsx
import ThemeBackdrop from './ThemeBackdrop';
```

Thay khối:

```tsx
    <div className="app-layout">
      <ThemeBackdrop />
```

(xoá `<div className="aurora">...</div>`).

- [ ] **Step 3: Thay khối CSS `.aurora` (dòng ~291-314) bằng backdrop CSS**

```css
/* ===== BACKDROP ===== */
.backdrop { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }

/* manga: halftone phủ + speed-lines góc */
:root[data-skin='manga'] .backdrop {
  background-image: radial-gradient(var(--halftone) 1.4px, transparent 1.6px);
  background-size: 9px 9px;
}
.speedlines {
  position: absolute; top: -20%; right: -10%; width: 60%; height: 70%;
  background: repeating-linear-gradient(115deg, var(--halftone) 0 2px, transparent 2px 13px);
  transform: skewX(-12deg); opacity: 0.5;
}

/* anime: tinh vân + tro lửa */
.neb { position: absolute; border-radius: 50%; filter: blur(70px); }
.neb.a { width: 46vmax; height: 46vmax; top: -12vmax; left: -8vmax; background: var(--blob-1); }
.neb.b { width: 40vmax; height: 40vmax; bottom: -14vmax; right: -6vmax; background: var(--blob-2); }
.neb.c { width: 30vmax; height: 30vmax; top: 35vmax; left: 40vw; background: var(--blob-3); }
.embers { position: absolute; inset: 0; }
.ember {
  position: absolute; bottom: -10px; border-radius: 50%;
  background: var(--ornament); box-shadow: 0 0 8px var(--ornament);
  opacity: 0; animation: rise linear infinite;
}
@keyframes rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.9; }
  100% { transform: translateY(-105vh) scale(0.4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .ember { animation: none; display: none; } }
```

- [ ] **Step 4: Build PASS + visual**

Run: `cd frontend && npm run build` → PASS.
Visual: Anime → tinh vân + tro lửa bay; Manga → halftone chấm + speed-lines. Đổi skin thấy nền đổi tức thì.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Layout/ThemeBackdrop.tsx frontend/src/components/Layout/AppLayout.tsx frontend/src/index.css
git commit -m "feat(theme): skin-aware decorative backdrop (halftone vs nebula+embers)"
```

---

## Task 7: Polish Dashboard (StatCard + panels + chart theo theme)

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Đổi `StatCard` (dòng 12-22) sang dùng token `--role`**

```tsx
function StatCard({ label, value, color, rune, ready }: { label: string; value: number; color: string; rune: string; ready: boolean }) {
  const n = useCountUp(ready ? value : 0);
  return (
    <div className="glass-card interactive stat-card" style={{ ['--role' as any]: color }}>
      <div className="stat-rune">{rune}</div>
      <div className="stat-tag">{label}</div>
      <div className="stat-val">
        {ready ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '…'}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Cập nhật 4 lời gọi StatCard (dòng 60-63) thêm `rune`**

```tsx
        <StatCard label="Tổng thu tháng này" value={summary?.totalIncome ?? 0} color="var(--income)" rune="⚜" ready={!!summary} />
        <StatCard label="Tổng chi tháng này" value={summary?.totalExpense ?? 0} color="var(--expense)" rune="🜂" ready={!!summary} />
        <StatCard label="Đã tiết kiệm" value={summary?.totalSaved ?? 0} color="var(--saving)" rune="✦" ready={!!summary} />
        <StatCard label="Số dư" value={summary?.balance ?? 0} color="var(--balance)" rune="◈" ready={!!summary} />
```

- [ ] **Step 3: Đổi màu line chart đọc từ CSS var (dòng 75)**

```tsx
              <Line type="monotone" dataKey="chi" stroke="var(--expense)" strokeWidth={2.5} dot={false} />
```

Và `CartesianGrid` (dòng 71) đổi `stroke="var(--glass-border)"` với `strokeOpacity={0.25}`:

```tsx
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" strokeOpacity={0.25} />
```

- [ ] **Step 4: Thêm CSS stat-card vào `index.css`**

```css
.stat-card { padding: 18px 20px; position: relative; overflow: hidden; }
:root[data-skin='manga'] .stat-card { border-left: 6px solid var(--role); }
.stat-tag { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; }
.stat-val { font-family: var(--display-font); font-size: 27px; font-weight: 700; margin-top: 8px; color: var(--role); }
:root[data-skin='anime'] .stat-val { text-shadow: 0 0 18px var(--accent-glow); }
.stat-rune { position: absolute; right: 12px; top: 10px; font-size: 30px; opacity: 0.16; }
```

- [ ] **Step 5: Build PASS + visual**

Run: `cd frontend && npm run build` → PASS.
Visual: 4 thẻ có rune mờ + số to bằng font display; manga có viền trái, anime có glow; chart đổi màu theo theme.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/index.css
git commit -m "feat(dashboard): dark-fantasy stat cards + theme-aware chart"
```

---

## Task 8: Polish Transactions

**Files:**
- Modify: `frontend/src/pages/Transactions.tsx`

- [ ] **Step 1: Đọc file để xác định inline-style màu cứng**

Run: `grep -n "style=\|#[0-9a-fA-F]\{3,6\}\|rgba(" frontend/src/pages/Transactions.tsx`
Expected: liệt kê các chỗ màu cứng / border cứng.

- [ ] **Step 2: Thay mọi màu cứng bằng token**

Quy tắc thay (áp cho mọi chỗ khớp):
- `#fff`/`white` nền thẻ → `var(--glass-bg-strong)`
- viền `1px solid #...` / `#e5e7eb` → `var(--bw) solid var(--glass-border)`
- chữ phụ xám (`#6b7280`, `#94a3b8`) → `var(--text-muted)`
- chữ chính (`#111`, `#0f172a`) → `var(--text-strong)`
- xanh thu → `var(--income)`, đỏ chi → `var(--expense)`
- bo góc số cứng → `var(--radius)` / `var(--radius-sm)`

Đảm bảo container chính dùng `className="glass-card"`, bảng nằm trong `.table-wrapper`, nút dùng `.glass-btn`/`.glass-btn-primary`.

- [ ] **Step 3: Build PASS + visual (4 kiểu)**

Run: `cd frontend && npm run build` → PASS.
Visual: trang Giao dịch không còn mảng trắng/đen lạc tông ở cả 4 kiểu; bảng đọc rõ.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Transactions.tsx
git commit -m "feat(transactions): tokenize colors for dark-fantasy themes"
```

---

## Task 9: Polish Categories

**Files:**
- Modify: `frontend/src/pages/Categories.tsx`

- [ ] **Step 1: Tìm màu cứng**

Run: `grep -n "style=\|#[0-9a-fA-F]\{3,6\}\|rgba(" frontend/src/pages/Categories.tsx`

- [ ] **Step 2: Thay màu cứng bằng token** (cùng bảng quy tắc Task 8). Thẻ danh mục dùng `glass-card interactive`; modal form dùng `glass-card` + `.glass-input`/`.glass-select` + `.glass-btn*`.

- [ ] **Step 3: Build PASS + visual (4 kiểu)**

Run: `cd frontend && npm run build` → PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Categories.tsx
git commit -m "feat(categories): tokenize colors for dark-fantasy themes"
```

---

## Task 10: Polish Savings (thanh tiến độ gradient)

**Files:**
- Modify: `frontend/src/pages/Savings.tsx`

- [ ] **Step 1: Tìm màu cứng + thanh tiến độ**

Run: `grep -n "style=\|#[0-9a-fA-F]\{3,6\}\|rgba(\|width: \|background" frontend/src/pages/Savings.tsx`

- [ ] **Step 2: Thay màu cứng bằng token** (bảng quy tắc Task 8). Riêng **thanh tiến độ**:
- nền rãnh: `background: var(--glass-bg-strong); border: var(--bw) solid var(--glass-border); border-radius: 999px;`
- phần đầy: `background: linear-gradient(90deg, var(--saving), var(--ornament)); box-shadow: var(--glow);`

- [ ] **Step 3: Build PASS + visual (4 kiểu)**

Run: `cd frontend && npm run build` → PASS.
Visual: thẻ mục tiêu + thanh tiến độ gradient arcane→gold đẹp ở cả 4 kiểu.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Savings.tsx
git commit -m "feat(savings): tokenized cards + arcane gradient progress"
```

---

## Task 11: Polish Statistics (màu recharts theo theme)

**Files:**
- Modify: `frontend/src/pages/Statistics.tsx`

- [ ] **Step 1: Tìm màu chart cứng**

Run: `grep -n "fill=\|stroke=\|COLORS\|#[0-9a-fA-F]\{3,6\}" frontend/src/pages/Statistics.tsx`

- [ ] **Step 2: Thay màu chart bằng CSS var**
- `stroke`/`fill` line/bar/area → `var(--expense)` / `var(--income)` / `var(--saving)` theo ngữ nghĩa.
- Mảng màu pie (nếu có) → dùng `['var(--accent)','var(--saving)','var(--ornament)','var(--income)','var(--expense)','var(--arcane)']`.
- `CartesianGrid` → `stroke="var(--glass-border)" strokeOpacity={0.25}`.
- Container biểu đồ dùng `className="glass-card"`.

- [ ] **Step 3: Build PASS + visual (4 kiểu)**

Run: `cd frontend && npm run build` → PASS.
Visual: biểu đồ đổi tông màu khi đổi theme, không còn màu cứng lạc tông.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Statistics.tsx
git commit -m "feat(statistics): theme-aware chart colors"
```

---

## Task 12: Quét cuối + dọn token cũ thừa

**Files:**
- Modify: nhiều (chỉ khi phát hiện sót)

- [ ] **Step 1: Quét toàn frontend tìm màu cứng còn sót**

Run: `grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}\b" frontend/src --include=*.tsx | grep -v "var(--"`
Expected: chỉ còn màu hợp lệ (vd `#fff` trên nền accent đậm). Sửa nốt chỗ lạc tông theo bảng quy tắc Task 8.

- [ ] **Step 2: Xác nhận không còn tham chiếu biến đã xoá** (`--blur` cũ 18px, `data-theme`)

Run: `grep -rn "data-theme\|cycleTheme\|themeLabel" frontend/src`
Expected: không còn kết quả (đã thay bằng data-skin/data-mode).

- [ ] **Step 3: Build + lint PASS**

Run: `cd frontend && npm run build && npm run lint`
Expected: cả hai PASS.

- [ ] **Step 4: Kiểm tra trực quan toàn diện**

Mở `npm run dev`, duyệt qua **mọi trang × 4 kiểu** (Dashboard, Giao dịch, Danh mục, Thống kê, Tiết kiệm). Checklist:
- Số tiền luôn đọc rõ (đủ tương phản) ở mọi nền.
- Đổi skin/mode mượt, không vỡ layout.
- F5 giữ đúng kiểu đã chọn, không nháy theme.
- Mobile (thu nhỏ < 768px): sidebar + công tắc theme vẫn dùng được.

- [ ] **Step 5: Commit (nếu có sửa)**

```bash
git add -A
git commit -m "chore(theme): final color sweep + cleanup legacy theme refs"
```

---

## Self-Review (đã thực hiện khi viết plan)

- **Spec coverage:** 2 trục skin/mode (T1-3), 4 palette (T4), token cấu trúc theo skin (T4-5), backdrop halftone/nebula+embers (T6), typography + dọn inline (T5,7-12), polish từng trang gồm Statistics (T7-11), chống FOUC (T2), font hỗ trợ tiếng Việt — Be Vietnam Pro/Oswald/Playfair Display đều có subset Việt (T2). Mascot: ngoài phạm vi (đúng spec).
- **Placeholder scan:** không có TBD/TODO; bảng quy tắc thay màu ở Task 8 được tham chiếu lại ở T9-12 (cố ý DRY, có nêu rõ).
- **Type consistency:** `applyTheme(skin, mode)`, `setSkin`/`setMode`, `Skin`/`Mode`, `data-skin`/`data-mode` dùng nhất quán giữa themeStore, main.tsx, index.html, Sidebar, ThemeBackdrop.
- **Lưu ý sai khác TDD:** không có test runner trong repo → xác minh bằng `npm run build` + kiểm tra trực quan (đã giải thích đầu plan).
