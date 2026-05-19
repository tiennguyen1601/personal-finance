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
