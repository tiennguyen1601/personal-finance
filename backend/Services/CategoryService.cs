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
