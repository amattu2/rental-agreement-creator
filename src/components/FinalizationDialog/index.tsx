"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import dayjs from "dayjs";
import { useMemo } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";

import { FUEL_LEVEL_OPTIONS } from "@/config/constants";
import { FINALIZATION_SCHEMA, type FinalizationSchema } from "@/schemas/finalization";
import type { FormSchema } from "@/schemas/form";

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
  const minOdometerIn = agreement.rental_agreement_info.odometer_out ?? 0;

  const finalizationSchema = useMemo<typeof FINALIZATION_SCHEMA>(
    () =>
      FINALIZATION_SCHEMA.extend({
        vehicle_returned_at: FINALIZATION_SCHEMA.shape.vehicle_returned_at.refine(
          (value) => dayjs(value).isAfter(dayjs(agreement.rental_agreement_info.date_out)),
          `Return date and time must be after pickup date and time`
        ),
        actual_odometer_in: FINALIZATION_SCHEMA.shape.actual_odometer_in.refine(
          (value) => value >= minOdometerIn,
          `Odometer at return must be greater than or equal to odometer at pickup`
        ),
      }),
    [agreement.rental_agreement_info.date_out, minOdometerIn]
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FinalizationSchema>({
    resolver: zodResolver(finalizationSchema),
    defaultValues: {
      vehicle_returned_at: new Date(),
      actual_odometer_in: 0,
      actual_fuel_level_in: "",
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
                label="Return date"
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
                label="Odometer in"
                type="number"
                slotProps={{
                  htmlInput: {
                    step: 1,
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
                label="Fuel level in"
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
