"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import {
  MAX_RENTAL_RATES,
  MAX_USAGE_RATES,
  RATE_UNIT_OPTIONS,
  USAGE_TYPE_OPTIONS,
} from "@/config/constants";
import { VEHICLE_SCHEMA, VehicleSchema } from "@/schemas/form";

import { FieldCell } from "../FieldCell";
import { FieldRow } from "../FieldRow";
import { Subsection } from "../Subsection";

type VehicleEditorDialogProps = {
  initialValue: VehicleSchema;
  onClose: () => void;
  onSave: (vehicle: VehicleSchema) => Promise<void>;
};

export const VehicleEditorDialog = ({
  initialValue,
  onClose,
  onSave,
}: VehicleEditorDialogProps) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<VehicleSchema>({
    resolver: zodResolver(VEHICLE_SCHEMA),
    defaultValues: initialValue,
  });

  const {
    fields: rentalRateFields,
    append: appendRentalRate,
    remove: removeRentalRate,
  } = useFieldArray({
    control,
    name: "rental_rates",
  });

  const {
    fields: usageRateFields,
    append: appendUsageRate,
    remove: removeUsageRate,
  } = useFieldArray({
    control,
    name: "usage_rates",
  });

  const onSubmit = async (data: VehicleSchema) => {
    await onSave({
      ...data,
      rental_rates: data.rental_rates ?? [],
      usage_rates: data.usage_rates ?? [],
    });
  };

  return (
    <Dialog onClose={onClose} maxWidth="md" scroll="body" fullWidth open>
      <DialogTitle>Edit Vehicle</DialogTitle>
      <DialogContent>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3} sx={{ mt: 1 }}>
          <Subsection title="Vehicle information">
            <Stack spacing={2}>
              <Controller
                name="stock_number"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="Stock number"
                    fullWidth
                    size="small"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
              <Controller
                name="VIN"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="VIN"
                    fullWidth
                    size="small"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />

              <FieldRow>
                <FieldCell>
                  <Controller
                    name="year"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === "" ? "" : Number(event.target.value)
                          )
                        }
                        label="Year"
                        type="number"
                        fullWidth
                        size="small"
                        error={!!error}
                        helperText={error?.message}
                        slotProps={{ htmlInput: { step: 1, min: 0 } }}
                      />
                    )}
                  />
                </FieldCell>
                <FieldCell>
                  <Controller
                    name="make"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        label="Make"
                        fullWidth
                        size="small"
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </FieldCell>
                <FieldCell>
                  <Controller
                    name="model"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        label="Model"
                        fullWidth
                        size="small"
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </FieldCell>
              </FieldRow>

              <FieldRow>
                <FieldCell>
                  <Controller
                    name="license_plate"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        label="License plate"
                        fullWidth
                        size="small"
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </FieldCell>
                <FieldCell>
                  <Controller
                    name="color"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        label="Color"
                        fullWidth
                        size="small"
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Rental Rates">
            <Stack spacing={2}>
              {rentalRateFields.map((field, index) => (
                <Stack
                  key={field.id}
                  spacing={2}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
                >
                  <FieldRow>
                    <FieldCell>
                      <Controller
                        name={`rental_rates.${index}.rate_unit`}
                        control={control}
                        render={({ field: rateUnitField, fieldState: { error } }) => (
                          <TextField
                            {...rateUnitField}
                            select
                            value={rateUnitField.value ?? ""}
                            onChange={(event) => {
                              rateUnitField.onChange(event.target.value);
                              const note = RATE_UNIT_OPTIONS.find(
                                ({ value }) => value === event.target.value
                              )?.note;
                              setValue(`rental_rates.${index}.rate_note`, note ?? "", {
                                shouldDirty: true,
                              });
                            }}
                            label="Unit"
                            fullWidth
                            size="small"
                            error={!!error}
                            helperText={error?.message}
                          >
                            {RATE_UNIT_OPTIONS.map(({ label, value }) => (
                              <MenuItem key={value} value={value}>
                                {label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </FieldCell>
                    <FieldCell>
                      <Controller
                        name={`rental_rates.${index}.rate_cost`}
                        control={control}
                        render={({ field: rateCostField, fieldState: { error } }) => (
                          <TextField
                            {...rateCostField}
                            value={rateCostField.value ?? ""}
                            onChange={(event) =>
                              rateCostField.onChange(
                                event.target.value === "" ? "" : Number(event.target.value)
                              )
                            }
                            label="Cost Per Unit"
                            type="number"
                            fullWidth
                            size="small"
                            error={!!error}
                            helperText={error?.message}
                          />
                        )}
                      />
                    </FieldCell>
                    <FieldCell>
                      <Controller
                        name={`rental_rates.${index}.rate_note`}
                        control={control}
                        render={({ field: rateField, fieldState: { error } }) => (
                          <TextField
                            {...rateField}
                            value={rateField.value ?? ""}
                            label="Unit Note"
                            fullWidth
                            size="small"
                            error={!!error}
                            helperText={error?.message}
                            slotProps={{ input: { readOnly: true } }}
                            disabled
                          />
                        )}
                      />
                    </FieldCell>
                    <IconButton
                      aria-label="Delete rental rate"
                      onClick={() => removeRentalRate(index)}
                      sx={{ alignSelf: "center" }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </FieldRow>
                </Stack>
              ))}

              <Button
                type="button"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  appendRentalRate({
                    rate_unit: RATE_UNIT_OPTIONS[0].value,
                    rate_cost: 0,
                    rate_note: RATE_UNIT_OPTIONS[0].note,
                  })
                }
                disabled={rentalRateFields.length >= MAX_RENTAL_RATES}
              >
                Add Rate
              </Button>
            </Stack>
          </Subsection>

          <Subsection title="Usage Charges">
            <Stack spacing={2}>
              {usageRateFields.map((field, index) => (
                <Stack
                  key={field.id}
                  spacing={2}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
                >
                  <FieldRow>
                    <FieldCell>
                      <Controller
                        name={`usage_rates.${index}.usage_type`}
                        control={control}
                        render={({ field: usageTypeField, fieldState: { error } }) => (
                          <TextField
                            {...usageTypeField}
                            select
                            value={usageTypeField.value ?? ""}
                            onChange={(event) => {
                              usageTypeField.onChange(event.target.value);
                              const note = USAGE_TYPE_OPTIONS.find(
                                ({ value }) => value === event.target.value
                              )?.note;
                              setValue(`usage_rates.${index}.usage_note`, note ?? "", {
                                shouldDirty: true,
                              });
                            }}
                            label="Type"
                            fullWidth
                            size="small"
                            error={!!error}
                            helperText={error?.message}
                          >
                            {USAGE_TYPE_OPTIONS.map(({ label, value }) => (
                              <MenuItem key={value} value={value}>
                                {label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </FieldCell>
                    <FieldCell>
                      <Controller
                        name={`usage_rates.${index}.usage_cost`}
                        control={control}
                        render={({ field: usageCostField, fieldState: { error } }) => (
                          <TextField
                            {...usageCostField}
                            value={usageCostField.value ?? ""}
                            onChange={(event) =>
                              usageCostField.onChange(
                                event.target.value === "" ? "" : Number(event.target.value)
                              )
                            }
                            label="Cost Per Unit"
                            type="number"
                            fullWidth
                            size="small"
                            error={!!error}
                            helperText={error?.message}
                          />
                        )}
                      />
                    </FieldCell>
                    <FieldCell>
                      <Controller
                        name={`usage_rates.${index}.usage_note`}
                        control={control}
                        render={({ field: usageField, fieldState: { error } }) => (
                          <TextField
                            {...usageField}
                            value={usageField.value ?? ""}
                            label="Unit Note"
                            fullWidth
                            size="small"
                            error={!!error}
                            helperText={error?.message}
                            slotProps={{ input: { readOnly: true } }}
                            disabled
                          />
                        )}
                      />
                    </FieldCell>
                    <IconButton
                      aria-label="Delete usage charge"
                      onClick={() => removeUsageRate(index)}
                      sx={{ alignSelf: "center" }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </FieldRow>
                </Stack>
              ))}

              <Button
                type="button"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  appendUsageRate({
                    usage_type: USAGE_TYPE_OPTIONS[0].value,
                    usage_cost: 0,
                    usage_note: USAGE_TYPE_OPTIONS[0].note,
                  })
                }
                disabled={usageRateFields.length >= MAX_USAGE_RATES}
              >
                Add Usage Charge
              </Button>
            </Stack>
          </Subsection>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
