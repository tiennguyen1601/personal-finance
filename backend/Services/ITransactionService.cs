using backend.DTOs.Transaction;

namespace backend.Services;

public interface ITransactionService
{
    Task<List<TransactionDto>> GetAllAsync(int userId, int? month, int? year, int? categoryId, string? type);
    Task<TransactionDto> CreateAsync(int userId, CreateTransactionDto dto);
    Task<TransactionDto> UpdateAsync(int userId, int id, CreateTransactionDto dto);
    Task DeleteAsync(int userId, int id);
}
