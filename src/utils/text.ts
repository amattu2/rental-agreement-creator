import dayjs, { type Dayjs } from "dayjs";

export const formatDate = (value: Dayjs | undefined, template = "MM/DD/YYYY"): string => {
  if (!value || !(value instanceof dayjs) || !value.isValid()) {
    return "";
  }

  return value.format(template);
};

export const formatNumber = (value: number | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) {
    return "";
  }

  return String(value);
};
