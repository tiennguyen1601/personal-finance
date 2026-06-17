# Thiết kế: Giao diện Liquid Glass (responsive, light + dark)

Ngày: 2026-06-17
Dự án: web-quan-li-chi-tieu (React 18 + Vite + TypeScript, Firebase)

## 1. Mục tiêu

Thay diện mạo phẳng hiện tại bằng phong cách **liquid glass / glassmorphism** hiện đại:
kính mờ trong suốt, gradient nền sống động, bo góc mềm, nhiều hiệu ứng chuyển động.
Hỗ trợ **cả light và dark mode** (theo hệ thống + nút gạt thủ công), **responsive** cho cả web lẫn mobile.

## 2. Cách triển khai (Approach A đã chốt)

Hệ thống **design-token bằng CSS thuần + class tái sử dụng**. Không thêm thư viện mới.
- Toàn bộ màu/kính/blur/shadow/bán kính định nghĩa thành CSS custom properties trong `index.css`.
- Component chuyển từ style inline (màu hardcode) sang dùng class kính dùng chung.
- Giữ nguyên cấu trúc layout responsive đã có (sidebar + hamburger + grid co giãn), chỉ thay lớp trình bày.

Không chọn Tailwind (B) hay styled-components (C) để tránh thêm dependency và giữ phong cách CSS thuần của dự án.

## 3. Hệ màu & design tokens

Định nghĩa trong `:root` (light) và override trong `[data-theme="dark"]`. Khi `theme = system`,
không đặt `data-theme`, để `@media (prefers-color-scheme)` quyết định.

Nhóm token:
- **Nền**: `--bg-grad` (gradient aurora của trang), màu các blob `--blob-1`, `--blob-2`, `--blob-3`.
- **Kính**: `--glass-bg` (nền mờ bán trong suốt), `--glass-border` (viền sáng), `--glass-shadow` (shadow nhiều lớp), `--blur` (vd 20px).
- **Nhấn (accent)**: `--accent` + `--accent-grad` (gradient tím→xanh), dùng cho nút chính, item active, tiêu đề.
- **Chữ**: `--text`, `--text-muted`, `--text-strong`.
- **Ngữ nghĩa**: `--income` (xanh lá), `--expense` (đỏ), `--saving` (tím), `--balance` (xanh dương) — thay cho các mã màu hardcode trong Dashboard/Statistics/Savings.
- **Hình khối**: `--radius` (16–20px), `--radius-sm`.

Light: nền pastel tím-xanh-hồng dịu, kính trắng mờ.
Dark: nền xanh than/tím sâu, kính tối mờ, viền phát sáng nhẹ.

## 4. Cơ chế đổi theme

- File mới `src/store/themeStore.ts` (Zustand): state `theme: 'light' | 'dark' | 'system'`, action `setTheme`, persist vào `localStorage` (key `theme`).
- Khi theme đổi: đặt/gỡ thuộc tính `data-theme` trên `document.documentElement`.
  - `light` → `data-theme="light"`, `dark` → `data-theme="dark"`, `system` → gỡ thuộc tính.
- Khởi tạo sớm trong `main.tsx` (đọc localStorage trước render để tránh nháy theme).
- Nút gạt đặt ở chân Sidebar (và hiển thị hợp lý trên mobile): **bấm để xoay vòng 3 trạng thái** `system → light → dark → system`. Icon hiển thị theo trạng thái: 🖥️ (system) / ☀️ (light) / 🌙 (dark), kèm nhãn chữ ngắn.

## 5. Class & component dùng chung (trong index.css)

- `.glass` / `.glass-card`: nền kính + blur + viền + shadow + radius.
- `.glass-btn`, `.glass-btn-primary` (nền gradient accent), `.glass-btn-ghost`.
- `.glass-input`, `.glass-select`: input/select nền kính, focus có glow.
- `.bg-aurora`: container cố định phía sau chứa các blob gradient động (đặt một lần ở AppLayout / trang auth).
- `.chip` / `.badge`: nhãn nhỏ (loại giao dịch, danh mục).
- Lớp tiện ích animation: `.fade-in`, `.fade-in-up`, `.stagger > *` (delay tăng dần).

## 6. Hiệu ứng (mức "nhiều, bắt mắt")

- **Nền**: 2–3 blob gradient `position: fixed`, `filter: blur(...)`, trôi chậm qua `@keyframes` (transform translate/scale), `pointer-events: none`, `z-index` âm.
- **Vào trang**: thẻ fade-in + trượt lên, stagger theo thứ tự.
- **Thẻ kính**: hover nâng `translateY(-4px)` + tăng độ sáng viền + shadow sâu hơn, transition ~200ms.
- **Số liệu Dashboard**: hook `useCountUp` đếm tăng dần khi load (tự viết, không thêm lib); vẫn format `vi-VN` + `đ`.
- **Nút/input**: transition màu/viền/shadow mượt; nút primary có hiệu ứng sáng nhẹ khi hover.
- **Sidebar**: item active có thanh/đốm sáng gradient; chuyển trang mượt; panel mobile trượt mượt (đã có, tinh chỉnh easing).
- **Modal**: fade + scale-in khi mở, lớp phủ blur nền.
- **Reduced motion**: bọc các animation không thiết yếu trong `@media (prefers-reduced-motion: no-preference)`; khi user chọn giảm chuyển động thì tắt blob động + count-up + slide.

## 7. Phạm vi file

Sửa / thêm:
- `src/index.css` — hệ token 2 theme, class kính, animation, nền aurora, responsive tinh chỉnh.
- `src/App.css` — dọn rác template Vite cũ (hero/next-steps/vite) không dùng; giữ lại phần còn dùng (nếu có).
- `src/store/themeStore.ts` — **mới**, store theme + persist.
- `src/main.tsx` — khởi tạo theme sớm trước render.
- `src/components/Layout/AppLayout.tsx` — gắn nền aurora, áp dụng nền gradient.
- `src/components/Layout/Sidebar.tsx` — kính + item active gradient + nút đổi theme.
- `src/components/Common/Modal.tsx` — kính + fade/scale-in.
- `src/components/Transaction/TransactionForm.tsx` — input/select/nút kính.
- `src/pages/Login.tsx`, `Register.tsx` — thẻ kính giữa nền aurora.
- `src/pages/Dashboard.tsx` — thẻ kính, count-up, dùng token màu ngữ nghĩa, chart hợp tông.
- `src/pages/Transactions.tsx`, `Categories.tsx`, `Statistics.tsx`, `Savings.tsx` — chuyển sang class kính, gỡ màu inline.

Có thể thêm: `src/hooks/useCountUp.ts` (hook đếm số).

## 8. Ràng buộc & tiêu chí thành công

- Không thêm dependency npm mới (chỉ CSS + hook tự viết).
- `npm run build` (tsc + vite) pass, không lỗi TypeScript.
- Responsive giữ nguyên hành vi: mobile có hamburger, sidebar trượt, grid 1 cột; desktop nhiều cột.
- Đổi theme tức thì, không nháy khi tải lại trang (F5).
- Tôn trọng `prefers-reduced-motion`.
- Mọi trang dùng chung hệ token — không còn mã màu hardcode rải rác cho các giá trị ngữ nghĩa chính.
- Firebase / logic dữ liệu không đổi — chỉ thay lớp trình bày.

## 9. Ngoài phạm vi (YAGNI)

- Không đổi cấu trúc dữ liệu, service, hay logic Firebase.
- Không thêm trang/tính năng mới.
- Không đa ngôn ngữ; giữ tiếng Việt như hiện tại.
- Không tối ưu bundle/code-splitting trong lần này (việc riêng).
