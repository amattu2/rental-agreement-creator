import { customerMatchesQuery, customerSearchTokens, normalize } from "./search";

const makeCustomer = (overrides: Partial<CustomerRecord["customer"]> = {}): CustomerRecord =>
  ({
    uuid: "customer-1",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    customer: {
      full_name: "  Jane Doe  ",
      driver_license_number: "  D1234567  ",
      cell_phone: " 555-0100 ",
      alternate_phone: "",
      email: "  JANE.DOE@EXAMPLE.COM  ",
      address_street1: "  123 Main St  ",
      ...overrides,
    },
  }) as CustomerRecord;

describe("normalize", () => {
  it("trims and lowercases values", () => {
    expect(normalize("  Hello World  ")).toBe("hello world");
  });

  it("returns an empty string for undefined", () => {
    expect(normalize(undefined)).toBe("");
  });
});

describe("customerSearchTokens", () => {
  it("normalizes customer fields and removes empty tokens", () => {
    const customer = makeCustomer({
      alternate_phone: undefined,
      email: "   ",
    });

    expect(customerSearchTokens(customer)).toEqual([
      "jane doe",
      "d1234567",
      "555-0100",
      "123 main st",
    ]);
  });
});

describe("customerMatchesQuery", () => {
  it("returns true for empty queries", () => {
    const customer = makeCustomer();

    expect(customerMatchesQuery(customer, "")).toBe(true);
    expect(customerMatchesQuery(customer, "    ")).toBe(true);
  });

  it("matches terms case-insensitively across multiple tokens", () => {
    const customer = makeCustomer();

    expect(customerMatchesQuery(customer, "JANE example.com")).toBe(true);
  });

  it("returns false when any term is missing", () => {
    const customer = makeCustomer();

    expect(customerMatchesQuery(customer, "jane missing-term")).toBe(false);
  });

  it("handles extra whitespace between query terms", () => {
    const customer = makeCustomer();

    expect(customerMatchesQuery(customer, "   d123    main   ")).toBe(true);
  });
});
