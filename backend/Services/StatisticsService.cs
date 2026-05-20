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

        var saved = await _db.SavingsEntries
            .Include(e => e.Goal)
            .Where(e => e.Goal.UserId == userId && e.Date.Month == month && e.Date.Year == year)
            .SumAsync(e => e.Amount);

        return new SummaryDto { TotalIncome = income, TotalExpense = expense, TotalSaved = saved, Balance = income - expense - saved };
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
