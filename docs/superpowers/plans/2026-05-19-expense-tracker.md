# Web Quản Lý Chi Tiêu Cá Nhân — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng web app quản lý chi tiêu cá nhân đa người dùng với backend .NET C# Web API và frontend React, SQLite làm database.

**Architecture:** .NET ASP.NET Core Web API serve cả REST API lẫn React static files từ `wwwroot/`. Frontend React (Vite + TypeScript) được build ra và copy vào `wwwroot/`. JWT Bearer Token cho authentication, Entity Framework Core + SQLite cho data layer.

**Tech Stack:** .NET 8, ASP.NET Core Web API, Entity Framework Core, SQLite, BCrypt, JWT — React 18, Vite, TypeScript, Axios, Zustand, Recharts, React Router v6

---

## File Map

### Backend (`backend/`)
```
backend/
├── backend.csproj
├── Program.cs
├── appsettings.json
├── Data/
│   ├── AppDbContext.cs
│   └── DbSeeder.cs
├── Models/
│   ├── User.cs
│   ├── Category.cs
│   └── Transaction.cs
├── DTOs/
│   ├── Auth/RegisterDto.cs
│   ├── Auth/LoginDto.cs
│   ├── Auth/AuthResponseDto.cs
│   ├── Category/CategoryDto.cs
│   ├── Category/CreateCategoryDto.cs
│   ├── Transaction/TransactionDto.cs
│   ├── Transaction/CreateTransactionDto.cs
│   └── Statistics/StatisticsDto.cs
├── Services/
│   ├── IAuthService.cs + AuthService.cs
│   ├── ICategoryService.cs + CategoryService.cs
│   ├── ITransactionService.cs + TransactionService.cs
│   └── IStatisticsService.cs + StatisticsService.cs
├── Controllers/
│   ├── AuthController.cs
│   ├── CategoryController.cs
│   ├── TransactionController.cs
│   └── StatisticsController.cs
└── wwwroot/                    # React build output (copy vào đây sau khi build)
```

### Frontend (`frontend/`)
```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/
    │   └── index.ts            # TypeScript interfaces
    ├── services/
    │   ├── api.ts              # axios instance + interceptors
    │   ├── authService.ts
    │   ├── transactionService.ts
    │   ├── categoryService.ts
    │   └── statisticsService.ts
    ├── store/
    │   ├── authStore.ts        # Zustand: user, token
    │   └── appStore.ts         # Zustand: categories cache
    ├── components/
    │   ├── Layout/
    │   │   ├── Sidebar.tsx
    │   │   └── AppLayout.tsx
    │   ├── Common/
    │   │   ├── Modal.tsx
    │   │   └── ConfirmDialog.tsx
    │   └── Transaction/
    │       └── TransactionForm.tsx
    └── pages/
        ├── Login.tsx
        ├── Register.tsx
        ├── Dashboard.tsx
        ├── Transactions.tsx
        ├── Categories.tsx
        └── Statistics.tsx
```

---

## Task 1: Khởi tạo Backend .NET project

**Files:**
- Create: `backend/backend.csproj`
- Create: `backend/Program.cs`
- Create: `backend/appsettings.json`

- [ ] **Step 1: Tạo .NET Web API project**

```bash
cd D:\BE\web-quan-li-chi-tieu
dotnet new webapi -n backend --no-openapi
cd backend
```

- [ ] **Step 2: Cài các NuGet packages cần thiết**

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package System.IdentityModel.Tokens.Jwt
```

- [ ] **Step 3: Cập nhật `appsettings.json`**

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
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

- [ ] **Step 4: Xóa file mặc định không cần thiết**

```bash
rm WeatherForecast.cs
rm Controllers/WeatherForecastController.cs
```

- [ ] **Step 5: Commit**

```bash
cd D:\BE\web-quan-li-chi-tieu
git init
git add backend/
git commit -m "feat: initialize .NET Web API project"
```

---

## Task 2: Models & DbContext

**Files:**
- Create: `backend/Models/User.cs`
- Create: `backend/Models/Category.cs`
- Create: `backend/Models/Transaction.cs`
- Create: `backend/Data/AppDbContext.cs`

- [ ] **Step 1: Tạo `Models/User.cs`**

```csharp
namespace backend.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
```

- [ ] **Step 2: Tạo `Models/Category.cs`**

```csharp
namespace backend.Models;

public enum TransactionType { Income, Expense }

public class Category
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public TransactionType Type { get; set; }
    public bool IsDefault { get; set; } = false;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
```

- [ ] **Step 3: Tạo `Models/Transaction.cs`**

```csharp
namespace backend.Models;

public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CategoryId { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
```

- [ ] **Step 4: Tạo `Data/AppDbContext.cs`**

```csharp
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Category>()
            .Property(c => c.Type).HasConversion<string>();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Type).HasConversion<string>();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount).HasColumnType("decimal(18,2)");
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/Models/ backend/Data/
git commit -m "feat: add models and DbContext"
```

---

## Task 3: Database migration & Seed dữ liệu mặc định

**Files:**
- Create: `backend/Data/DbSeeder.cs`
- Modify: `backend/Program.cs`

- [ ] **Step 1: Tạo `Data/DbSeeder.cs`**

```csharp
using backend.Models;

