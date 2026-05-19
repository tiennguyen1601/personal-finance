using backend.DTOs.Statistics;

namespace backend.Services;

public interface IStatisticsService
{
    Task<SummaryDto> GetSummaryAsync(int userId, int month, int year);
    Task<List<MonthlyDto>> GetMonthlyAsync(int userId, int year);
    Task<List<ByCategoryDto>> GetByCategoryAsync(int userId, int month, int year);
}
