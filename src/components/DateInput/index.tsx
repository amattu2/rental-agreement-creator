import { Controller, Path, useFormContext } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { FormSchema } from "@/schemas/form";
import dayjs, { type Dayjs } from "dayjs";

export const DateInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          value={dayjs(field.value as Dayjs) ?? null}
          onChange={(date) => field.onChange(date)}
          label={label}
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              error: !!error,
              helperText: error?.message,
            },
          }}
        />
      )}
    />
  );
};
