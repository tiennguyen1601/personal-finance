# Savings Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Savings (Tiết kiệm) module where users track savings goals with deposit entries; deposits reduce the balance but are never counted as expenses.

**Architecture:** Two new DB tables (`SavingsGoals`, `SavingsEntries`) fully separate from transactions. A default "Tiết kiệm chung" goal is seeded on registration. The Statistics summary gains a `TotalSaved` field so Dashboard balance = Income − Expense − Saved.

**Tech Stack:** ASP.NET Core 8, EF Core + SQLite, C# 12, React 18, TypeScript, inline styles (no Tailwind)

---

## File Map

### Create (backend)
- `backend/Models/SavingsGoal.cs`
- `backend/Models/SavingsEntry.cs`
- `backend/DTOs/Savings/SavingsGoalDto.cs`
- `backend/DTOs/Savings/CreateSavingsGoalDto.cs`
- `backend/DTOs/Savings/CreateSavingsEntryDto.cs`
- `backend/Services/ISavingsService.cs`
- `backend/Services/SavingsService.cs`
- `backend/Controllers/SavingsController.cs`

### Modify (backend)
- `backend/Data/AppDbContext.cs` — add `SavingsGoals`, `SavingsEntries` DbSets + column config
- `backend/Data/DbSeeder.cs` — add `SeedDefaultSavingsGoal(db, userId)`
- `backend/Services/AuthService.cs` — call `SeedDefaultSavingsGoal` after register
- `backend/DTOs/Statistics/StatisticsDto.cs` — add `TotalSaved` to `SummaryDto`
- `backend/Services/StatisticsService.cs` — compute `TotalSaved` in `GetSummaryAsync`
- `backend/Program.cs` — register `ISavingsService`

### Create (frontend)
- `frontend/src/services/savingsService.ts`
- `frontend/src/pages/Savings.tsx`

### Modify (frontend)
- `frontend/src/types/index.ts` — add `SavingsGoal`, `SavingsEntry`, `CreateSavingsGoalDto`, `CreateSavingsEntryDto`; update `Summary`
- `frontend/src/App.tsx` — add `/savings` route
- `frontend/src/components/Layout/Sidebar.tsx` — add nav item
- `frontend/src/pages/Dashboard.tsx` — add 4th card, update balance display

---

## Task 1: Backend models

**Files:**
- Create: `backend/Models/SavingsGoal.cs`
- Create: `backend/Models/SavingsEntry.cs`

- [ ] **Step 1: Create `SavingsGoal.cs`**

```csharp
// backend/Models/SavingsGoal.cs
namespace backend.Models;

public class SavingsGoal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "🐷";
    public string Color { get; set; } = "#8b5cf6";
    public decimal? TargetAmount { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<SavingsEntry> Entries { get; set; } = new List<SavingsEntry>();
}
```

- [ ] **Step 2: Create `SavingsEntry.cs`**

```csharp
// backend/Models/SavingsEntry.cs
namespace backend.Models;

public class SavingsEntry
{
    public int Id { get; set; }
    public int SavingsGoalId { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SavingsGoal Goal { get; set; } = null!;
}
```

- [ ] **Step 3: Commit**

```
git add backend/Models/SavingsGoal.cs backend/Models/SavingsEntry.cs
git commit -m "feat: add SavingsGoal and SavingsEntry models"
```

---

## Task 2: DTOs

**Files:**
- Create: `backend/DTOs/Savings/SavingsGoalDto.cs`
- Create: `backend/DTOs/Savings/CreateSavingsGoalDto.cs`
- Create: `backend/DTOs/Savings/CreateSavingsEntryDto.cs`

- [ ] **Step 1: Create `SavingsGoalDto.cs`**

```csharp
// backend/DTOs/Savings/SavingsGoalDto.cs
namespace backend.DTOs.Savings;

public class SavingsGoalDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal? TargetAmount { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsDefault { get; set; }
    public decimal CurrentAmount { get; set; }
    public bool IsCompleted { get; set; }
}

public class SavingsEntryDto
{
    public int Id { get; set; }
    public int SavingsGoalId { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
```

- [ ] **Step 2: Create `CreateSavingsGoalDto.cs`**

