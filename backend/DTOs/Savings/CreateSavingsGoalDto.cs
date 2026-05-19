namespace backend.DTOs.Savings;

public class CreateSavingsGoalDto
{
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "🐷";
    public string Color { get; set; } = "#8b5cf6";
    public decimal? TargetAmount { get; set; }
    public DateTime? Deadline { get; set; }
}
