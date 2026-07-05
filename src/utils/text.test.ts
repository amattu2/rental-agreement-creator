import {
  coerceNumber,
  formatAddress,
  formatContactInfo,
  formatCurrency,
  formatNumber,
} from "./text";

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
    expect(formatCurrency(-98.1)).toBe("($98.10)");
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

describe("formatAddress", () => {
  it("formats full address as Street1, City, State ZIP", () => {
    expect(
      formatAddress({
        address_street1: "123 Main St",
        address_city: "Austin",
        address_state: "TX",
        address_zip: "78701",
      })
    ).toBe("123 Main St, Austin, TX 78701");
  });

  it("formats address without state as Street1, City, ZIP", () => {
    expect(
      formatAddress({
        address_street1: "123 Main St",
        address_city: "Austin",
        address_zip: "78701",
      })
    ).toBe("123 Main St, Austin, 78701");
  });

  it("formats state and zip only as State ZIP", () => {
    expect(
      formatAddress({
        address_state: "TX",
        address_zip: "78701",
      })
    ).toBe("TX 78701");
  });

  it("formats state only", () => {
    expect(
      formatAddress({
        address_state: "TX",
      })
    ).toBe("TX");
  });

  it("formats zip only", () => {
    expect(
      formatAddress({
        address_zip: "78701",
      })
    ).toBe("78701");
  });

  it("returns an empty string when all parts are missing", () => {
    expect(formatAddress({})).toBe("");
  });

  it("trims whitespace from each part", () => {
    expect(
      formatAddress({
        address_street1: " 123 Main St ",
        address_city: " Austin ",
        address_state: " TX ",
        address_zip: " 78701 ",
      })
    ).toBe("123 Main St, Austin, TX 78701");
  });
});

describe("formatContactInfo", () => {
  it("returns an empty array when no contact fields are present", () => {
    expect(
      formatContactInfo({
        full_name: "Jane Doe",
        address_street1: "123 Main St",
        address_city: "Austin",
        address_state: "TX",
        address_zip: "78701",
        verified: true,
        driver_license_number: "D1234567",
        driver_license_state: "TX",
        driver_license_expiration: new Date("2099-01-01"),
        date_of_birth: new Date("1990-01-01"),
        cell_phone: "",
      })
    ).toEqual([]);
  });

  it("returns contact lines in Cell, Alt, Email order", () => {
    expect(
      formatContactInfo({
        full_name: "Jane Doe",
        address_street1: "123 Main St",
        address_city: "Austin",
        address_state: "TX",
        address_zip: "78701",
        verified: true,
        driver_license_number: "D1234567",
        driver_license_state: "TX",
        driver_license_expiration: new Date("2099-01-01"),
        date_of_birth: new Date("1990-01-01"),
        cell_phone: "555-0100",
        alternate_phone: "555-0199",
        email: "jane@example.com",
      })
    ).toEqual(["Cell: 555-0100", "Alt: 555-0199", "Email: jane@example.com"]);
  });

  it("includes only provided fields", () => {
    expect(
      formatContactInfo({
        full_name: "Jane Doe",
        address_street1: "123 Main St",
        address_city: "Austin",
        address_state: "TX",
        address_zip: "78701",
        verified: true,
        driver_license_number: "D1234567",
        driver_license_state: "TX",
        driver_license_expiration: new Date("2099-01-01"),
        date_of_birth: new Date("1990-01-01"),
        cell_phone: "555-0100",
      })
    ).toEqual(["Cell: 555-0100"]);
  });
});
