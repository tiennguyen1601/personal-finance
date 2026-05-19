using backend.DTOs.Category;

namespace backend.Services;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(int userId);
    Task<CategoryDto> CreateAsync(int userId, CreateCategoryDto dto);
    Task<CategoryDto> UpdateAsync(int userId, int id, CreateCategoryDto dto);
    Task DeleteAsync(int userId, int id);
}
