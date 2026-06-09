import { coerceNumber, formatCurrency, formatNumber } from "./text";

describe("coerceNumber", () => {
  it("returns the number as a plain string", () => {
    expect(coerceNumber(1234.5)).toBe("1234.5");
  });

  it("returns an empty string when value is undefined", () => {
    expect(coerceNumber(undefined)).toBe("");
  });

  it("returns an empty string when value is NaN", () => {
    expect(coerceNumber(Number.NaN)).toBe("");
  });
});

describe("formatNumber", () => {
  it("formats a number with grouping by default", () => {
    expect(formatNumber(1234.5)).toBe("1,235");
  });

  it("formats a number with two decimal places when requested", () => {
    expect(formatNumber(1234.5, true)).toBe("1,234.50");
  });

  it("returns an empty string when value is undefined", () => {
    expect(formatNumber(undefined)).toBe("");
  });

  it("returns an empty string when value is NaN", () => {
    expect(formatNumber(Number.NaN)).toBe("");
  });
});

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
