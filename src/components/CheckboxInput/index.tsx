import { Checkbox, FormControlLabel } from "@mui/material";
import { Controller, Path, useFormContext } from "react-hook-form";

import type { FormSchema } from "@/schemas/form";

export const CheckboxInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!field.value}
              onChange={(_, checked) => field.onChange(checked)}
              disabled={field.disabled}
            />
          }
          label={label}
        />
      )}
    />
  );
};
