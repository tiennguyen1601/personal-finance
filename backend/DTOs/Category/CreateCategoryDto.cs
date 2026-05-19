using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Category;

public class CreateCategoryDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Icon { get; set; } = string.Empty;

    [Required]
    public string Color { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = string.Empty; // "Income" | "Expense"
}