namespace backend.Data;

public static class DbSeeder
{
    public static void SeedDefaultCategories(AppDbContext db, int userId)
    {
        var defaults = new List<Category>
        {
            new() { UserId = userId, Name = "Ăn uống", Icon = "🍔", Color = "#ef4444", Type = TransactionType.Expense, IsDefault = true },
            new() { UserId = userId, Name = "Di chuyển", Icon = "🚗", Color = "#f97316", Type = TransactionType.Expense, IsDefault = true },
            new() { UserId = userId, Name = "Giải trí", Icon = "🎮", Color = "#a855f7", Type = TransactionType.Expense, IsDefault = true },
            new() { UserId = userId, Name = "Mua sắm", Icon = "🛍️", Color = "#ec4899", Type = TransactionType.Expense, IsDefault = true },
            new() { UserId = userId, Name = "Sức khỏe", Icon = "💊", Color = "#22c55e", Type = TransactionType.Expense, IsDefault = true },
            new() { UserId = userId, Name = "Hóa đơn", Icon = "📄", Color = "#64748b", Type = TransactionType.Expense, IsDefault = true },
            new() { UserId = userId, Name = "Lương", Icon = "💰", Color = "#16a34a", Type = TransactionType.Income, IsDefault = true },
            new() { UserId = userId, Name = "Thưởng", Icon = "🎁", Color = "#0891b2", Type = TransactionType.Income, IsDefault = true },
            new() { UserId = userId, Name = "Đầu tư", Icon = "📈", Color = "#7c3aed", Type = TransactionType.Income, IsDefault = true },
            new() { UserId = userId, Name = "Khác", Icon = "💡", Color = "#78716c", Type = TransactionType.Income, IsDefault = true },
        };
        db.Categories.AddRange(defaults);
        db.SaveChanges();
    }
}
```

- [ ] **Step 2: Tạo migration**

```bash
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Expected output: `Done. To undo this action, use 'ef migrations remove'`

- [ ] **Step 3: Commit**

```bash
git add backend/Data/DbSeeder.cs backend/Migrations/
git commit -m "feat: add database migration and category seeder"
```

---

## Task 4: DTOs

**Files:**
- Create: `backend/DTOs/Auth/RegisterDto.cs`
- Create: `backend/DTOs/Auth/LoginDto.cs`
- Create: `backend/DTOs/Auth/AuthResponseDto.cs`
- Create: `backend/DTOs/Category/CategoryDto.cs`
- Create: `backend/DTOs/Category/CreateCategoryDto.cs`
- Create: `backend/DTOs/Transaction/TransactionDto.cs`
- Create: `backend/DTOs/Transaction/CreateTransactionDto.cs`
- Create: `backend/DTOs/Statistics/StatisticsDto.cs`

- [ ] **Step 1: Tạo `DTOs/Auth/RegisterDto.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class RegisterDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FullName { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Tạo `DTOs/Auth/LoginDto.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
```

- [ ] **Step 3: Tạo `DTOs/Auth/AuthResponseDto.cs`**

```csharp
namespace backend.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
```

- [ ] **Step 4: Tạo `DTOs/Category/CategoryDto.cs`**

```csharp
namespace backend.DTOs.Category;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
```

- [ ] **Step 5: Tạo `DTOs/Category/CreateCategoryDto.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Category;

public class CreateCategoryDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Icon { get; set; } = string.Empty;

    [Required]
    public string Color { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = string.Empty; // "Income" | "Expense"
}
```

- [ ] **Step 6: Tạo `DTOs/Transaction/TransactionDto.cs`**

```csharp
namespace backend.DTOs.Transaction;

public class TransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
}
```

- [ ] **Step 7: Tạo `DTOs/Transaction/CreateTransactionDto.cs`**

```csharp
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Transaction;

public class CreateTransactionDto
{
    [Required, Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public string Type { get; set; } = string.Empty; // "Income" | "Expense"

    [Required]
    public int CategoryId { get; set; }

    public string? Note { get; set; }

    [Required]
    public DateTime Date { get; set; }
}
```

- [ ] **Step 8: Tạo `DTOs/Statistics/StatisticsDto.cs`**

```csharp
namespace backend.DTOs.Statistics;

public class SummaryDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; }
}

public class MonthlyDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
}

public class ByCategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}
```

- [ ] **Step 9: Commit**

```bash
git add backend/DTOs/
git commit -m "feat: add DTOs for all resources"
```

---

## Task 5: AuthService & JWT

**Files:**
- Create: `backend/Services/IAuthService.cs`
- Create: `backend/Services/AuthService.cs`

- [ ] **Step 1: Tạo `Services/IAuthService.cs`**

```csharp
using backend.DTOs.Auth;

