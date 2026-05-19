# 💰 Personal Finance — Web Quản Lý Chi Tiêu Cá Nhân

Ứng dụng web quản lý chi tiêu cá nhân đa người dùng, xây dựng với **ASP.NET Core Web API** và **React + Vite**.

---

## Tính năng

- **Đăng ký / Đăng nhập** — mỗi người dùng có tài khoản và dữ liệu riêng biệt
- **Giao dịch** — thêm, sửa, xóa thu/chi; lọc theo tháng/năm
- **Danh mục** — quản lý danh mục tùy chỉnh với icon và màu sắc
- **Thống kê** — biểu đồ tròn theo danh mục, biểu đồ cột so sánh thu/chi theo tháng
- **Dashboard** — tổng quan nhanh tháng hiện tại, biểu đồ 7 ngày gần nhất

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | ASP.NET Core 8 Web API (C#) |
| Frontend | React 18 + Vite + TypeScript |
| Database | SQLite + Entity Framework Core |
| Auth | JWT Bearer Token |
| Charts | Recharts |
| State | Zustand |

---

## Yêu cầu hệ thống

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 18+](https://nodejs.org/) (khuyến nghị 20.x)
- [npm 9+](https://www.npmjs.com/)

---

## Cài đặt & Chạy

### 1. Clone repository

```bash
git clone https://github.com/tiennguyen1601/personal-finance.git
cd personal-finance
```

### 2. Chạy Backend

```bash
cd backend
dotnet restore
dotnet run --launch-profile http
```

Backend sẽ chạy tại `http://localhost:5178`

> Database SQLite (`expense_tracker.db`) sẽ tự động được tạo và migrate khi khởi động lần đầu.

### 3. Chạy Frontend (chế độ Development)

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server chạy tại `http://localhost:5173`

> Ở chế độ dev, mọi request `/api/*` sẽ tự động proxy sang backend `localhost:5178`.

---

## Build Production (chỉ cần 1 process)

```bash
# Bước 1: Build frontend ra wwwroot
cd frontend
npm install
npm run build

# Bước 2: Chạy backend (serve cả API + frontend)
cd ../backend
dotnet run --launch-profile http
```

Truy cập ứng dụng tại `http://localhost:5178`

---

## Cấu trúc thư mục

```
personal-finance/
├── backend/                    # ASP.NET Core Web API
│   ├── Controllers/            # API endpoints
│   ├── Data/                   # DbContext + DbSeeder
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Migrations/             # EF Core migrations
│   ├── Models/                 # Entity models
│   ├── Services/               # Business logic
│   ├── wwwroot/                # React build output (tự sinh khi build)
│   ├── appsettings.json        # Cấu hình app
│   └── Program.cs              # Entry point + DI + Middleware
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── components/         # Sidebar, Modal, TransactionForm
│       ├── pages/              # Dashboard, Transactions, Categories, Statistics
│       ├── services/           # Axios API calls
│       ├── store/              # Zustand state (auth, categories)
│       └── types/              # TypeScript interfaces
│
└── docs/
    └── superpowers/
        ├── specs/              # Design specification
        └── plans/              # Implementation plan
```

---

## API Endpoints

Tất cả endpoints (trừ `/api/auth/*`) yêu cầu header:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập |

**Ví dụ đăng ký:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "123456",
  "fullName": "Nguyễn Văn A"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com"
}
```

### Transactions
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/transactions?month=5&year=2026` | Lấy danh sách giao dịch |
| POST | `/api/transactions` | Thêm giao dịch mới |
| PUT | `/api/transactions/{id}` | Cập nhật giao dịch |
| DELETE | `/api/transactions/{id}` | Xóa giao dịch |

### Categories
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/categories` | Lấy tất cả danh mục |
| POST | `/api/categories` | Thêm danh mục mới |
| PUT | `/api/categories/{id}` | Cập nhật danh mục |
| DELETE | `/api/categories/{id}` | Xóa danh mục (không xóa được mặc định) |

### Statistics
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/statistics/summary?month=5&year=2026` | Tổng thu/chi/số dư |
| GET | `/api/statistics/monthly?year=2026` | Thu/chi theo từng tháng |
| GET | `/api/statistics/by-category?month=5&year=2026` | Chi tiêu theo danh mục |

---

## Hướng dẫn sử dụng

### Đăng ký tài khoản

1. Truy cập `http://localhost:5178` (hoặc `http://localhost:5173` khi dev)
2. Nhấn **Đăng ký** ở trang login
3. Nhập họ tên, email, mật khẩu (tối thiểu 6 ký tự)
4. Sau khi đăng ký, hệ thống tự tạo **10 danh mục mặc định**

### Thêm giao dịch

1. Vào trang **Giao dịch** từ sidebar
2. Nhấn **+ Thêm giao dịch**
3. Chọn loại: Chi tiêu hoặc Thu nhập
4. Nhập số tiền, chọn danh mục, ngày, ghi chú (tùy chọn)
5. Nhấn **Thêm mới**

### Quản lý danh mục

1. Vào trang **Danh mục** từ sidebar
2. Nhấn **+ Thêm danh mục** để tạo danh mục mới
3. Chọn icon, màu sắc, tên và loại (Thu/Chi)
4. Danh mục **mặc định** không thể xóa, danh mục tự tạo có thể sửa/xóa

### Xem thống kê

1. Vào trang **Thống kê** từ sidebar
2. Chọn tháng/năm muốn xem
3. **Biểu đồ tròn**: tỷ lệ chi tiêu theo từng danh mục trong tháng
4. **Biểu đồ cột**: so sánh tổng thu và tổng chi theo 12 tháng của năm

---

## Cấu hình

Chỉnh sửa `backend/appsettings.json` nếu cần:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=expense_tracker.db"
  },
  "Jwt": {
    "Key": "your-super-secret-key-at-least-32-characters-long",
    "Issuer": "ExpenseTrackerAPI",
    "Audience": "ExpenseTrackerClient",
    "ExpiryDays": 7
  }
}
```

> **Lưu ý bảo mật:** Thay `Jwt:Key` bằng chuỗi ngẫu nhiên dài ít nhất 32 ký tự trước khi deploy lên production. Không commit key thật lên git.

---

## Danh mục mặc định

Khi đăng ký tài khoản mới, hệ thống tự tạo sẵn:

**Chi tiêu:** 🍔 Ăn uống · 🚗 Di chuyển · 🎮 Giải trí · 🛍️ Mua sắm · 💊 Sức khỏe · 📄 Hóa đơn

**Thu nhập:** 💰 Lương · 🎁 Thưởng · 📈 Đầu tư · 💡 Khác
