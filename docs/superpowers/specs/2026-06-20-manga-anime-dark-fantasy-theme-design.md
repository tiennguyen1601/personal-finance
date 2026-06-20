# Thiết kế: Hệ giao diện Manga / Anime — phong cách Dark Fantasy

**Ngày:** 2026-06-20
**Nhánh:** `feat/liquid-glass-ui` (sẽ tạo nhánh mới khi thực thi)
**Trạng thái:** Đã chốt hướng, chờ duyệt spec

---

## 1. Mục tiêu

Người dùng cảm thấy giao diện hiện tại (glassmorphism fintech) trông "nghiệp dư, thiếu thẩm mỹ". Thay vì tinh chỉnh nhỏ, ta đổi hẳn sang một bản sắc thị giác mạnh, có cá tính: **Dark Fantasy theo phong cách manga/anime**, cho phép người dùng **chuyển đổi giữa 4 kiểu** như công tắc light/dark.

Tiêu chí thành công:
- Mở app lên thấy "đã mắt" ngay, không còn cảm giác template.
- Chuyển skin/mode mượt, lưu lựa chọn, không nhấp nháy khi tải lại.
- Vẫn **đọc số liệu tài chính dễ dàng** (đây là app quản lý chi tiêu — không hi sinh tính dùng được vì thẩm mỹ).
- Hỗ trợ đầy đủ tiếng Việt (dấu) ở mọi font.
- Responsive web + mobile như hiện tại.

## 2. Phạm vi

**Trong phạm vi:**
- Hệ theme 2 trục (skin × mode) → 4 kiểu, kèm UI chuyển đổi.
- Lớp token CSS dark-fantasy cho cả 4 kiểu.
- Lớp nền trang trí theo skin (halftone/speed-lines cho manga; tro lửa/tinh vân cho anime).
- Chuẩn hóa component dùng chung về token + thang spacing 4/8px.
- Polish từng trang: Dashboard, Transactions, Categories, Savings, Statistics.
- Typography (font display + body hỗ trợ tiếng Việt).

**Ngoài phạm vi:**
- Thay đổi logic nghiệp vụ, service, backend, schema dữ liệu.
- Mascot/nhân vật (đã chốt: không làm ở đợt này — có thể thêm sau).
- Tối ưu bundle size (việc riêng, không thuộc redesign này).

## 3. Quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Số kiểu | 4: Manga-Sáng, Manga-Tối, Anime-Sáng, Anime-Tối |
| Cảm hứng | Dark Fantasy (Berserk / Made in Abyss / Solo Leveling) |
| Cơ chế | 2 trục độc lập: `data-skin` (manga/anime) + `data-mode` (light/dark) |
| Theme mặc định | **Anime-Tối** |
| Font heading | Tông gothic/fantasy, **bắt buộc hỗ trợ tiếng Việt** |
| Mascot | Không (để sau) |

## 4. Kiến trúc theme

### 4.1. Hai thuộc tính trên `<html>`
- `data-skin="manga" | "anime"`
- `data-mode="light" | "dark"`

CSS tổ chức 3 lớp:
1. **Token màu** — 4 khối: `[data-skin="manga"][data-mode="light"]`, `…manga…dark`, `…anime…light`, `…anime…dark`. Mỗi khối định nghĩa biến màu (`--accent`, `--page-bg`, `--text`, `--surface`, …).
2. **Token cấu trúc theo skin** — `[data-skin="manga"]` (góc sắc, viền dày, halftone, không glow) vs `[data-skin="anime"]` (bo tròn, glow, gradient). Định nghĩa `--radius`, `--border-width`, `--surface-decoration`, `--shadow/glow`.
3. **Token chung** — thang spacing, typography scale, z-index.

### 4.2. State & lưu trữ
- Mở rộng `appStore` (Zustand): thêm `skin`, `mode` + actions `setSkin`, `setMode`.
- Lưu `localStorage` keys `app-skin`, `app-mode`.
- **Chống nhấp nháy (FOUC):** script inline nhỏ trong `index.html` đọc localStorage và set `data-skin`/`data-mode` lên `<html>` **trước khi** React mount.
- Mặc định lần đầu: `skin=anime`, `mode=dark`.

### 4.3. UI chuyển đổi (trong sidebar)
Thay nút theme 3-trạng-thái hiện tại bằng **2 control**:
- Chọn skin: 📖 Manga ⇄ ✨ Anime (toggle/segmented).
- Chọn mode: ☀️ Sáng ⇄ 🌙 Tối (toggle).

## 5. Bảng màu Dark Fantasy

Màu neo dùng chung toàn hệ (đổi sắc độ theo từng kiểu):

| Vai trò | Token | Giá trị nền tảng |
|---|---|---|
| Huyết (accent chính) | `--accent` | crimson `#b91c1c` → `#ef4444` |
| Hắc ám (arcane) | `--arcane` | violet `#7c3aed` → `#a855f7` |
| Vàng nguyền (ornament) | `--ornament` | gold `#d4af37` → `#fbbf24` |
| Obsidian (nền tối) | — | `#0a0a0f` |
| Parchment (nền manga sáng) | — | `#efe9da` |

