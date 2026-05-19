namespace backend.Models;

public enum TransactionType { Income, Expense }

public class Category
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public TransactionType Type { get; set; }
    public bool IsDefault { get; set; } = false;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
