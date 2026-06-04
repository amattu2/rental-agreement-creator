import { Controller, Path, useFormContext } from "react-hook-form";
import { TextField } from "@mui/material";
import type { FormSchema } from "@/schemas/form";

export const TextInput = ({
  name,
  label,
  placeholder,
}: {
  name: Path<FormSchema>;
  label: string;
  placeholder?: string;
}) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          label={label}
          placeholder={placeholder}
          fullWidth
          size="small"
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  );
};
