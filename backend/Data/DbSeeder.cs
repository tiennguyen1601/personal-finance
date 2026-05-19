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
