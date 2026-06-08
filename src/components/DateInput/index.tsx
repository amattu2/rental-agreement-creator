import { Controller, Path, useFormContext } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { FormSchema } from "@/schemas/form";
import dayjs from "dayjs";

export const DateInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          value={field.value ? dayjs(field.value as Date) : null}
          onChange={(date) => field.onChange(date && date.isValid() ? date.toDate() : undefined)}
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
