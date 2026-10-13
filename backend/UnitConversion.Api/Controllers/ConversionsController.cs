using Microsoft.AspNetCore.Mvc;
using UnitConversion.Api.Models;
using UnitConversion.Api.Services;

namespace UnitConversion.Api.Controllers;

[ApiController]
[Route("api/conversions")]
public sealed class ConversionsController(UnitConversionService conversionService) : ControllerBase
{
    [HttpGet("units")]
    [ProducesResponseType(typeof(IReadOnlyList<UnitCategory>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<UnitCategory>> GetUnits() =>
        Ok(conversionService.GetCategories());

    [HttpPost("convert")]
    [ProducesResponseType(typeof(ConvertResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<ConvertResponse> Convert([FromBody] ConvertRequest request)
    {
        try
        {
            return Ok(conversionService.Convert(request.Value, request.FromUnit, request.ToUnit));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }
}