namespace backend.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}
```

- [ ] **Step 2: Tạo `Services/AuthService.cs`**

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.DTOs.Auth;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            throw new InvalidOperationException("Email đã được sử dụng.");

        var user = new User
        {
            Email = dto.Email,
            FullName = dto.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        DbSeeder.SeedDefaultCategories(_db, user.Id);

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            FullName = user.FullName,
            Email = user.Email
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email)
            ?? throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            FullName = user.FullName,
            Email = user.Email
        };
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(int.Parse(_config["Jwt:ExpiryDays"]!)),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/Services/IAuthService.cs backend/Services/AuthService.cs
git commit -m "feat: add AuthService with JWT generation"
```

---

## Task 6: CategoryService & TransactionService & StatisticsService

**Files:**
- Create: `backend/Services/ICategoryService.cs`
- Create: `backend/Services/CategoryService.cs`
- Create: `backend/Services/ITransactionService.cs`
- Create: `backend/Services/TransactionService.cs`
- Create: `backend/Services/IStatisticsService.cs`
- Create: `backend/Services/StatisticsService.cs`

- [ ] **Step 1: Tạo `Services/ICategoryService.cs`**

```csharp
using backend.DTOs.Category;

namespace backend.Services;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(int userId);
    Task<CategoryDto> CreateAsync(int userId, CreateCategoryDto dto);
    Task<CategoryDto> UpdateAsync(int userId, int id, CreateCategoryDto dto);
    Task DeleteAsync(int userId, int id);
}
```

- [ ] **Step 2: Tạo `Services/CategoryService.cs`**

```csharp
using backend.Data;
using backend.DTOs.Category;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;
    public CategoryService(AppDbContext db) => _db = db;

    public async Task<List<CategoryDto>> GetAllAsync(int userId)
    {
        return await _db.Categories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Type).ThenBy(c => c.Name)
            .Select(c => ToDto(c))
            .ToListAsync();
    }

    public async Task<CategoryDto> CreateAsync(int userId, CreateCategoryDto dto)
    {
        var type = Enum.Parse<TransactionType>(dto.Type);
        var category = new Category
        {
            UserId = userId,
            Name = dto.Name,
            Icon = dto.Icon,
            Color = dto.Color,
            Type = type
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task<CategoryDto> UpdateAsync(int userId, int id, CreateCategoryDto dto)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId)
            ?? throw new KeyNotFoundException("Danh mục không tồn tại.");

        category.Name = dto.Name;
        category.Icon = dto.Icon;
        category.Color = dto.Color;
        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task DeleteAsync(int userId, int id)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId)
            ?? throw new KeyNotFoundException("Danh mục không tồn tại.");

        if (category.IsDefault)
            throw new InvalidOperationException("Không thể xóa danh mục mặc định.");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }

    private static CategoryDto ToDto(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Icon = c.Icon,
        Color = c.Color,
        Type = c.Type.ToString(),
        IsDefault = c.IsDefault
    };
}
```

- [ ] **Step 3: Tạo `Services/ITransactionService.cs`**

```csharp
using backend.DTOs.Transaction;

namespace backend.Services;

public interface ITransactionService
{
    Task<List<TransactionDto>> GetAllAsync(int userId, int? month, int? year, int? categoryId, string? type);
    Task<TransactionDto> CreateAsync(int userId, CreateTransactionDto dto);
    Task<TransactionDto> UpdateAsync(int userId, int id, CreateTransactionDto dto);
    Task DeleteAsync(int userId, int id);
}
```

- [ ] **Step 4: Tạo `Services/TransactionService.cs`**

```csharp
using backend.Data;
using backend.DTOs.Transaction;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _db;
    public TransactionService(AppDbContext db) => _db = db;

    public async Task<List<TransactionDto>> GetAllAsync(int userId, int? month, int? year, int? categoryId, string? type)
    {
        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);

        if (month.HasValue) query = query.Where(t => t.Date.Month == month.Value);
        if (year.HasValue) query = query.Where(t => t.Date.Year == year.Value);
        if (categoryId.HasValue) query = query.Where(t => t.CategoryId == categoryId.Value);
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TransactionType>(type, out var tType))
            query = query.Where(t => t.Type == tType);

        return await query
            .OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt)
            .Select(t => ToDto(t))
            .ToListAsync();
    }

    public async Task<TransactionDto> CreateAsync(int userId, CreateTransactionDto dto)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == userId)
            ?? throw new KeyNotFoundException("Danh mục không tồn tại.");

        var transaction = new Transaction
        {
            UserId = userId,
            CategoryId = dto.CategoryId,
            Amount = dto.Amount,
            Type = Enum.Parse<TransactionType>(dto.Type),
            Note = dto.Note,
            Date = dto.Date.Date
        };
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();
        await _db.Entry(transaction).Reference(t => t.Category).LoadAsync();
        return ToDto(transaction);
    }

    public async Task<TransactionDto> UpdateAsync(int userId, int id, CreateTransactionDto dto)
    {
        var transaction = await _db.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId)
            ?? throw new KeyNotFoundException("Giao dịch không tồn tại.");

        transaction.Amount = dto.Amount;
        transaction.Type = Enum.Parse<TransactionType>(dto.Type);
        transaction.CategoryId = dto.CategoryId;
        transaction.Note = dto.Note;
        transaction.Date = dto.Date.Date;
        await _db.SaveChangesAsync();
        await _db.Entry(transaction).Reference(t => t.Category).LoadAsync();
        return ToDto(transaction);
    }

    public async Task DeleteAsync(int userId, int id)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId)
            ?? throw new KeyNotFoundException("Giao dịch không tồn tại.");

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
    }

    private static TransactionDto ToDto(Transaction t) => new()
    {
        Id = t.Id,
        Amount = t.Amount,
        Type = t.Type.ToString(),
        Note = t.Note,
        Date = t.Date,
        CreatedAt = t.CreatedAt,
        CategoryId = t.CategoryId,
        CategoryName = t.Category.Name,
        CategoryIcon = t.Category.Icon,
        CategoryColor = t.Category.Color
    };
}
```

