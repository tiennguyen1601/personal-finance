namespace backend.DTOs.Savings;

public class SavingsGoalDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal? TargetAmount { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsDefault { get; set; }
    public decimal CurrentAmount { get; set; }
    public bool IsCompleted { get; set; }
}

public class SavingsEntryDto
{
    public int Id { get; set; }
    public int SavingsGoalId { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
