using System.Security.Claims;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/statistics")]
[Authorize]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _service;
    public StatisticsController(IStatisticsService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(
        [FromQuery] int month = 0,
        [FromQuery] int year = 0)
    {
        if (month == 0) month = DateTime.Now.Month;
        if (year == 0) year = DateTime.Now.Year;
        return Ok(await _service.GetSummaryAsync(UserId, month, year));
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> Monthly([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.Now.Year;
        return Ok(await _service.GetMonthlyAsync(UserId, year));
    }

    [HttpGet("by-category")]
    public async Task<IActionResult> ByCategory(
        [FromQuery] int month = 0,
        [FromQuery] int year = 0)
    {
        if (month == 0) month = DateTime.Now.Month;
        if (year == 0) year = DateTime.Now.Year;
        return Ok(await _service.GetByCategoryAsync(UserId, month, year));
    }
}
