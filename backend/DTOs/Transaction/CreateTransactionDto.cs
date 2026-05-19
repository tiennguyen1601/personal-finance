using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Transaction;

public class CreateTransactionDto
{
    [Required, Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public string Type { get; set; } = string.Empty; // "Income" | "Expense"

    [Required]
    public int CategoryId { get; set; }

    public string? Note { get; set; }

    [Required]
    public DateTime Date { get; set; }
}
