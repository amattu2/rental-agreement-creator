"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import type { FormSchema } from "@/schemas/form";
import { FINALIZATION_SCHEMA, type FinalizationSchema } from "@/schemas/finalization";
import { FUEL_LEVEL_OPTIONS } from "@/config/constants";

type FinalizationDialogProps = {
  agreement: FormSchema;
  onClose: () => void;
  onConfirm: (details: FinalizationSchema) => Promise<void>;
};

/**
 * FinalizationDialog component for finalizing a rental agreement.
 *
 * @param agreement - The rental agreement details
 * @param onClose - Callback function to close the dialog
 * @param onConfirm - Callback function to confirm the finalization with the provided details
 * @returns The FinalizationDialog component
 */
export const FinalizationDialog = ({ agreement, onClose, onConfirm }: FinalizationDialogProps) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FinalizationSchema>({
    resolver: zodResolver(FINALIZATION_SCHEMA),
    defaultValues: {
      vehicle_returned_at: new Date(),
      actual_odometer_in: agreement.rental_agreement_info.odometer_out ?? 0,
      actual_fuel_level_in: "F",
      finalized_at: new Date(),
    },
  });

  const onSubmit: SubmitHandler<FinalizationSchema> = (data: FinalizationSchema) => onConfirm(data);

  return (
    <Dialog onClose={onClose} maxWidth="sm" open fullWidth>
      <DialogTitle>Finalize Agreement</DialogTitle>
      <DialogContent>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3} sx={{ mt: 2 }}>
          <Controller
            name="vehicle_returned_at"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateTimePicker
                {...field}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) =>
                  field.onChange(date && date.isValid() ? date.toDate() : undefined)
                }
                label="Vehicle Returned Date/Time"
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

          <Controller
            name="actual_odometer_in"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                onChange={(event) => {
                  field.onChange(event.target.value === "" ? "" : Number(event.target.value));
                }}
                label="Odometer In"
                type="number"
                slotProps={{
                  htmlInput: {
                    step: 1,
                    min: agreement.rental_agreement_info.odometer_out ?? 0,
                  },
                }}
                fullWidth
                size="small"
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          <Controller
            name="actual_fuel_level_in"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                value={field.value ?? ""}
                label="Fuel Level In"
                fullWidth
                size="small"
                error={!!error}
                helperText={error?.message}
              >
                {FUEL_LEVEL_OPTIONS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
