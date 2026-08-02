"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";

import { RENTEE_SCHEMA, RenteeSchema } from "@/schemas/form";

import { FieldRow } from "../FieldRow";
import { Subsection } from "../Subsection";

type CustomerEditorDialogProps = {
  initialValue: RenteeSchema;
  onClose: () => void;
  onSave: (customer: RenteeSchema) => Promise<void>;
};

export const CustomerEditorDialog = ({
  initialValue,
  onClose,
  onSave,
}: CustomerEditorDialogProps) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RenteeSchema>({
    resolver: zodResolver(RENTEE_SCHEMA),
    defaultValues: initialValue,
  });

  const onSubmit = async (data: RenteeSchema) => {
    await onSave(data);
  };

  return (
    <Dialog onClose={onClose} maxWidth="md" scroll="body" fullWidth open>
      <DialogTitle>Edit Customer</DialogTitle>
      <DialogContent>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          <Subsection title="Customer information">
            <Stack spacing={2}>
              <Controller
                name="full_name"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Full name"
                    fullWidth
                    size="small"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />

              <FieldRow>
                <Controller
                  name="address_street1"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Street address"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>

              <FieldRow>
                <Controller
                  name="address_city"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="City"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="address_state"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="State"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="address_zip"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Zip code"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>

              <FieldRow>
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Email address"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>

              <FieldRow>
                <Controller
                  name="cell_phone"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Cell phone"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="alternate_phone"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Alternate phone"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Driver's license">
            <Stack spacing={2}>
              <FieldRow>
                <Controller
                  name="driver_license_number"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Driver's license number"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="driver_license_state"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Driver's license state"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="driver_license_expiration"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date && date.isValid() ? date.toDate() : undefined)
                      }
                      label="Driver's license expiration"
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
              </FieldRow>

              <FieldRow>
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date && date.isValid() ? date.toDate() : undefined)
                      }
                      label="Date of birth"
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
                  name="verified"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label="Verified"
                    />
                  )}
                />
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Employer information">
            <Stack spacing={2}>
              <FieldRow>
                <Controller
                  name="employer.company"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Employer name"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="employer.position"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Position"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>

              <FieldRow>
                <Controller
                  name="employer.address_street1"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Street address"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>

              <FieldRow>
                <Controller
                  name="employer.address_city"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="City"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="employer.address_state"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="State"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <Controller
                  name="employer.address_zip"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      label="Zip code"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Insurance information">
            <FieldRow>
              <Controller
                name="insurance.company"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Insurance company"
                    fullWidth
                    size="small"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
              <Controller
                name="insurance.policy_number"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Policy number"
                    fullWidth
                    size="small"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </FieldRow>
          </Subsection>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" loading={isSubmitting}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
