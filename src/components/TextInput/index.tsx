import { Controller, Path, useFormContext } from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";
import type { FormSchema } from "@/schemas/form";

export const TextInput = ({
  name,
  label,
  placeholder,
  ...rest
}: {
  name: Path<FormSchema>;
  label: string;
  placeholder?: string;
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
          onChange={(event) => field.onChange(event.target.value)}
          label={label}
          placeholder={placeholder}
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
