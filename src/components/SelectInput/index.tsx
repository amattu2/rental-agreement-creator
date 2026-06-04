import { Controller, Path, useFormContext } from "react-hook-form";
import { MenuItem, TextField } from "@mui/material";
import type { FormSchema } from "@/schemas/form";

export const SelectInput = ({
  name,
  label,
  options,
}: {
  name: Path<FormSchema>;
  label: string;
  options: Array<{ label: string; value: string }>;
}) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          label={label}
          fullWidth
          size="small"
          error={!!error}
          helperText={error?.message}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
};
