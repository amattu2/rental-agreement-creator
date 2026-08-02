import { TextField, TextFieldProps } from "@mui/material";
import { Controller, Path, useFormContext } from "react-hook-form";

import type { FormSchema } from "@/schemas/form";

export const NumberInput = ({
  name,
  label,
  ...rest
}: {
  name: Path<FormSchema>;
  label: string;
} & TextFieldProps) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => {
            field.onChange(event.target.value === "" ? "" : Number(event.target.value));
          }}
          label={label}
          type="number"
          slotProps={{
            ...rest.slotProps,
            htmlInput: {
              step: 1,
              min: 0,
              ...(rest.slotProps?.htmlInput ?? {}),
            },
          }}
          fullWidth
          size="small"
          error={!!error}
          helperText={error?.message}
          {...rest}
        />
      )}
    />
  );
};
