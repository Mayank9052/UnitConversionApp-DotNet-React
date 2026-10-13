using System.ComponentModel.DataAnnotations;

namespace UnitConversion.Api.Models;

public sealed class ConvertRequest
{
    [Range(typeof(double), "-1.7976931348623157E+308", "1.7976931348623157E+308")]
    public double Value { get; init; }

    [Required, MinLength(1)]
    public string FromUnit { get; init; } = string.Empty;

    [Required, MinLength(1)]
    public string ToUnit { get; init; } = string.Empty;
}
