import { Controller, Path, useFormContext } from "react-hook-form";
import { TextField } from "@mui/material";
import type { FormSchema } from "@/schemas/form";

export const NumberInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
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
            const nextValue = event.target.value === "" ? undefined : Number(event.target.value);
            field.onChange(Number.isNaN(nextValue) ? undefined : nextValue);
          }}
          label={label}
          type="number"
          slotProps={{ htmlInput: { step: 1, min: 0 } }}
          fullWidth
          size="small"
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  );
};
