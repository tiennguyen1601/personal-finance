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
