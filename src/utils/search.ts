/**
 * A utility function to normalize string values before performing search operations.
 *
 * @param value The string value to normalize.
 * @returns The normalized string, trimmed and converted to lowercase.
 */
export const normalize = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";

/**
 * Extracts searchable tokens from a customer record.
 *
 * @param customer The customer record to extract search tokens from.
 * @returns An array of normalized search tokens derived from the customer's information.
 */
export const customerSearchTokens = ({ customer }: CustomerRecord): string[] =>
  [
    customer.full_name,
    customer.driver_license_number,
    customer.cell_phone,
    customer.alternate_phone,
    customer.email,
    customer.address_street1,
  ]
    .map((token) => normalize(token))
    .filter(Boolean);

/**
 * Determines if a customer record matches a given search query.
 *
 * @param customer The customer record to check against the query.
 * @param query The search query string.
 * @returns A boolean indicating whether the customer matches the search query.
 */
export const customerMatchesQuery = (customer: CustomerRecord, query: string): boolean => {
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

  const haystack = customerSearchTokens(customer);
  return terms.every((term) => haystack.some((token) => token.includes(term)));
};
