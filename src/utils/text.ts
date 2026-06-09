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
 * A utility function to format a number value into a string.
 *
 * @param value The number value to be formatted.
 * @returns The formatted number as a string, or an empty string if the input value is invalid.
 */
export const formatNumber = (value: number | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) {
    return "";
  }

  return String(value);
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (typeof value !== "number" || isNaN(value)) {
    return formatter.format(0);
  }

  return formatter.format(value);
};