- [ ] **Step 5: Tạo `Services/IStatisticsService.cs`**

```csharp
using backend.DTOs.Statistics;

namespace backend.Services;

public interface IStatisticsService
{
    Task<SummaryDto> GetSummaryAsync(int userId, int month, int year);
    Task<List<MonthlyDto>> GetMonthlyAsync(int userId, int year);
    Task<List<ByCategoryDto>> GetByCategoryAsync(int userId, int month, int year);
}
```

- [ ] **Step 6: Tạo `Services/StatisticsService.cs`**

```csharp
using backend.Data;
using backend.DTOs.Statistics;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _db;
    public StatisticsService(AppDbContext db) => _db = db;

    public async Task<SummaryDto> GetSummaryAsync(int userId, int month, int year)
    {
        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && t.Date.Month == month && t.Date.Year == year)
            .ToListAsync();

        var income = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var expense = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        return new SummaryDto { TotalIncome = income, TotalExpense = expense, Balance = income - expense };
    }

    public async Task<List<MonthlyDto>> GetMonthlyAsync(int userId, int year)
    {
        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && t.Date.Year == year)
            .ToListAsync();

        return Enumerable.Range(1, 12).Select(month => new MonthlyDto
        {
            Month = month,
            Year = year,
            Income = transactions.Where(t => t.Date.Month == month && t.Type == TransactionType.Income).Sum(t => t.Amount),
            Expense = transactions.Where(t => t.Date.Month == month && t.Type == TransactionType.Expense).Sum(t => t.Amount)
        }).ToList();
    }

    public async Task<List<ByCategoryDto>> GetByCategoryAsync(int userId, int month, int year)
    {
        var transactions = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date.Month == month && t.Date.Year == year && t.Type == TransactionType.Expense)
            .ToListAsync();

        var total = transactions.Sum(t => t.Amount);

        return transactions
            .GroupBy(t => t.Category)
            .Select(g => new ByCategoryDto
            {
                CategoryId = g.Key.Id,
                CategoryName = g.Key.Name,
                CategoryIcon = g.Key.Icon,
                CategoryColor = g.Key.Color,
                Amount = g.Sum(t => t.Amount),
                Percentage = total == 0 ? 0 : Math.Round(g.Sum(t => t.Amount) / total * 100, 1)
            })
            .OrderByDescending(x => x.Amount)
            .ToList();
    }
}
```

- [ ] **Step 7: Commit**

```bash
git add backend/Services/
git commit -m "feat: add Category, Transaction, Statistics services"
```

---

## Task 7: Controllers

**Files:**
- Create: `backend/Controllers/AuthController.cs`
- Create: `backend/Controllers/CategoryController.cs`
- Create: `backend/Controllers/TransactionController.cs`
- Create: `backend/Controllers/StatisticsController.cs`

- [ ] **Step 1: Tạo `Controllers/AuthController.cs`**

```csharp
using backend.DTOs.Auth;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        try { return Ok(await _auth.RegisterAsync(dto)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        try { return Ok(await _auth.LoginAsync(dto)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
    }
}
```

- [ ] **Step 2: Tạo `Controllers/CategoryController.cs`**

```csharp
using System.Security.Claims;
using backend.DTOs.Category;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _service;
    public CategoryController(ICategoryService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create(CreateCategoryDto dto)
    {
        try { return Ok(await _service.CreateAsync(UserId, dto)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateCategoryDto dto)
    {
        try { return Ok(await _service.UpdateAsync(UserId, id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _service.DeleteAsync(UserId, id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
```

- [ ] **Step 3: Tạo `Controllers/TransactionController.cs`**

```csharp
using System.Security.Claims;
using backend.DTOs.Transaction;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly ITransactionService _service;
    public TransactionController(ITransactionService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] int? categoryId,
        [FromQuery] string? type)
        => Ok(await _service.GetAllAsync(UserId, month, year, categoryId, type));

    [HttpPost]
    public async Task<IActionResult> Create(CreateTransactionDto dto)
    {
        try { return Ok(await _service.CreateAsync(UserId, dto)); }
        catch (KeyNotFoundException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateTransactionDto dto)
    {
        try { return Ok(await _service.UpdateAsync(UserId, id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _service.DeleteAsync(UserId, id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
```

- [ ] **Step 4: Tạo `Controllers/StatisticsController.cs`**