### Ánh xạ ngữ nghĩa tài chính (giữ token cũ để không vỡ)
- Chốt ánh xạ: thu (`--income`) = **emerald đậm**, chi (`--expense`) = **crimson**, tiết kiệm (`--saving`) = **arcane violet**, số dư (`--balance`) = **gold**. Mỗi role một màu riêng, tinh chỉnh sắc độ mỗi kiểu để đủ tương phản chữ.

### 4 kiểu cụ thể
- **Manga-Sáng** — mực đen `#14110f` trên giấy da `#efe9da`; screentone chấm; accent crimson; viền mực dày, góc sắc. (trang truyện Berserk)
- **Manga-Tối** — mực trắng/xương `#e8e2d0` trên nền đen `#0a0a0f`; halftone đảo; glow huyết nhẹ. (panel ban đêm, kịch tính nhất của manga)
- **Anime-Sáng** — nền lavender mờ `#ece8f5`; chữ plum đậm `#2e1065`; gradient violet→magenta; lấp lánh vàng. (ma thuật ban ngày)
- **Anime-Tối** ⭐ (showpiece) — nền void `#0b0712` + tinh vân violet/crimson; tro lửa trôi; glow phát sáng; chữ `#ede9fe`. (Solo Leveling UI)

## 6. Ngôn ngữ thị giác theo skin

**📖 Manga**
- Góc sắc (`--radius` ≈ 2–4px), viền mực dày 2–3px.
- Nền bề mặt: halftone (lưới chấm bằng `radial-gradient` lặp).
- Tương phản cao, gần như đơn sắc + 1 accent.
- Bố cục "panel" có rãnh (gutter) giữa các khối.
- Hover thẻ: hiệu ứng *speed-lines* nhẹ.
- Nhãn/section đôi chỗ kiểu SFX (chữ nghiêng, mạnh).

**✨ Anime**
- Bo tròn mềm (`--radius` ≈ 16–20px), viền mảnh phát sáng.
- Bề mặt glass + glow; gradient cho nút/thanh tiến độ.
- Focus input phát sáng; chuyển động mượt.
- Nền: tro lửa/tinh vân trôi (thay aurora blob).

→ Cả hai dùng chung palette dark-fantasy nên không lệch "thế giới".

## 7. Lớp nền trang trí

Component mới `ThemeBackdrop` (thay/mở rộng `.aurora` hiện tại), render theo `data-skin`:
- **manga:** lớp halftone phủ mờ + (tùy chọn) speed-lines góc.
- **anime:** các đốm tinh vân blur + hạt "tro lửa" bay lên (CSS animation, không cần ảnh).
Tôn trọng `prefers-reduced-motion` (tắt animation khi user yêu cầu).

## 8. Typography

- **Body:** `Be Vietnam Pro` — hỗ trợ tiếng Việt tốt, sạch, dễ đọc số.
- **Heading (display):** font tông gothic/fantasy **có hỗ trợ tiếng Việt**. Ứng viên: `Playfair Display` (serif kịch tính, có subset Việt) làm mặc định; cân nhắc heading riêng cho manga (`Oswald` condensed mạnh, có Việt) nếu hợp. **Bắt buộc kiểm tra glyph dấu tiếng Việt khi thực thi**, có fallback hệ thống.
- Nạp font qua `<link>` Google Fonts trong `index.html` (app chạy online; có fallback).
- **Thang typography & spacing** chuẩn hóa (4/8px) thay cho số magic inline rải rác — đây là yếu tố then chốt loại bỏ cảm giác "non".

## 9. Chuẩn hóa component dùng chung

Gỡ inline-style magic, đưa về class + token: `StatCard`, `.glass-card`, `.glass-btn*`, `.glass-input/select`, `.chip`, sidebar/nav, skeleton, empty state, toast. Khi các component nền này theo token, **mọi trang tự động nâng cấp**.

## 10. Polish từng trang
- **Dashboard:** stat card kiểu "thẻ bài/khung phép" (manga: ô panel có viền; anime: thẻ glow), biểu đồ đổi màu theo theme (đọc CSS var), "giao dịch gần nhất" có nhịp & icon rõ.
- **Transactions / Categories / Savings:** bảng/thẻ/form theo skin; thanh tiến độ tiết kiệm dùng gradient arcane/gold.
- **Statistics:** màu biểu đồ recharts đọc từ token theo theme hiện hành.

## 11. Cách triển khai (theo phase)
1. **Theme engine**: `data-skin/data-mode`, store, localStorage, chống FOUC, UI chuyển đổi.
2. **Token & màu**: 4 khối palette + token cấu trúc theo skin + typography/spacing scale.
3. **Lớp nền trang trí** `ThemeBackdrop`.
4. **Component dùng chung** chuẩn hóa về token.
5. **Polish từng trang** + màu biểu đồ.

Mỗi phase build sạch (không lỗi TS/Vite) trước khi sang phase sau.

## 12. Rủi ro & lưu ý
- **Tương phản chữ trên nền tối/halftone** — phải đạt đủ độ đọc cho số tiền. Kiểm tra từng kiểu.
- **Glyph tiếng Việt của font display** — xác nhận trước khi chốt font; có fallback.
- **Hiệu năng nền động** — giới hạn số hạt, tôn trọng `prefers-reduced-motion`.
- **Không phá logic** — chỉ đụng lớp trình bày; service/store data giữ nguyên (chỉ thêm state theme).
