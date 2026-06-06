import Dayjs from "dayjs";

export const formatDate = (value: Dayjs.Dayjs | undefined, template = "MM/DD/YYYY"): string => {
  if (!value || !(value instanceof Dayjs) || !value.isValid()) {
    return "";
  }

  return value.format(template);
};

export const formatNumber = (value: number | undefined): string =>
  value === undefined ? "" : String(value);
