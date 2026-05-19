# Web Quản Lý Chi Tiêu Cá Nhân — Design Spec

**Ngày:** 2026-05-19  
**Trạng thái:** Approved

---

## Tổng quan

Web app quản lý chi tiêu cá nhân cho nhiều người dùng. Mỗi người có tài khoản riêng, dữ liệu hoàn toàn tách biệt. Tính năng cốt lõi: ghi nhận giao dịch thu/chi, phân loại theo danh mục, xem thống kê bằng biểu đồ.

---

## Kiến trúc

**Stack:**
- Backend: ASP.NET Core Web API (C#)
- Frontend: React + Vite (TypeScript)
- Database: SQLite + Entity Framework Core
- Auth: JWT Bearer Token
- Charts: Recharts
- State: Zustand

**Kiến trúc deployment:** .NET host luôn React static files. React build output được copy vào `backend/wwwroot/`. Một process duy nhất phục vụ cả API lẫn UI.

**Cấu trúc thư mục:**
```
web-quan-li-chi-tieu/
├── backend/
│   ├── Controllers/
│   ├── Models/
│   ├── DTOs/
│   ├── Services/
│   ├── Data/                   # DbContext, migrations
│   ├── wwwroot/                # React build output
│   └── Program.cs
├── frontend/
│   ├── src/
│   │   ├── pages/              # Dashboard, Transactions, Categories, Statistics
│   │   ├── components/         # Sidebar, Charts, Forms, Table
│   │   ├── services/           # axios API calls
│   │   └── store/              # Zustand stores
│   └── vite.config.ts
└── README.md
```

---

## Database Schema

### Users
| Field | Type | Note |
|-------|------|------|
| Id | int PK | auto-increment |
| Email | string | unique |
| PasswordHash | string | bcrypt |
| FullName | string | |
| CreatedAt | datetime | |

### Categories
| Field | Type | Note |
|-------|------|------|
| Id | int PK | |
| UserId | int FK | → Users |
| Name | string | |
| Icon | string | emoji hoặc icon name |
| Color | string | hex color |
| Type | enum | Income \| Expense |
| IsDefault | bool | danh mục mặc định không xóa được |

### Transactions
| Field | Type | Note |
|-------|------|------|
| Id | int PK | |
| UserId | int FK | → Users |
| CategoryId | int FK | → Categories |
| Amount | decimal | luôn dương |
| Type | enum | Income \| Expense |
| Note | string | nullable |
| Date | date | ngày giao dịch |
| CreatedAt | datetime | |

**Seed data:** Khi user đăng ký, tạo sẵn các danh mục mặc định:
- Expense: Ăn uống, Di chuyển, Giải trí, Mua sắm, Sức khỏe, Hóa đơn
- Income: Lương, Thưởng, Đầu tư, Khác

---

## API Endpoints

Tất cả endpoints (trừ `/api/auth/*`) yêu cầu `Authorization: Bearer <token>` header.

### Authentication
```
POST /api/auth/register   { email, password, fullName }
POST /api/auth/login      { email, password } → { token, user }
```

### Transactions
```
GET    /api/transactions              ?month=5&year=2026&categoryId=&type=
POST   /api/transactions              { amount, type, categoryId, note, date }
PUT    /api/transactions/{id}         { amount, type, categoryId, note, date }
DELETE /api/transactions/{id}
```

### Categories
```
GET    /api/categories
POST   /api/categories                { name, icon, color, type }
PUT    /api/categories/{id}           { name, icon, color }
DELETE /api/categories/{id}           (chỉ xóa được danh mục không phải mặc định)
```

### Statistics
```
GET /api/statistics/summary           ?month=5&year=2026 → { totalIncome, totalExpense, balance }
GET /api/statistics/monthly           ?year=2026 → [ { month, income, expense } × 12 ]
GET /api/statistics/by-category       ?month=5&year=2026 → [ { category, amount, percentage } ]
```

---

## Giao diện

### Layout chung
Sidebar cố định bên trái, nội dung chính bên phải.

**Sidebar items:**
- Logo / tên app
- Dashboard
- Giao dịch
- Danh mục
- Thống kê
- (dưới cùng) Tên user + Đăng xuất

### Trang 1: Dashboard
- 3 thẻ tóm tắt: Tổng thu, Tổng chi, Số dư (tháng hiện tại)
- Biểu đồ đường: chi tiêu 7 ngày gần nhất
- Bảng 5 giao dịch mới nhất

### Trang 2: Giao dịch
- Bảng danh sách có phân trang (20 dòng/trang)
- Filter: tháng/năm, loại (thu/chi), danh mục
- Nút "Thêm giao dịch" → modal form
- Click hàng → hiện nút sửa/xóa
- Form fields: số tiền, loại, danh mục, ngày, ghi chú

### Trang 3: Danh mục
- Grid hiển thị các danh mục với icon + màu + tên
- Nút thêm danh mục mới → modal form
- Danh mục tùy chỉnh: có nút sửa/xóa
- Danh mục mặc định: chỉ xem, không sửa/xóa

### Trang 4: Thống kê
- Bộ lọc chọn tháng/năm
- Biểu đồ tròn (Pie): tỷ lệ chi tiêu theo danh mục tháng được chọn
- Biểu đồ cột (Bar): so sánh tổng thu / tổng chi theo từng tháng (12 tháng gần nhất)

---

## Bảo mật

- Password hash bằng BCrypt
- JWT token với expiry 7 ngày
- Mọi query đều filter theo `UserId` từ JWT claim — user không truy cập được data của người khác
- HTTPS trong production

---

## Phạm vi KHÔNG bao gồm

- Xuất báo cáo Excel/PDF
- Đặt ngân sách / budget limit
- Nhắc nhở / notification
- Mobile app
