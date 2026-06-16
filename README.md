# 💰 Personal Finance — Web Quản Lý Chi Tiêu Cá Nhân

Ứng dụng web quản lý chi tiêu cá nhân đa người dùng. Bản hiện tại chạy hoàn toàn trên **Firebase** (Auth + Cloud Firestore) và deploy tĩnh lên **Vercel** — không cần server riêng, dữ liệu lưu trữ vĩnh viễn trên cloud.

> 📦 Thư mục `backend/` (ASP.NET Core + SQLite) là **bản cũ, giữ lại để tham khảo** và không còn dùng khi deploy. Xem mục [Kiến trúc](#kiến-trúc).

---

## Tính năng

- **Đăng ký / Đăng nhập** — Firebase Auth (email + mật khẩu), mỗi người dùng có dữ liệu riêng biệt
- **Giao dịch** — thêm, sửa, xóa thu/chi; lọc theo tháng/năm
- **Danh mục** — quản lý danh mục tùy chỉnh với icon và màu sắc
- **Tiết kiệm 🐷** — tạo quỹ mục tiêu, nạp tiền, theo dõi tiến độ
- **Thống kê** — biểu đồ tròn theo danh mục, biểu đồ cột thu/chi theo tháng
- **Dashboard** — tổng quan tháng hiện tại, biểu đồ chi tiêu 7 ngày gần nhất

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Auth | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore |
| Charts | Recharts |
| State | Zustand |
| Hosting | Vercel (static SPA) |

---

## Kiến trúc

```
frontend/ (React + Vite)  ──►  Firebase Auth   (đăng nhập)
                          ──►  Cloud Firestore (dữ liệu)
        │
        └── deploy tĩnh ──► Vercel
```

**Mô hình dữ liệu Firestore** (mỗi user một nhánh riêng):

```
users/{uid}                      → { fullName, email, createdAt }
users/{uid}/categories/{id}      → { name, icon, color, type, isDefault }
users/{uid}/transactions/{id}    → { amount, type, categoryId, note, date, createdAt }
users/{uid}/savingsGoals/{id}    → { name, icon, color, targetAmount, deadline, isDefault, createdAt }
users/{uid}/savingsEntries/{id}  → { goalId, amount, note, date, createdAt }
```

- Số dư, tổng tiết kiệm, `currentAmount` của quỹ, và thông tin danh mục trên giao dịch đều được **tính / join phía client**.
- Quy tắc bảo mật trong `firestore.rules`: mỗi user chỉ đọc/ghi được nhánh `users/{uid}` của mình.

---

## Thiết lập Firebase (1 lần)

1. Vào [Firebase Console](https://console.firebase.google.com) → **Add project** → đặt tên (vd: `chi-tieu`).
2. **Build → Authentication → Get started → Sign-in method →** bật **Email/Password**.
3. **Build → Firestore Database → Create database →** chọn vùng (vd: `asia-southeast1`), bắt đầu ở **Production mode**.
4. Vào tab **Rules** của Firestore, dán nội dung file [`firestore.rules`](./firestore.rules) rồi **Publish**.
5. **Project settings (⚙) → General → Your apps →** bấm biểu tượng Web `</>` để tạo Web App, sao chép object `firebaseConfig` (apiKey, authDomain, projectId, ...).

---

## Chạy local

```bash
cd frontend
npm install

# Tạo file cấu hình từ mẫu rồi điền giá trị từ firebaseConfig
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local

npm run dev
```

Mở `http://localhost:5173`. Các biến cần điền trong `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> `.env.local` đã được `.gitignore` — không commit key lên git.

---

## Deploy lên Vercel

1. Push code lên GitHub.
2. Vào [vercel.com](https://vercel.com) → **Add New → Project** → import repo này.
3. Cấu hình project:
   - **Root Directory**: `frontend`
   - Framework Preset: **Vite** (tự nhận diện), Build Command / Output đã có sẵn trong `frontend/vercel.json`.
4. **Settings → Environment Variables**: thêm 6 biến `VITE_FIREBASE_*` ở trên (cho cả Production & Preview).
5. **Deploy**. Sau khi xong, mở domain Vercel cấp.
6. Quay lại Firebase **Authentication → Settings → Authorized domains**, thêm domain Vercel (vd: `your-app.vercel.app`) để đăng nhập hoạt động trên production.

Mỗi lần `git push` lên nhánh chính, Vercel tự build & deploy lại. Dữ liệu nằm trên Firestore nên **không bị mất** giữa các lần deploy.

---

## Danh mục & quỹ mặc định

Khi đăng ký tài khoản mới, hệ thống tự seed:

**Chi tiêu:** 🍔 Ăn uống · 🚗 Di chuyển · 🎮 Giải trí · 🛍️ Mua sắm · 💊 Sức khỏe · 📄 Hóa đơn
**Thu nhập:** 💰 Lương · 🎁 Thưởng · 📈 Đầu tư · 💡 Khác
**Tiết kiệm:** 🐷 Tiết kiệm chung (quỹ mặc định, không xóa được)

---

## Cấu trúc thư mục

```
web-quan-li-chi-tieu/
├── frontend/                   # React + Vite (phần được deploy)
│   ├── src/
│   │   ├── components/         # Sidebar, Modal, TransactionForm
│   │   ├── pages/              # Dashboard, Transactions, Categories, Statistics, Savings, Login, Register
│   │   ├── services/           # firebase.ts + các service gọi Firestore/Auth
│   │   ├── store/              # Zustand (auth, categories)
│   │   └── types/              # TypeScript interfaces
│   ├── .env.example            # mẫu biến môi trường Firebase
│   └── vercel.json             # cấu hình deploy Vercel (SPA rewrite)
│
├── firestore.rules             # Quy tắc bảo mật Firestore
├── backend/                    # (LEGACY) ASP.NET Core + SQLite — không dùng khi deploy
└── docs/superpowers/specs/     # Tài liệu thiết kế
```
