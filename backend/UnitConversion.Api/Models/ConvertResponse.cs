namespace UnitConversion.Api.Models;

public sealed record ConvertResponse(
    double InputValue,
    string FromUnit,
    string ToUnit,
    double Result,
    string Category);
