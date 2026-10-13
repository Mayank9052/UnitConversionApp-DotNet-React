using UnitConversion.Api.Models;

namespace UnitConversion.Api.Services;

public sealed class UnitConversionService
{
    private sealed record UnitDefinition(
        string Id, string Name, string Symbol, string Category,
        Func<double, double> ToBase, Func<double, double> FromBase);

    private static double Identity(double value) => value;

    private readonly IReadOnlyDictionary<string, UnitDefinition> _units;
    private readonly IReadOnlyList<UnitCategory> _categories;

    public UnitConversionService()
    {
        var definitions = new[]
        {
            // Length base unit: meter
            new UnitDefinition("meter", "Meter", "m", "length", x => x, x => x),
            new UnitDefinition("kilometer", "Kilometer", "km", "length", x => x * 1000d, x => x / 1000d),
            new UnitDefinition("centimeter", "Centimeter", "cm", "length", x => x / 100d, x => x * 100d),
            new UnitDefinition("millimeter", "Millimeter", "mm", "length", x => x / 1000d, x => x * 1000d),
            new UnitDefinition("mile", "Mile", "mi", "length", x => x * 1609.344d, x => x / 1609.344d),
            new UnitDefinition("yard", "Yard", "yd", "length", x => x * 0.9144d, x => x / 0.9144d),
            new UnitDefinition("foot", "Foot", "ft", "length", x => x * 0.3048d, x => x / 0.3048d),
            new UnitDefinition("inch", "Inch", "in", "length", x => x * 0.0254d, x => x / 0.0254d),

            // Mass base unit: kilogram
            new UnitDefinition("kilogram", "Kilogram", "kg", "mass", x => x, x => x),
            new UnitDefinition("gram", "Gram", "g", "mass", x => x / 1000d, x => x * 1000d),
            new UnitDefinition("milligram", "Milligram", "mg", "mass", x => x / 1_000_000d, x => x * 1_000_000d),
            new UnitDefinition("pound", "Pound", "lb", "mass", x => x * 0.45359237d, x => x / 0.45359237d),
            new UnitDefinition("ounce", "Ounce", "oz", "mass", x => x * 0.028349523125d, x => x / 0.028349523125d),
            new UnitDefinition("tonne", "Metric tonne", "t", "mass", x => x * 1000d, x => x / 1000d),

            // Temperature base unit: Celsius. Conversions are affine, not factors.
            new UnitDefinition("celsius", "Celsius", "°C", "temperature", x => x, x => x),
            new UnitDefinition("fahrenheit", "Fahrenheit", "°F", "temperature", x => (x - 32d) * 5d / 9d, x => x * 9d / 5d + 32d),
            new UnitDefinition("kelvin", "Kelvin", "K", "temperature", x => x - 273.15d, x => x + 273.15d),
        };

        _units = definitions.ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);
        _categories = definitions.GroupBy(x => x.Category)
            .Select(group => new UnitCategory(
                group.Key,
                group.Key switch { "length" => "Length", "mass" => "Weight / Mass", "temperature" => "Temperature", _ => group.Key },
                group.Select(x => new UnitInfo(x.Id, x.Name, x.Symbol)).ToArray()))
            .ToArray();
    }

    public IReadOnlyList<UnitCategory> GetCategories() => _categories;

    public ConvertResponse Convert(double value, string fromUnit, string toUnit)
    {
        if (!double.IsFinite(value))
            throw new ArgumentException("Value must be a finite number.");

        if (!_units.TryGetValue(fromUnit.Trim(), out var from))
            throw new ArgumentException($"Unknown source unit '{fromUnit}'. Call GET /api/conversions/units to see supported units.");

        if (!_units.TryGetValue(toUnit.Trim(), out var to))
            throw new ArgumentException($"Unknown target unit '{toUnit}'. Call GET /api/conversions/units to see supported units.");

        if (!string.Equals(from.Category, to.Category, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException($"Cannot convert {from.Category} to {to.Category}. Choose units from the same category.");

        var result = to.FromBase(from.ToBase(value));
        if (!double.IsFinite(result))
            throw new ArgumentException("The conversion result is outside the supported numeric range.");

        return new ConvertResponse(value, from.Id, to.Id, result, from.Category);
    }
}
