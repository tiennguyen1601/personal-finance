# Design — Chuyển sang Firebase + Deploy Vercel

> Ngày: 2026-06-16
> Mục tiêu: Deploy app quản lý chi tiêu lên **Vercel** với đầy đủ chức năng và **lưu trữ dữ liệu bền vững** (Firebase Auth + Cloud Firestore), bỏ backend .NET khỏi luồng deploy.

## Bối cảnh

App hiện tại gồm:
- **Backend** ASP.NET Core 8 + EF Core + **SQLite** (file `expense_tracker.db`), JWT auth, serve cả API lẫn React build trong `wwwroot`.
- **Frontend** React 18 + Vite + TypeScript + Zustand + Recharts.

Vercel không chạy backend .NET, và SQLite file sẽ mất sau mỗi redeploy (filesystem ephemeral). → Chuyển toàn bộ tầng dữ liệu sang Firebase, deploy frontend tĩnh lên Vercel.

## Quyết định kiến trúc

- **Full Firebase**: frontend gọi thẳng Firebase Auth (email/password) + Firestore.
- **Backend .NET**: giữ lại trong repo để tham khảo, **không deploy**.
- **Bắt đầu dữ liệu mới**: không di trú dữ liệu SQLite cũ.

## Nguyên tắc cốt lõi — giữ nguyên "đường nối" (seam)

Giữ y nguyên tên hàm + kiểu trả về của 5 service module. Chỉ viết lại phần thân để dùng Firebase SDK. Các page hầu như không đổi.

### Thay đổi bắt buộc: ID number → string
Firestore dùng document ID kiểu `string`. Đổi `id` và `categoryId` (và `goalId`, `entryId`) từ `number` → `string` trong `types/index.ts`, sửa các chỗ ép `Number(...)` trên ID trong form/page (chỉnh cơ học).

## Mô hình dữ liệu Firestore

Mỗi user một nhánh riêng dưới `users/{uid}`:

```
users/{uid}                      → { fullName, email, createdAt }
users/{uid}/categories/{id}      → { name, icon, color, type: 'Income'|'Expense', isDefault }
users/{uid}/transactions/{id}    → { amount, type, categoryId, note?, date, createdAt }
users/{uid}/savingsGoals/{id}    → { name, icon, color, targetAmount|null, deadline|null, isDefault, createdAt }
users/{uid}/savingsEntries/{id}  → { goalId, amount, note?, date, createdAt }
```

**Trường tính toán (client-side, không lưu):**
- `SavingsGoal.currentAmount` = tổng `amount` các entry có `goalId` tương ứng.
- `SavingsGoal.isCompleted` = `targetAmount != null && currentAmount >= targetAmount`.
- `Transaction.categoryName/categoryIcon/categoryColor` = join client-side với collection categories (tránh denormalize lệch khi sửa danh mục).

## Tầng service (viết lại, giữ chữ ký)

- **authService**: `register(email, password, fullName)`, `login(email, password)` → dùng `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`; trả `{ token: uid, fullName, email }`. Khi register: set `displayName`, tạo doc `users/{uid}`, seed mặc định.
- **categoryService**: `getAll/create/update/delete` trên `users/{uid}/categories`. Không xóa được `isDefault`.
- **transactionService**: `getAll({month,year,categoryId,type})/create/update/delete` trên `users/{uid}/transactions`; lọc theo tháng/năm client-side hoặc bằng query `date`; enrich category client-side.
- **savingsService**: `getAll/create/update/delete` trên `savingsGoals`; `addEntry(goalId, dto)`/`deleteEntry(entryId)` trên `savingsEntries`. Không xóa được goal `isDefault`. Xóa goal → xóa kèm entries của nó.
- **statisticsService**: `getSummary/getMonthly/getByCategory` — tính client-side từ transactions + savingsEntries. Công thức `balance = totalIncome − totalExpense − totalSaved`.

## Auth & state

- `firebase.ts`: khởi tạo app từ `import.meta.env.VITE_FIREBASE_*`, export `auth` + `db`.
- `authStore` giữ interface (`token/fullName/email/login/logout/isAuthenticated`); nguồn là Firebase.
- `main.tsx`: đăng ký `onAuthStateChanged` để khôi phục phiên sau F5; chỉ render app sau khi biết trạng thái auth.

## Seed mặc định khi đăng ký

Chi: 🍔 Ăn uống · 🚗 Di chuyển · 🎮 Giải trí · 🛍️ Mua sắm · 💊 Sức khỏe · 📄 Hóa đơn
Thu: 💰 Lương · 🎁 Thưởng · 📈 Đầu tư · 💡 Khác
Tiết kiệm: 1 quỹ mặc định "Tiết kiệm chung 🐷" (color #8b5cf6, `isDefault=true`).

## Bảo mật (Firestore Rules)

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Deploy Vercel

- `vite.config.ts`: `build.outDir` về `dist` (bỏ ghi `../backend/wwwroot`); bỏ proxy `/api`.
- `vercel.json`: SPA rewrite tất cả route → `/index.html`.
- Env trên Vercel: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
- Root Directory trên Vercel = `frontend`.

## Dọn dẹp & docs

- Thêm dependency `firebase`; gỡ `axios` + `frontend/src/services/api.ts`.
- `.env.example` cho frontend.
- README: hướng dẫn tạo Firebase project, bật Auth (Email/Password) + Firestore, copy config, set env Vercel, deploy.

## Phạm vi file thay đổi

Sửa: `types/index.ts`, `services/{auth,transaction,category,savings,statistics}Service.ts`, `store/authStore.ts`, `main.tsx`, `vite.config.ts`, các page (ép kiểu ID), `package.json`, `README.md`.
Thêm: `services/firebase.ts`, `vercel.json`, `.env.example`, `firestore.rules`.
Gỡ: `services/api.ts`.

## Phi mục tiêu (out of scope)

- Di trú dữ liệu SQLite cũ.
- Google/social sign-in.
- Realtime listeners (dùng fetch theo nhu cầu như hiện tại).
- Xóa code backend .NET.