```csharp
using System.Security.Claims;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/statistics")]
[Authorize]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _service;
    public StatisticsController(IStatisticsService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(
        [FromQuery] int month = 0,
        [FromQuery] int year = 0)
    {
        if (month == 0) month = DateTime.Now.Month;
        if (year == 0) year = DateTime.Now.Year;
        return Ok(await _service.GetSummaryAsync(UserId, month, year));
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> Monthly([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.Now.Year;
        return Ok(await _service.GetMonthlyAsync(UserId, year));
    }

    [HttpGet("by-category")]
    public async Task<IActionResult> ByCategory(
        [FromQuery] int month = 0,
        [FromQuery] int year = 0)
    {
        if (month == 0) month = DateTime.Now.Month;
        if (year == 0) year = DateTime.Now.Year;
        return Ok(await _service.GetByCategoryAsync(UserId, month, year));
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/Controllers/
git commit -m "feat: add all API controllers"
```

---

## Task 8: Program.cs — Wiring toàn bộ backend

**Files:**
- Modify: `backend/Program.cs`

- [ ] **Step 1: Viết lại `Program.cs` hoàn chỉnh**

```csharp
using System.Text;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder.Build();

// Migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback — trả về index.html cho mọi route không phải /api/
app.MapFallbackToFile("index.html");

app.Run();
```

- [ ] **Step 2: Build và chạy thử backend**

```bash
cd backend
dotnet build
dotnet run
```

Expected: Server chạy tại `http://localhost:5000` (hoặc port tương tự)

- [ ] **Step 3: Test API nhanh với curl**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"123456\",\"fullName\":\"Test User\"}"
```

Expected: `{"token":"...","fullName":"Test User","email":"test@test.com"}`

- [ ] **Step 4: Commit**

```bash
git add backend/Program.cs
git commit -m "feat: wire up all services and middleware in Program.cs"
```

---

## Task 9: Khởi tạo Frontend React

**Files:**
- Create: `frontend/` (toàn bộ Vite project)
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Tạo Vite React project**

```bash
cd D:\BE\web-quan-li-chi-tieu
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Cài các dependencies**

```bash
npm install axios zustand react-router-dom recharts
npm install -D @types/react-router-dom
```

- [ ] **Step 3: Cập nhật `vite.config.ts`** — proxy API calls đến backend khi dev

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../backend/wwwroot',
    emptyOutDir: true
  }
})
```

- [ ] **Step 4: Tạo `src/types/index.ts`**

```typescript
export interface User {
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
}

export type TransactionType = 'Income' | 'Expense';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  note?: string;
  date: string;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  categoryId: number;
  note?: string;
  date: string;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthlyData {
  month: number;
  year: number;
  income: number;
  expense: number;
}

export interface ByCategoryData {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}
```

- [ ] **Step 5: Commit**

```bash
cd D:\BE\web-quan-li-chi-tieu
git add frontend/
git commit -m "feat: initialize React frontend with Vite"
```

---

## Task 10: API Service layer & Auth Store

**Files:**
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/services/authService.ts`
- Create: `frontend/src/services/categoryService.ts`
- Create: `frontend/src/services/transactionService.ts`
- Create: `frontend/src/services/statisticsService.ts`
- Create: `frontend/src/store/authStore.ts`
- Create: `frontend/src/store/appStore.ts`

- [ ] **Step 1: Tạo `src/services/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

- [ ] **Step 2: Tạo `src/services/authService.ts`**

```typescript
import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  register: (email: string, password: string, fullName: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, fullName }).then(r => r.data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
};
```

- [ ] **Step 3: Tạo `src/services/categoryService.ts`**

```typescript
import api from './api';
import type { Category, CreateCategoryDto } from '../types';

export const categoryService = {
  getAll: () => api.get<Category[]>('/categories').then(r => r.data),
  create: (dto: CreateCategoryDto) => api.post<Category>('/categories', dto).then(r => r.data),
  update: (id: number, dto: CreateCategoryDto) => api.put<Category>(`/categories/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};
```

- [ ] **Step 4: Tạo `src/services/transactionService.ts`**

```typescript
import api from './api';
import type { Transaction, CreateTransactionDto } from '../types';

export const transactionService = {
  getAll: (params?: { month?: number; year?: number; categoryId?: number; type?: string }) =>
    api.get<Transaction[]>('/transactions', { params }).then(r => r.data),
  create: (dto: CreateTransactionDto) => api.post<Transaction>('/transactions', dto).then(r => r.data),
  update: (id: number, dto: CreateTransactionDto) => api.put<Transaction>(`/transactions/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
};
```

- [ ] **Step 5: Tạo `src/services/statisticsService.ts`**

```typescript
import api from './api';
import type { Summary, MonthlyData, ByCategoryData } from '../types';

export const statisticsService = {
  getSummary: (month: number, year: number) =>
    api.get<Summary>('/statistics/summary', { params: { month, year } }).then(r => r.data),
  getMonthly: (year: number) =>
    api.get<MonthlyData[]>('/statistics/monthly', { params: { year } }).then(r => r.data),
  getByCategory: (month: number, year: number) =>
    api.get<ByCategoryData[]>('/statistics/by-category', { params: { month, year } }).then(r => r.data),
};
```

- [ ] **Step 6: Tạo `src/store/authStore.ts`**

```typescript
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  fullName: string;
  email: string;
  login: (token: string, fullName: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  fullName: localStorage.getItem('fullName') ?? '',
  email: localStorage.getItem('email') ?? '',
  login: (token, fullName, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('fullName', fullName);
    localStorage.setItem('email', email);
    set({ token, fullName, email });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('email');
    set({ token: null, fullName: '', email: '' });
  },
  isAuthenticated: () => !!get().token,
}));
```

- [ ] **Step 7: Tạo `src/store/appStore.ts`**

```typescript
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
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/services/ frontend/src/store/
git commit -m "feat: add API service layer and Zustand stores"
```

---

## Task 11: Layout & Routing

**Files:**
- Create: `frontend/src/components/Layout/Sidebar.tsx`
- Create: `frontend/src/components/Layout/AppLayout.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Tạo `src/components/Layout/Sidebar.tsx`**

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Giao dịch', icon: '💳' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️' },
  { to: '/statistics', label: 'Thống kê', icon: '📈' },
];

