using System.Security.Claims;
using backend.DTOs.Savings;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/savings")]
[Authorize]
public class SavingsController : ControllerBase
{
    private readonly ISavingsService _service;
    public SavingsController(ISavingsService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create(CreateSavingsGoalDto dto)
    {
        try { return Ok(await _service.CreateAsync(UserId, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateSavingsGoalDto dto)
    {
        try { return Ok(await _service.UpdateAsync(UserId, id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _service.DeleteAsync(UserId, id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{goalId}/entries")]
    public async Task<IActionResult> AddEntry(int goalId, CreateSavingsEntryDto dto)
    {
        try { return Ok(await _service.AddEntryAsync(UserId, goalId, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("entries/{entryId}")]
    public async Task<IActionResult> DeleteEntry(int entryId)
    {
        try { await _service.DeleteEntryAsync(UserId, entryId); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
