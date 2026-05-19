namespace backend.DTOs.Statistics;

public class SummaryDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; }
}

public class MonthlyDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
}

public class ByCategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}
