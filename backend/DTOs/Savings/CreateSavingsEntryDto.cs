namespace backend.DTOs.Savings;

public class CreateSavingsEntryDto
{
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
