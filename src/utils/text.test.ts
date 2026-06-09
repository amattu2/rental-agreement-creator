import { formatCurrency } from "./text";

describe("formatCurrency", () => {
  it("formats a positive number as USD by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats negative numbers", () => {
    expect(formatCurrency(-98.1)).toBe("-$98.10");
  });

  it("returns formatted zero when value is undefined", () => {
    expect(formatCurrency(undefined)).toBe("$0.00");
  });

  it("returns formatted zero when value is NaN", () => {
    expect(formatCurrency(Number.NaN)).toBe("$0.00");
  });

  it("formats using the provided currency code", () => {
    expect(formatCurrency(1000, "EUR")).toBe("€1,000.00");
  });
});