import { MenuItem, TextField } from "@mui/material";
import { Controller, Path, useFormContext } from "react-hook-form";

import type { FormSchema } from "@/schemas/form";

export const SelectInput = ({
  name,
  label,
  options,
  onChange: onChangeProp,
}: {
  name: Path<FormSchema>;
  label: string;
  options: Array<{ label: string; value: string }>;
  onChange?: (value: string) => void;
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
          onChange={(event) => {
            field.onChange(event.target.value);
            onChangeProp?.(event.target.value);
          }}
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