export default function Sidebar() {
  const { fullName, email, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#1e293b', color: 'white',
      display: 'flex', flexDirection: 'column', padding: '20px 0'
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>💰 Chi Tiêu</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', color: 'white', textDecoration: 'none',
              background: isActive ? '#334155' : 'transparent',
              borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent'
            })}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{fullName}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{email}</div>
        <button onClick={handleLogout}
          style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6,
            padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Tạo `src/components/Layout/AppLayout.tsx`**

```tsx
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Viết lại `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Statistics from './pages/Statistics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Viết lại `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: add sidebar layout and routing"
```

---

## Task 12: Trang Login & Register

**Files:**
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Tạo `src/pages/Login.tsx`**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      login(res.token, res.fullName, res.email);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 12, width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>💰 Chi Tiêu</h2>
        <p style={{ color: '#64748b', margin: '0 0 24px' }}>Đăng nhập vào tài khoản của bạn</p>

        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: '#3b82f6' }}>Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tạo `src/pages/Register.tsx`**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.register(email, password, fullName);
      login(res.token, res.fullName, res.email);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 12, width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>💰 Chi Tiêu</h2>
        <p style={{ color: '#64748b', margin: '0 0 24px' }}>Tạo tài khoản mới</p>

        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Họ tên</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#3b82f6' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat: add Login and Register pages"
```

---

## Task 13: Trang Dashboard

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Tạo `src/pages/Dashboard.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import { transactionService } from '../services/transactionService';
import { useAppStore } from '../store/appStore';
import { categoryService } from '../services/categoryService';
import type { Summary, Transaction } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function Dashboard() {
  const now = new Date();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<{ label: string; chi: number }[]>([]);
  const { setCategories } = useAppStore();

  useEffect(() => {
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    statisticsService.getSummary(month, year).then(setSummary);
    transactionService.getAll({ month, year }).then(data => setRecent(data.slice(0, 5)));
    categoryService.getAll().then(setCategories);

    // Dữ liệu biểu đồ: chi tiêu 7 ngày gần nhất
    transactionService.getAll({ month, year, type: 'Expense' }).then(data => {
      const days: { label: string; chi: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const chi = data.filter(t => new Date(t.date).toDateString() === d.toDateString()).reduce((s, t) => s + t.amount, 0);
        days.push({ label, chi });
      }
      setChartData(days);
    });
  }, []);

  const cardStyle = (color: string): React.CSSProperties => ({
    background: 'white', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={cardStyle('#22c55e')}>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tổng thu tháng này</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{summary ? fmt(summary.totalIncome) : '...'}</div>
        </div>
        <div style={cardStyle('#ef4444')}>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tổng chi tháng này</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{summary ? fmt(summary.totalExpense) : '...'}</div>
        </div>
        <div style={cardStyle('#3b82f6')}>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Số dư</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{summary ? fmt(summary.balance) : '...'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Chi tiêu 7 ngày qua</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="chi" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Giao dịch gần nhất</h3>
          {recent.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{t.categoryIcon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.categoryName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(t.date).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: t.type === 'Income' ? '#16a34a' : '#dc2626' }}>
                {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add Dashboard page with summary cards and charts"
```

---

## Task 14: Trang Transactions

**Files:**
- Create: `frontend/src/components/Common/Modal.tsx`
- Create: `frontend/src/components/Transaction/TransactionForm.tsx`
- Create: `frontend/src/pages/Transactions.tsx`

- [ ] **Step 1: Tạo `src/components/Common/Modal.tsx`**

```tsx
import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tạo `src/components/Transaction/TransactionForm.tsx`**

```tsx
import { useState } from 'react';
import type { Category, CreateTransactionDto, Transaction, TransactionType } from '../../types';

interface Props {
  categories: Category[];
  initial?: Transaction;
  onSubmit: (dto: CreateTransactionDto) => Promise<void>;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6
};