```csharp
// backend/DTOs/Savings/CreateSavingsGoalDto.cs
namespace backend.DTOs.Savings;

public class CreateSavingsGoalDto
{
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "🐷";
    public string Color { get; set; } = "#8b5cf6";
    public decimal? TargetAmount { get; set; }
    public DateTime? Deadline { get; set; }
}
```

- [ ] **Step 3: Create `CreateSavingsEntryDto.cs`**

```csharp
// backend/DTOs/Savings/CreateSavingsEntryDto.cs
namespace backend.DTOs.Savings;

public class CreateSavingsEntryDto
{
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
```

- [ ] **Step 4: Commit**

```
git add backend/DTOs/Savings/
git commit -m "feat: add Savings DTOs"
```

---

## Task 3: Update AppDbContext + migration

**Files:**
- Modify: `backend/Data/AppDbContext.cs`

- [ ] **Step 1: Add DbSets and column config to `AppDbContext.cs`**

Replace entire file with:

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
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<SavingsEntry> SavingsEntries => Set<SavingsEntry>();

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

        modelBuilder.Entity<SavingsGoal>()
            .Property(g => g.TargetAmount).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<SavingsEntry>()
            .Property(e => e.Amount).HasColumnType("decimal(18,2)");
    }
}
```

- [ ] **Step 2: Add EF Core migration**

Run in `backend/` folder:
```
dotnet ef migrations add AddSavings
```

Expected output: `Build succeeded.` and new files appear in `backend/Migrations/`.

- [ ] **Step 3: Commit**

```
git add backend/Data/AppDbContext.cs backend/Migrations/
git commit -m "feat: add SavingsGoals and SavingsEntries tables to DB"
```

---

## Task 4: Seed default savings goal on register

**Files:**
- Modify: `backend/Data/DbSeeder.cs`
- Modify: `backend/Services/AuthService.cs`

- [ ] **Step 1: Add `SeedDefaultSavingsGoal` to `DbSeeder.cs`**

Add this method to the existing `DbSeeder` class (after `SeedDefaultCategories`):

```csharp
public static void SeedDefaultSavingsGoal(AppDbContext db, int userId)
{
    db.SavingsGoals.Add(new SavingsGoal
    {
        UserId = userId,
        Name = "Tiết kiệm chung",
        Icon = "🐷",
        Color = "#8b5cf6",
        TargetAmount = null,
        IsDefault = true
    });
    db.SaveChanges();
}
```

- [ ] **Step 2: Call it in `AuthService.cs` `RegisterAsync`**

After the line `DbSeeder.SeedDefaultCategories(_db, user.Id);`, add:

```csharp
DbSeeder.SeedDefaultSavingsGoal(_db, user.Id);
```

- [ ] **Step 3: Commit**

```
git add backend/Data/DbSeeder.cs backend/Services/AuthService.cs
git commit -m "feat: seed default savings goal on user registration"
```

---

## Task 5: SavingsService + Controller

**Files:**
- Create: `backend/Services/ISavingsService.cs`
- Create: `backend/Services/SavingsService.cs`
- Create: `backend/Controllers/SavingsController.cs`
- Modify: `backend/Program.cs`

- [ ] **Step 1: Create `ISavingsService.cs`**

```csharp
// backend/Services/ISavingsService.cs
using backend.DTOs.Savings;

namespace backend.Services;

