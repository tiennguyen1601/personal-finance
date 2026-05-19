namespace backend.Models;

public class SavingsGoal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "🐷";
    public string Color { get; set; } = "#8b5cf6";
    public decimal? TargetAmount { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<SavingsEntry> Entries { get; set; } = new List<SavingsEntry>();
}
