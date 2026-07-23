/**
 * A utility function to normalize string values before performing search operations.
 *
 * @param value The string value to normalize.
 * @returns The normalized string, trimmed and converted to lowercase.
 */
export const normalize = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";

/**
 * Determines if a customer record matches a given search query.
 *
 * @param record The customer record to check against the query.
 * @param query The search query string.
 * @returns A boolean indicating whether the customer matches the search query.
 */
export const customerMatchesQuery = (record: CustomerRecord, query: string): boolean => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return true;
  }

  const terms = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const haystack = [
    record?.customer?.full_name,
    record?.customer?.driver_license_number,
    record?.customer?.cell_phone,
    record?.customer?.alternate_phone,
    record?.customer?.email,
    record?.customer?.address_street1,
  ]
    .map((token) => normalize(token))
    .filter(Boolean);

  return terms.every((term) => haystack.some((token) => token.includes(term)));
};

/**
 * Determines if a vehicle record matches a given search query.
 *
 * @param record The vehicle record to check against the query.
 * @param query The search query string.
 * @returns A boolean indicating whether the vehicle matches the search query.
 */
export const vehicleMatchesQuery = (record: VehicleRecord, query: string): boolean => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return true;
  }

  const terms = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const haystack = [
    record?.vehicle?.stock_number,
    record?.vehicle?.VIN,
    record?.vehicle?.license_plate,
    record?.vehicle?.year?.toString(),
    record?.vehicle?.make,
    record?.vehicle?.model,
  ]
    .map((token) => normalize(token))
    .filter(Boolean);

  return terms.every((term) => haystack.some((token) => token.includes(term)));
};

/**
 * Determines if an agreement record matches a given search query.
 * Searches across agreement number, customer name, and vehicle description.
 *
 * @param record The agreement record to check against the query.
 * @param query The search query string.
 * @returns A boolean indicating whether the agreement matches the search query.
 */
export const agreementMatchesQuery = (record: AgreementRecord, query: string): boolean => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return true;
  }

  const terms = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const { year, make, model } = record?.agreement?.rental_vehicle ?? {};
  const haystack = [
    record?.agreement?.agreement_number,
    record?.agreement?.rentee?.full_name,
    year?.toString(),
    make,
    model,
  ]
    .map((token) => normalize(token))
    .filter(Boolean);

  return terms.every((term) => haystack.some((token) => token.includes(term)));
};