public interface ISavingsService
{
    Task<List<SavingsGoalDto>> GetAllAsync(int userId);
    Task<SavingsGoalDto> CreateAsync(int userId, CreateSavingsGoalDto dto);
    Task<SavingsGoalDto> UpdateAsync(int userId, int id, CreateSavingsGoalDto dto);
    Task DeleteAsync(int userId, int id);
    Task<SavingsEntryDto> AddEntryAsync(int userId, int goalId, CreateSavingsEntryDto dto);
    Task DeleteEntryAsync(int userId, int entryId);
}
```

- [ ] **Step 2: Create `SavingsService.cs`**

```csharp
// backend/Services/SavingsService.cs
using backend.Data;
using backend.DTOs.Savings;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SavingsService : ISavingsService
{
    private readonly AppDbContext _db;
    public SavingsService(AppDbContext db) => _db = db;

    public async Task<List<SavingsGoalDto>> GetAllAsync(int userId)
    {
        var goals = await _db.SavingsGoals
            .Include(g => g.Entries)
            .Where(g => g.UserId == userId)
            .OrderBy(g => g.IsDefault ? 0 : 1).ThenBy(g => g.CreatedAt)
            .ToListAsync();

        return goals.Select(ToDto).ToList();
    }

    public async Task<SavingsGoalDto> CreateAsync(int userId, CreateSavingsGoalDto dto)
    {
        var goal = new SavingsGoal
        {
            UserId = userId,
            Name = dto.Name,
            Icon = dto.Icon,
            Color = dto.Color,
            TargetAmount = dto.TargetAmount,
            Deadline = dto.Deadline
        };
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();
        return ToDto(goal);
    }

    public async Task<SavingsGoalDto> UpdateAsync(int userId, int id, CreateSavingsGoalDto dto)
    {
        var goal = await _db.SavingsGoals
            .Include(g => g.Entries)
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId)
            ?? throw new KeyNotFoundException("Mục tiêu không tồn tại.");

        goal.Name = dto.Name;
        goal.Icon = dto.Icon;
        goal.Color = dto.Color;
        goal.TargetAmount = dto.TargetAmount;
        goal.Deadline = dto.Deadline;
        await _db.SaveChangesAsync();
        return ToDto(goal);
    }

    public async Task DeleteAsync(int userId, int id)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId)
            ?? throw new KeyNotFoundException("Mục tiêu không tồn tại.");

        if (goal.IsDefault)
            throw new InvalidOperationException("Không thể xóa mục tiêu mặc định.");

        _db.SavingsGoals.Remove(goal);
        await _db.SaveChangesAsync();
    }

    public async Task<SavingsEntryDto> AddEntryAsync(int userId, int goalId, CreateSavingsEntryDto dto)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId)
            ?? throw new KeyNotFoundException("Mục tiêu không tồn tại.");

        var entry = new SavingsEntry
        {
            SavingsGoalId = goal.Id,
            Amount = dto.Amount,
            Note = dto.Note,
            Date = dto.Date
        };
        _db.SavingsEntries.Add(entry);
        await _db.SaveChangesAsync();
        return ToEntryDto(entry);
    }

    public async Task DeleteEntryAsync(int userId, int entryId)
    {
        var entry = await _db.SavingsEntries
            .Include(e => e.Goal)
            .FirstOrDefaultAsync(e => e.Id == entryId && e.Goal.UserId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy lần nạp tiền.");

        _db.SavingsEntries.Remove(entry);
        await _db.SaveChangesAsync();
    }

    private static SavingsGoalDto ToDto(SavingsGoal g)
    {
        var current = g.Entries.Sum(e => e.Amount);
        return new SavingsGoalDto
        {
            Id = g.Id,
            Name = g.Name,
            Icon = g.Icon,
            Color = g.Color,
            TargetAmount = g.TargetAmount,
            Deadline = g.Deadline,
            IsDefault = g.IsDefault,
            CurrentAmount = current,
            IsCompleted = g.TargetAmount.HasValue && current >= g.TargetAmount.Value
        };
    }

    private static SavingsEntryDto ToEntryDto(SavingsEntry e) => new()
    {
        Id = e.Id,
        SavingsGoalId = e.SavingsGoalId,
        Amount = e.Amount,
        Note = e.Note,
        Date = e.Date
    };
}
```

- [ ] **Step 3: Create `SavingsController.cs`**

```csharp
// backend/Controllers/SavingsController.cs
using System.Security.Claims;
using backend.DTOs.Savings;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/savings")]
[Authorize]
public class SavingsController : ControllerBase
{
    private readonly ISavingsService _service;
    public SavingsController(ISavingsService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create(CreateSavingsGoalDto dto)
    {
        try { return Ok(await _service.CreateAsync(UserId, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateSavingsGoalDto dto)
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

    [HttpPost("{goalId}/entries")]
    public async Task<IActionResult> AddEntry(int goalId, CreateSavingsEntryDto dto)
    {
        try { return Ok(await _service.AddEntryAsync(UserId, goalId, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("entries/{entryId}")]
    public async Task<IActionResult> DeleteEntry(int entryId)
    {
        try { await _service.DeleteEntryAsync(UserId, entryId); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
```

- [ ] **Step 4: Register service in `Program.cs`**

After `builder.Services.AddScoped<IStatisticsService, StatisticsService>();`, add:

```csharp
builder.Services.AddScoped<ISavingsService, SavingsService>();
```

- [ ] **Step 5: Commit**

```
git add backend/Services/ISavingsService.cs backend/Services/SavingsService.cs backend/Controllers/SavingsController.cs backend/Program.cs
git commit -m "feat: add SavingsService and SavingsController"
```

---

## Task 6: Update Statistics to include TotalSaved

**Files:**
- Modify: `backend/DTOs/Statistics/StatisticsDto.cs`
- Modify: `backend/Services/StatisticsService.cs`

- [ ] **Step 1: Add `TotalSaved` to `SummaryDto`**

In `backend/DTOs/Statistics/StatisticsDto.cs`, update `SummaryDto`:

```csharp
public class SummaryDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal TotalSaved { get; set; }
    public decimal Balance { get; set; }
}
```

- [ ] **Step 2: Compute `TotalSaved` in `StatisticsService.cs`**

Replace `GetSummaryAsync` method:

```csharp
public async Task<SummaryDto> GetSummaryAsync(int userId, int month, int year)
{
    var transactions = await _db.Transactions
        .Where(t => t.UserId == userId && t.Date.Month == month && t.Date.Year == year)
        .ToListAsync();

    var income = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
    var expense = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

    var saved = await _db.SavingsEntries
        .Include(e => e.Goal)
        .Where(e => e.Goal.UserId == userId && e.Date.Month == month && e.Date.Year == year)
        .SumAsync(e => e.Amount);

    return new SummaryDto
    {
        TotalIncome = income,
        TotalExpense = expense,
        TotalSaved = saved,
        Balance = income - expense - saved
    };
}
```

- [ ] **Step 3: Commit**

```
git add backend/DTOs/Statistics/StatisticsDto.cs backend/Services/StatisticsService.cs
git commit -m "feat: include TotalSaved in statistics summary"
```

---

## Task 7: Frontend types + service

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/services/savingsService.ts`

- [ ] **Step 1: Add savings types and update `Summary` in `types/index.ts`**

Add at the end of `frontend/src/types/index.ts`:

```typescript
export interface SavingsGoal {
  id: number;
  name: string;
  icon: string;
  color: string;
  targetAmount: number | null;
  deadline: string | null;
  isDefault: boolean;
  currentAmount: number;
  isCompleted: boolean;
}

export interface CreateSavingsGoalDto {
  name: string;
  icon: string;
  color: string;
  targetAmount: number | null;
  deadline: string | null;
}

export interface CreateSavingsEntryDto {
  amount: number;
  note?: string;
  date: string;
}
```

Also update the `Summary` interface — replace it with:

```typescript
export interface Summary {
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  balance: number;
}
```

- [ ] **Step 2: Create `savingsService.ts`**

```typescript
// frontend/src/services/savingsService.ts
import api from './api';
import type { SavingsGoal, CreateSavingsGoalDto, CreateSavingsEntryDto } from '../types';

export const savingsService = {
  getAll: () => api.get<SavingsGoal[]>('/savings').then(r => r.data),
  create: (dto: CreateSavingsGoalDto) => api.post<SavingsGoal>('/savings', dto).then(r => r.data),
  update: (id: number, dto: CreateSavingsGoalDto) => api.put<SavingsGoal>(`/savings/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/savings/${id}`),
  addEntry: (goalId: number, dto: CreateSavingsEntryDto) =>
    api.post(`/savings/${goalId}/entries`, dto).then(r => r.data),
  deleteEntry: (entryId: number) => api.delete(`/savings/entries/${entryId}`),
};
```

- [ ] **Step 3: Commit**

```
git add frontend/src/types/index.ts frontend/src/services/savingsService.ts
git commit -m "feat: add savings types and frontend service"
```

---

## Task 8: Savings page

**Files:**
- Create: `frontend/src/pages/Savings.tsx`

- [ ] **Step 1: Create `Savings.tsx`**

```tsx
// frontend/src/pages/Savings.tsx
import { useEffect, useState } from 'react';
import Modal from '../components/Common/Modal';
import { savingsService } from '../services/savingsService';
import type { SavingsGoal, CreateSavingsGoalDto, CreateSavingsEntryDto } from '../types';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const today = () => new Date().toISOString().slice(0, 10);

const ICONS = ['🐷','🎯','🏠','🚗','✈️','📱','💍','🎓','🏥','💻','🛒','🌴'];
const COLORS = ['#8b5cf6','#3b82f6','#22c55e','#ef4444','#f97316','#ec4899','#0891b2','#eab308','#64748b','#14b8a6'];

function GoalForm({ initial, onSubmit, onCancel }: {
  initial?: SavingsGoal;
  onSubmit: (dto: CreateSavingsGoalDto) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🐷');
  const [color, setColor] = useState(initial?.color ?? '#8b5cf6');
  const [target, setTarget] = useState(initial?.targetAmount?.toString() ?? '');
  const [deadline, setDeadline] = useState(initial?.deadline?.slice(0, 10) ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      icon,
      color,
      targetAmount: target ? Number(target) : null,
      deadline: deadline || null,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Tên mục tiêu *</label>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Mua điện thoại" required />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Icon</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ICONS.map(i => (
            <button key={i} type="button" onClick={() => setIcon(i)}
              style={{ width: 36, height: 36, fontSize: 18, border: '2px solid', borderColor: icon === i ? '#3b82f6' : '#e2e8f0', borderRadius: 8, cursor: 'pointer', background: icon === i ? '#eff6ff' : 'white' }}>
              {i}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Màu</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #1e293b' : '2px solid transparent', cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Số tiền mục tiêu (để trống nếu không có)</label>
        <input style={inputStyle} type="number" min="0" value={target} onChange={e => setTarget(e.target.value)} placeholder="VD: 15000000" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Deadline (tuỳ chọn)</label>
        <input style={inputStyle} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
          Huỷ
        </button>
        <button type="submit"
          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {initial ? 'Lưu' : 'Tạo'}
        </button>
      </div>
    </form>
  );
}

function EntryForm({ goalName, onSubmit, onCancel }: {
  goalName: string;
  onSubmit: (dto: CreateSavingsEntryDto) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onSubmit({ amount: Number(amount), note: note || undefined, date });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ marginBottom: 16, color: '#64748b', fontSize: 14 }}>Nạp tiền vào: <strong>{goalName}</strong></p>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Số tiền *</label>
        <input style={inputStyle} type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="VD: 500000" required />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Ghi chú</label>
        <input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Tuỳ chọn" />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Ngày</label>
        <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
          Huỷ
        </button>
        <button type="submit"
          style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          Nạp tiền
        </button>
      </div>
    </form>
  );
}

export default function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [depositing, setDepositing] = useState<SavingsGoal | null>(null);

  const load = () => savingsService.getAll().then(setGoals);
  useEffect(() => { load(); }, []);

  const handleCreate = async (dto: CreateSavingsGoalDto) => {
    await savingsService.create(dto);
    setShowCreate(false);
    load();
  };

  const handleUpdate = async (dto: CreateSavingsGoalDto) => {
    if (!editing) return;
    await savingsService.update(editing.id, dto);
    setEditing(null);
    load();
  };

  const handleDelete = async (goal: SavingsGoal) => {
    if (!confirm(`Xóa mục tiêu "${goal.name}"? Tất cả lịch sử nạp tiền cũng sẽ bị xóa.`)) return;
    await savingsService.delete(goal.id);
    load();
  };

  const handleDeposit = async (dto: CreateSavingsEntryDto) => {
    if (!depositing) return;
    await savingsService.addEntry(depositing.id, dto);
    setDepositing(null);
    load();
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Tiết kiệm 🐷</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Tổng đã tiết kiệm: <strong style={{ color: '#8b5cf6' }}>{fmt(totalSaved)}</strong>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
          + Tạo mục tiêu
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {goals.map(goal => {
          const pct = goal.targetAmount ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : null;
          return (
            <div key={goal.id} style={{
              background: 'white', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${goal.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{goal.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{goal.name}</div>
                    {goal.deadline && (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
                {goal.isCompleted && (
                  <span style={{ fontSize: 12, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                    Hoàn thành 🎉
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Đã tiết kiệm</span>
                  <span style={{ fontWeight: 600, color: goal.color }}>{fmt(goal.currentAmount)}</span>
                </div>
                {goal.targetAmount && (
                  <>
                    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: goal.color, borderRadius: 99, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      <span>{pct}%</span>
                      <span>Mục tiêu: {fmt(goal.targetAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDepositing(goal)}
                  style={{ flex: 1, background: goal.color, color: 'white', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  + Nạp tiền
                </button>
                {!goal.isDefault && (
                  <>
                    <button onClick={() => setEditing(goal)}
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#3b82f6', fontSize: 13 }}>
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(goal)}
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}>
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <Modal title="Tạo mục tiêu tiết kiệm" onClose={() => setShowCreate(false)}>
          <GoalForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Sửa mục tiêu" onClose={() => setEditing(null)}>
          <GoalForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {depositing && (
        <Modal title="Nạp tiền tiết kiệm" onClose={() => setDepositing(null)}>
          <EntryForm goalName={depositing.name} onSubmit={handleDeposit} onCancel={() => setDepositing(null)} />
        </Modal>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add frontend/src/pages/Savings.tsx
git commit -m "feat: add Savings page with goal cards and deposit modal"
```

---

## Task 9: Wire up routing + sidebar + Dashboard

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout/Sidebar.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Add route in `App.tsx`**

Add import:
```tsx
import Savings from './pages/Savings';
```

Add route inside `<Route element={<AppLayout />}>`:
```tsx
<Route path="/savings" element={<Savings />} />
```

- [ ] **Step 2: Add nav item in `Sidebar.tsx`**

In the `navItems` array, add after the Statistics entry:
```tsx
{ to: '/savings', label: 'Tiết kiệm', icon: '🐷' },
```

- [ ] **Step 3: Update `Dashboard.tsx` — add 4th card and update balance**

Change the summary cards section. Replace the 3-card grid content:

```tsx
<div className="dashboard-cards">
  <div style={cardStyle('#22c55e')}>
    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tổng thu tháng này</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{summary ? fmt(summary.totalIncome) : '...'}</div>
  </div>
  <div style={cardStyle('#ef4444')}>
    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tổng chi tháng này</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{summary ? fmt(summary.totalExpense) : '...'}</div>
  </div>
  <div style={cardStyle('#8b5cf6')}>
    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Đã tiết kiệm</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>{summary ? fmt(summary.totalSaved) : '...'}</div>
  </div>
  <div style={cardStyle('#3b82f6')}>
    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Số dư</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{summary ? fmt(summary.balance) : '...'}</div>
  </div>
</div>
```

Also update `dashboard-cards` CSS in `index.css` — change desktop grid from 3 to 4 columns:

In `frontend/src/index.css`, change:
```css
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
```
to:
```css
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
```

- [ ] **Step 4: Commit**

```
git add frontend/src/App.tsx frontend/src/components/Layout/Sidebar.tsx frontend/src/pages/Dashboard.tsx frontend/src/index.css
git commit -m "feat: wire savings route, sidebar nav, and dashboard 4th card"
```

---

## Task 10: Build and verify

- [ ] **Step 1: Build frontend**

Run in `frontend/` folder:
```
npm run build
```
Expected: `✓ built in X.XXs` with no TypeScript errors.

- [ ] **Step 2: Start backend**

Run in `backend/` folder:
```
dotnet run
```
Expected: app starts on port 5178, migration runs automatically adding `SavingsGoals` and `SavingsEntries` tables.

- [ ] **Step 3: Smoke test in browser**

1. Login → sidebar shows "Tiết kiệm 🐷"
2. Navigate to `/savings` → see "Tiết kiệm chung 🐷" card
3. Click "+ Tạo mục tiêu" → fill form → goal appears
4. Click "+ Nạp tiền" on any goal → enter amount → `currentAmount` updates, progress bar moves
5. Go to Dashboard → 4th card "Đã tiết kiệm" shows correct amount, "Số dư" decreased accordingly

- [ ] **Step 4: Final commit + push**

```
git add backend/wwwroot/
git commit -m "build: production build with savings feature"
git push
```