export default function TransactionForm({ categories, initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'Expense');
  const [amount, setAmount] = useState(initial?.amount.toString() ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId.toString() ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const filtered = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ amount: parseFloat(amount), type, categoryId: parseInt(categoryId), note: note || undefined, date });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Loại</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Expense', 'Income'] as TransactionType[]).map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
              style={{ flex: 1, padding: '8px', border: '2px solid', borderColor: type === t ? (t === 'Expense' ? '#ef4444' : '#22c55e') : '#e2e8f0',
                background: type === t ? (t === 'Expense' ? '#fef2f2' : '#f0fdf4') : 'white',
                borderRadius: 8, fontWeight: 600, cursor: 'pointer', color: type === t ? (t === 'Expense' ? '#ef4444' : '#16a34a') : '#64748b' }}>
              {t === 'Expense' ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Số tiền (đ)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Danh mục</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required style={inputStyle}>
          <option value="">-- Chọn danh mục --</option>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Ngày</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Ghi chú</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="Không bắt buộc" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
          Hủy
        </button>
        <button type="submit" disabled={loading}
          style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Đang lưu...' : (initial ? 'Cập nhật' : 'Thêm mới')}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Tạo `src/pages/Transactions.tsx`**

```tsx
import { useEffect, useState } from 'react';
import Modal from '../components/Common/Modal';
import TransactionForm from '../components/Transaction/TransactionForm';
import { transactionService } from '../services/transactionService';
import { useAppStore } from '../store/appStore';
import { categoryService } from '../services/categoryService';
import type { CreateTransactionDto, Transaction } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const PAGE_SIZE = 20;

export default function Transactions() {
  const now = new Date();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const { categories, setCategories } = useAppStore();

  const load = () =>
    transactionService.getAll({ month, year }).then(setTransactions);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  useEffect(() => { load(); setPage(1); }, [month, year]);

  const handleCreate = async (dto: CreateTransactionDto) => {
    await transactionService.create(dto);
    setShowModal(false);
    load();
  };

  const handleUpdate = async (dto: CreateTransactionDto) => {
    if (!editing) return;
    await transactionService.update(editing.id, dto);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa giao dịch này?')) return;
    await transactionService.delete(id);
    load();
  };

  const paged = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [year - 1, year, year + 1];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Giao dịch</h2>
        <button onClick={() => setShowModal(true)}
          style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
          + Thêm giao dịch
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={month} onChange={e => setMonth(+e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Ngày', 'Danh mục', 'Ghi chú', 'Loại', 'Số tiền', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>
                  <span style={{ marginRight: 6 }}>{t.categoryIcon}</span>{t.categoryName}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>{t.note ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 20,
                    background: t.type === 'Income' ? '#f0fdf4' : '#fef2f2',
                    color: t.type === 'Income' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {t.type === 'Income' ? 'Thu' : 'Chi'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: t.type === 'Income' ? '#16a34a' : '#dc2626' }}>
                  {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => setEditing(t)} style={{ marginRight: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>Sửa</button>
                  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>Xóa</button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Chưa có giao dịch nào</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '6px 12px', border: '1px solid', borderColor: p === page ? '#3b82f6' : '#e2e8f0',
                  borderRadius: 6, background: p === page ? '#3b82f6' : 'white',
                  color: p === page ? 'white' : '#374151', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Thêm giao dịch" onClose={() => setShowModal(false)}>
          <TransactionForm categories={categories} onSubmit={handleCreate} onCancel={() => setShowModal(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Sửa giao dịch" onClose={() => setEditing(null)}>
          <TransactionForm categories={categories} initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ frontend/src/pages/Transactions.tsx
git commit -m "feat: add Transactions page with CRUD modal"
```

---

## Task 15: Trang Categories

**Files:**
- Create: `frontend/src/pages/Categories.tsx`

- [ ] **Step 1: Tạo `src/pages/Categories.tsx`**

```tsx
import { useEffect, useState } from 'react';
import Modal from '../components/Common/Modal';
import { categoryService } from '../services/categoryService';
import { useAppStore } from '../store/appStore';
import type { Category, CreateCategoryDto, TransactionType } from '../types';

const ICONS = ['🍔','🚗','🎮','🛍️','💊','📄','💰','🎁','📈','💡','✈️','🏠','📚','🎵','🏋️','☕','🎂','🐶'];
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#a855f7','#ec4899','#64748b','#78716c'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box'
};

export default function Categories() {
  const { categories, setCategories } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💡');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<TransactionType>('Expense');
  const [loading, setLoading] = useState(false);

  const load = () => categoryService.getAll().then(setCategories);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setName(''); setIcon('💡'); setColor('#3b82f6'); setType('Expense'); setShowModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setIcon(c.icon); setColor(c.color); setType(c.type); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dto: CreateCategoryDto = { name, icon, color, type };
    if (editing) await categoryService.update(editing.id, dto);
    else await categoryService.create(dto);
    setShowModal(false);
    await load();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa danh mục này?')) return;
    try { await categoryService.delete(id); await load(); }
    catch (err: any) { alert(err.response?.data?.message ?? 'Không thể xóa.'); }
  };

  const expense = categories.filter(c => c.type === 'Expense');
  const income = categories.filter(c => c.type === 'Income');

  const renderGroup = (title: string, items: Category[]) => (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 16, margin: '0 0 16px', color: '#374151' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {items.map(c => (
          <div key={c.id} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{c.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}>{c.name}</div>
            {!c.isDefault && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(c)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', background: 'white', color: '#3b82f6' }}>Sửa</button>
                <button onClick={() => handleDelete(c.id)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #fee2e2', borderRadius: 6, cursor: 'pointer', background: '#fef2f2', color: '#ef4444' }}>Xóa</button>
              </div>
            )}
            {c.isDefault && <span style={{ fontSize: 11, color: '#94a3b8' }}>Mặc định</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Danh mục</h2>
        <button onClick={openCreate}
          style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
          + Thêm danh mục
        </button>
      </div>

      {renderGroup('Chi tiêu', expense)}
      {renderGroup('Thu nhập', income)}

      {showModal && (
        <Modal title={editing ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Tên</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICONS.map(i => (
                  <button key={i} type="button" onClick={() => setIcon(i)}
                    style={{ width: 36, height: 36, border: '2px solid', borderColor: icon === i ? '#3b82f6' : '#e2e8f0', borderRadius: 8, fontSize: 18, cursor: 'pointer', background: icon === i ? '#eff6ff' : 'white' }}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Màu</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #1e293b' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            {!editing && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Loại</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Expense', 'Income'] as TransactionType[]).map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      style={{ flex: 1, padding: 8, border: '2px solid', borderColor: type === t ? '#3b82f6' : '#e2e8f0',
                        borderRadius: 8, fontWeight: 600, cursor: 'pointer', background: type === t ? '#eff6ff' : 'white', color: type === t ? '#3b82f6' : '#64748b' }}>
                      {t === 'Expense' ? 'Chi tiêu' : 'Thu nhập'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm mới')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Categories.tsx
git commit -m "feat: add Categories page with icon and color picker"
```

---

## Task 16: Trang Statistics

**Files:**
- Create: `frontend/src/pages/Statistics.tsx`

- [ ] **Step 1: Tạo `src/pages/Statistics.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { statisticsService } from '../services/statisticsService';
import type { ByCategoryData, MonthlyData } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export default function Statistics() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [byCategory, setByCategory] = useState<ByCategoryData[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);

  useEffect(() => {
    statisticsService.getByCategory(month, year).then(setByCategory);
  }, [month, year]);

  useEffect(() => {
    statisticsService.getMonthly(year).then(setMonthly);
  }, [year]);

  const barData = monthly.map(m => ({
    name: MONTHS[m.month - 1],
    'Thu nhập': m.income,
    'Chi tiêu': m.expense
  }));

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>Thống kê</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <select value={month} onChange={e => setMonth(+e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Chi tiêu theo danh mục — Tháng {month}/{year}</h3>
          {byCategory.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byCategory} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={90} label={({ categoryIcon, percentage }) => `${categoryIcon} ${percentage}%`}>
                    {byCategory.map((d, i) => <Cell key={i} fill={d.categoryColor} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                {byCategory.map(d => (
                  <div key={d.categoryId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, borderBottom: '1px solid #f1f5f9' }}>
                    <span>{d.categoryIcon} {d.categoryName}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(d.amount)} ({d.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Thu/Chi theo tháng — {year}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="Thu nhập" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Statistics.tsx
git commit -m "feat: add Statistics page with pie and bar charts"
```

---

## Task 17: Build frontend và chạy toàn bộ app

- [ ] **Step 1: Build React frontend**

```bash
cd D:\BE\web-quan-li-chi-tieu\frontend
npm run build
```

Expected: Tạo ra các file trong `D:\BE\web-quan-li-chi-tieu\backend\wwwroot\`

- [ ] **Step 2: Chạy .NET backend**

```bash
cd D:\BE\web-quan-li-chi-tieu\backend
dotnet run
```

Expected: Server chạy tại `http://localhost:5000`

- [ ] **Step 3: Kiểm tra toàn bộ flow**

Mở trình duyệt tại `http://localhost:5000`:
1. Đăng ký tài khoản mới → redirect về Dashboard
2. Thêm giao dịch chi tiêu → kiểm tra hiển thị trong bảng
3. Kiểm tra Dashboard: thẻ tổng hợp và biểu đồ cập nhật
4. Vào Danh mục: thêm danh mục tùy chỉnh → sửa → xóa
5. Vào Thống kê: kiểm tra biểu đồ tròn và biểu đồ cột
6. Đăng xuất → redirect về Login

- [ ] **Step 4: Commit cuối**

```bash
cd D:\BE\web-quan-li-chi-tieu
git add .
git commit -m "feat: complete expense tracker web app"
```

---

## Ghi chú phát triển

**Chạy dev mode** (hot reload):
```bash
# Terminal 1 — backend
cd backend && dotnet run

# Terminal 2 — frontend (proxy /api đến localhost:5000)
cd frontend && npm run dev
```

Frontend dev chạy tại `http://localhost:5173`, mọi request `/api/*` tự động proxy sang backend.
