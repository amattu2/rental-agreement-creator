import { styled, TextField, type TextFieldProps } from "@mui/material";
import { Controller, Path, useFormContext } from "react-hook-form";

import type { FormSchema } from "@/schemas/form";

type ResizableTextFieldProps = TextFieldProps & { resizable?: boolean };

const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== "resizable",
})<ResizableTextFieldProps>(({ multiline, resizable }) =>
  resizable && multiline
    ? {
        "& .MuiOutlinedInput-root": { padding: 0 },
        "& .MuiInputBase-inputMultiline": {
          resize: "vertical",
          boxSizing: "border-box",
          minHeight: "28px",
          margin: "6px",
          padding: "8.5px 14px",
        },
      }
    : {}
);

export const TextInput = ({
  name,
  label,
  placeholder,
  resizable,
  multiline,
  ...rest
}: {
  name: Path<FormSchema>;
  label: string;
  placeholder?: string;
  resizable?: boolean;
} & TextFieldProps) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <StyledTextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          label={label}
          placeholder={placeholder}
          fullWidth
          size="small"
          multiline={multiline}
          resizable={resizable}
          error={!!error}
          helperText={error?.message}
          {...rest}
        />
      )}
    />
  );
};
