namespace backend.Models;

public class SavingsEntry
{
    public int Id { get; set; }
    public int SavingsGoalId { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SavingsGoal Goal { get; set; } = null!;
}
