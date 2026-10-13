namespace UnitConversion.Api.Models;

public sealed record UnitInfo(string Id, string Name, string Symbol);
public sealed record UnitCategory(string Id, string Name, IReadOnlyList<UnitInfo> Units);
