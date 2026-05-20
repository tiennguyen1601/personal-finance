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
