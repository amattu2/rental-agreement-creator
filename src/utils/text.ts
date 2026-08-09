import dayjs, { type Dayjs } from "dayjs";

/**
 * A utility function to format a date value into a specified string format.
 *
 * @param value The date value to be formatted.
 * @param template The string template to format the date into. Defaults to "MM/DD/YYYY".
 * @returns The formatted date string, or an empty string if the input value is invalid.
 */
export const formatDate = (
  value: string | Dayjs | Date | undefined,
  template = "MM/DD/YYYY"
): string => {
  if (!value) {
    return "";
  }

  const parsedDate = dayjs(value);
  if (!parsedDate.isValid()) {
    return "";
  }

  return parsedDate.format(template);
};

/**
 * A utility function to coerce a number-like value into a string.
 *
 * @param value The number value to be formatted.
 * @returns The formatted number as a string, or an empty string if the input value is invalid.
 */
export const coerceNumber = (value: number | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) {
    return "";
  }

  return String(value);
};

/**
 * A utility function to format a number value into a string.
 *
 * @param value The number value to be formatted.
 * @param withDecimal Whether to include decimal places in the formatted string. Defaults to false.
 * @returns The formatted number as a string, or an empty string if the input value is invalid.
 */
export const formatNumber = (value: number | undefined, withDecimal = false): string => {
  if (typeof value !== "number" || isNaN(value)) {
    return "";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: withDecimal ? 2 : 0,
    maximumFractionDigits: withDecimal ? 2 : 0,
  });

  return formatter.format(value);
};

/**
 * A utility function to format a number value into a currency string.
 *
 * @param value The number value to be formatted as currency.
 * @param currency The currency code to format the value in. Defaults to "USD".
 * @returns The formatted currency string, or a default formatted zero value if the input value is invalid.
 */
export const formatCurrency = (value: number | undefined, currency = "USD"): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencySign: "accounting",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (typeof value !== "number" || isNaN(value)) {
    return formatter.format(0);
  }

  return formatter.format(value);
};

/**
 * A utility function to format an address object into a single string.
 *
 * @param address The address object containing street, city, state, and zip code.
 * @returns The formatted address string, or an empty string if the address is invalid.
 */
export const formatAddress = <
  T extends {
    address_street1?: string;
    address_city?: string;
    address_state?: string;
    address_zip?: string;
  },
>(
  address: T
): string => {
  if (!address) {
    return "";
  }

  let final = "";
  if (address.address_street1) {
    final += address.address_street1.trim();
  }
  if (address.address_city) {
    final += final ? ", " : "";
    final += address.address_city.trim();
  }
  if (address.address_state || address.address_zip) {
    final += final ? ", " : "";
    final += address.address_state ? address.address_state.trim() : "";
    if (address.address_state && address.address_zip) {
      final += " ";
    }
    final += address.address_zip ? address.address_zip.trim() : "";
  }

  return final;
};

/**
 * Flattens nested validation error objects into a unique list of resolved message strings.
 *
 * @param value A nested error object or value.
 * @returns A de-duplicated list of non-empty validation messages.
 */
export const flattenValidationErrors = (value: unknown): string[] => {
  const messages = new Set<string>();

  const collectMessages = (nestedValue: unknown): void => {
    if (!nestedValue || typeof nestedValue !== "object") {
      return;
    }

    if (
      "message" in nestedValue &&
      typeof nestedValue.message === "string" &&
      nestedValue.message.trim().length > 0
    ) {
      messages.add(nestedValue.message.trim());
    }

    Object.values(nestedValue).forEach((childValue) => {
      collectMessages(childValue);
    });
  };

  collectMessages(value);

  return Array.from(messages);
};
