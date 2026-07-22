import {
  agreementMatchesQuery,
  customerMatchesQuery,
  normalize,
  vehicleMatchesQuery,
} from "./search";

const makeAgreement = (overrides: Partial<AgreementRecord["agreement"]> = {}): AgreementRecord =>
  ({
    uuid: "agreement-1",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    agreement: {
      agreement_number: "AGR-001",
      rentee: { full_name: "  Jane Doe  " },
      rental_vehicle: { year: 2024, make: "  Ford  ", model: "  Transit  " },
      ...overrides,
    },
  }) as unknown as AgreementRecord;

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

const makeVehicle = (overrides: Partial<VehicleRecord["vehicle"]> = {}): VehicleRecord =>
  ({
    uuid: "vehicle-1",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    vehicle: {
      stock_number: "  STK-123  ",
      VIN: "  1FTBW2CM5MKA00001  ",
      license_plate: " ABC-123 ",
      year: 2024,
      make: "  Ford  ",
      model: "  Transit  ",
      color: " White ",
      rental_rates: [],
      usage_rates: [],
      ...overrides,
    },
  }) as VehicleRecord;

describe("normalize", () => {
  it("trims and lowercases values", () => {
    expect(normalize("  Hello World  ")).toBe("hello world");
  });

  it("returns an empty string for undefined", () => {
    expect(normalize(undefined)).toBe("");
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

describe("vehicleMatchesQuery", () => {
  it("returns true for empty queries", () => {
    const vehicle = makeVehicle();

    expect(vehicleMatchesQuery(vehicle, "")).toBe(true);
    expect(vehicleMatchesQuery(vehicle, "    ")).toBe(true);
  });

  it("matches terms across stock number and descriptive fields", () => {
    const vehicle = makeVehicle();

    expect(vehicleMatchesQuery(vehicle, "stk-123 transit")).toBe(true);
  });

  it("returns false when any term is missing", () => {
    const vehicle = makeVehicle();

    expect(vehicleMatchesQuery(vehicle, "ford missing-term")).toBe(false);
  });

  it("matches VIN and license plate case-insensitively", () => {
    const vehicle = makeVehicle();

    expect(vehicleMatchesQuery(vehicle, "mka00001 abc-123")).toBe(true);
  });
});

describe("agreementMatchesQuery", () => {
  it("returns true for empty queries", () => {
    const agreement = makeAgreement();

    expect(agreementMatchesQuery(agreement, "")).toBe(true);
    expect(agreementMatchesQuery(agreement, "    ")).toBe(true);
  });

  it("matches by agreement number case-insensitively", () => {
    const agreement = makeAgreement();

    expect(agreementMatchesQuery(agreement, "agr-001")).toBe(true);
  });

  it("matches by customer full name", () => {
    const agreement = makeAgreement();

    expect(agreementMatchesQuery(agreement, "jane doe")).toBe(true);
  });

  it("matches by vehicle year, make, and model", () => {
    const agreement = makeAgreement();

    expect(agreementMatchesQuery(agreement, "2024 ford transit")).toBe(true);
  });

  it("returns false when a term is not found in any field", () => {
    const agreement = makeAgreement();

    expect(agreementMatchesQuery(agreement, "AGR-001 missing-term")).toBe(false);
  });

  it("handles partial matches within fields", () => {
    const agreement = makeAgreement();

    expect(agreementMatchesQuery(agreement, "tran")).toBe(true);
  });
});
