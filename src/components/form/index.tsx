"use client";

import { useCallback, useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CalculateIcon from "@mui/icons-material/Calculate";
import SearchIcon from "@mui/icons-material/Search";
import { FormSchema } from "@/schemas/form";
import { ChargeConfirmationDialog } from "../ChargeConfirmationDialog";
import { CheckboxInput } from "../CheckboxInput";
import { DateInput } from "../DateInput";
import { DateTimeInput } from "../DateTimeInput";
import { FieldCell } from "../FieldCell";
import { FieldRow } from "../FieldRow";
import { NumberInput } from "../NumberInput";
import { Section } from "../Section";
import { SelectInput } from "../SelectInput";
import { SignatureInput } from "../SignatureInput";
import { Subsection } from "../Subsection";
import { TextInput } from "../TextInput";
import { VehicleSelectionDialog } from "../VehicleSelectionDialog";
import { CustomerSelectionDialog } from "../CustomerSelectionDialog";
import {
  MAX_ADDITIONAL_DRIVERS,
  FUEL_LEVEL_OPTIONS,
  DISTANCE_MEASUREMENT_OPTIONS,
  PAYLOAD_MEASUREMENT_OPTIONS,
  MAX_RENTAL_RATES,
  MAX_USAGE_RATES,
  RATE_UNIT_OPTIONS,
  USAGE_TYPE_OPTIONS,
  DEFAULT_CUSTOMER,
  DEFAULT_VEHICLE,
} from "@/config/constants";
import { useBillingState } from "../BillingContext";

const StyledIconButton = styled(IconButton)({
  marginRight: "-5px",
});

export const RentalAgreementForm = () => {
  const {
    control,
    formState: { isDirty, isSubmitting, disabled },
    reset,
    setValue,
    watch,
  } = useFormContext<FormSchema>();
  const { status: billingStatus, description: billingDescription } = useBillingState();

  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [customerSelectionOpen, setCustomerSelectionOpen] = useState<boolean>(false);
  const [vehicleSelectionOpen, setVehicleSelectionOpen] = useState<boolean>(false);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState<boolean>(false);

  const {
    fields: additionalDriverFields,
    append: appendAdditionalDriver,
    remove: removeAdditionalDriver,
  } = useFieldArray({
    control,
    name: "additional_drivers",
  });

  const {
    fields: rentalRateFields,
    append: appendRentalRate,
    remove: removeRentalRate,
  } = useFieldArray({
    control,
    name: "rental_vehicle.rental_rates",
  });

  const {
    fields: usageRateFields,
    append: appendUsageRate,
    remove: removeUsageRate,
  } = useFieldArray({
    control,
    name: "rental_vehicle.usage_rates",
  });

  const odometerOut = watch("rental_agreement_info.odometer_out");
  const maxDistance = watch("rental_agreement_info.max_distance");
  const odometerIn = watch("rental_agreement_info.odometer_in");
  const vehicleDamageWaiver = watch("vehicle_damage_waiver");
  const hasVehicleDamageWaiver = vehicleDamageWaiver !== undefined;
  const personalAccidentInsurance = watch("personal_accident_insurance");
  const hasPersonalAccidentInsurance = personalAccidentInsurance !== undefined;
  const customerUuid = watch("customer_uuid");
  const vehicleUuid = watch("vehicle_uuid");

  const handleClearCustomer = useCallback(() => {
    setValue("customer_uuid", undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("rentee", DEFAULT_CUSTOMER, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [setValue]);

  const handleClearVehicle = useCallback(() => {
    setValue("vehicle_uuid", undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("rental_vehicle", DEFAULT_VEHICLE, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("rental_vehicle.rental_rates", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("rental_vehicle.usage_rates", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [setValue]);

  const CalculateAdornment = useMemo<React.ReactElement>(() => {
    const newDistance = (odometerOut ?? 0) + (maxDistance ?? 0);

    return (
      <Tooltip title="Calculate odometer at return">
        <span>
          <StyledIconButton
            type="button"
            size="small"
            disabled={newDistance === 0 || newDistance === odometerIn || disabled}
            onClick={() =>
              setValue("rental_agreement_info.odometer_in", newDistance, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
          >
            <CalculateIcon />
          </StyledIconButton>
        </span>
      </Tooltip>
    );
  }, [odometerOut, maxDistance, odometerIn, disabled, setValue]);

  const VehicleSelectAdornment = useMemo<React.ReactElement>(() => {
    const adornments: React.ReactElement[] = [];

    if (vehicleUuid) {
      adornments.push(
        <Tooltip title="Clear vehicle selection" key="clear-vehicle-button">
          <span>
            <Chip
              key="vehicle-chip"
              label="Existing Vehicle"
              aria-label="Clear vehicle selection"
              size="small"
              variant="outlined"
              color="primary"
              onDelete={handleClearVehicle}
              disabled={disabled}
            />
          </span>
        </Tooltip>
      );
    }

    adornments.push(
      <Tooltip title="Select an existing vehicle" key="select-vehicle-button">
        <span>
          <StyledIconButton
            type="button"
            size="small"
            aria-label="Select an existing vehicle"
            onClick={() => setVehicleSelectionOpen(true)}
            disabled={disabled}
          >
            <SearchIcon />
          </StyledIconButton>
        </span>
      </Tooltip>
    );

    return <>{adornments}</>;
  }, [disabled, vehicleUuid, handleClearVehicle, setVehicleSelectionOpen]);

  const CustomerSelectAdornment = useMemo<React.ReactElement>(() => {
    const adornments: React.ReactElement[] = [];

    if (customerUuid) {
      adornments.push(
        <Tooltip title="Clear customer selection" key="clear-customer-button">
          <span>
            <Chip
              key="customer-chip"
              label="Existing Customer"
              aria-label="Clear customer selection"
              size="small"
              variant="outlined"
              color="primary"
              onDelete={handleClearCustomer}
              disabled={disabled}
            />
          </span>
        </Tooltip>
      );
    }

    adornments.push(
      <Tooltip title="Select an existing customer" key="select-customer-button">
        <span>
          <StyledIconButton
            type="button"
            size="small"
            aria-label="Select an existing customer"
            onClick={() => setCustomerSelectionOpen(true)}
            disabled={disabled}
          >
            <SearchIcon />
          </StyledIconButton>
        </span>
      </Tooltip>
    );

    return <>{adornments}</>;
  }, [customerUuid, disabled, setCustomerSelectionOpen, handleClearCustomer]);

  const tooltipText = useMemo<string>(() => {
    if (disabled) {
      return "";
    }

    return billingDescription;
  }, [disabled, billingDescription]);

  const handleResetClick = () => setIsResetDialogOpen(true);

  const handleResetCancel = () => {
    setIsResetDialogOpen(false);
  };

  const handleResetConfirm = () => {
    reset();
    setIsResetDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Section
        title="Agreement Information"
        description="Enter the automotive rental agreement information."
      >
        <Stack spacing={3}>
          <TextInput name="agreement_number" label="Agreement number" />

          <FieldRow>
            <FieldCell>
              <DateTimeInput name="rental_agreement_info.date_out" label="Pickup date" />
            </FieldCell>
            <FieldCell>
              <DateTimeInput name="rental_agreement_info.date_in" label="Return date" />
            </FieldCell>
          </FieldRow>

          <FieldRow>
            <FieldCell>
              <NumberInput name="rental_agreement_info.max_distance" label="Maximum distance" />
            </FieldCell>
            <FieldCell>
              <SelectInput
                name="rental_agreement_info.max_distance_measurement"
                label="Distance unit"
                options={DISTANCE_MEASUREMENT_OPTIONS}
              />
            </FieldCell>
          </FieldRow>

          <FieldRow>
            <FieldCell>
              <NumberInput name="rental_agreement_info.max_payload" label="Maximum payload" />
            </FieldCell>
            <FieldCell>
              <SelectInput
                name="rental_agreement_info.max_payload_measurement"
                label="Payload unit"
                options={PAYLOAD_MEASUREMENT_OPTIONS}
              />
            </FieldCell>
          </FieldRow>
        </Stack>
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section
        title="Rental Vehicle"
        description="Enter the vehicle being rented, including its identifying details and appearance."
      >
        <Stack spacing={3}>
          <Subsection title="Vehicle Information">
            <Stack spacing={2}>
              <TextInput
                name="rental_vehicle.stock_number"
                label="Stock number"
                disabled={!!vehicleUuid}
                slotProps={{
                  input: {
                    endAdornment: VehicleSelectAdornment,
                  },
                }}
              />

              <TextInput name="rental_vehicle.VIN" label="VIN" />

              <FieldRow>
                <FieldCell>
                  <NumberInput name="rental_vehicle.year" label="Year" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rental_vehicle.make" label="Make" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rental_vehicle.model" label="Model" />
                </FieldCell>
              </FieldRow>

              <FieldRow>
                <FieldCell>
                  <TextInput name="rental_vehicle.license_plate" label="License plate" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rental_vehicle.color" label="Color" />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Vehicle Condition">
            <Stack spacing={2}>
              <FieldRow>
                <FieldCell>
                  <NumberInput
                    name="rental_agreement_info.odometer_out"
                    label="Odometer at pickup"
                  />
                </FieldCell>
                <FieldCell>
                  <NumberInput
                    name="rental_agreement_info.odometer_in"
                    label="Odometer at return"
                    slotProps={{
                      input: {
                        endAdornment: CalculateAdornment,
                      },
                    }}
                  />
                </FieldCell>
              </FieldRow>

              <FieldRow>
                <FieldCell>
                  <SelectInput
                    name="rental_agreement_info.fuel_level_out"
                    label="Fuel level at pickup"
                    options={FUEL_LEVEL_OPTIONS.map((level) => ({ label: level, value: level }))}
                  />
                </FieldCell>
                <FieldCell>
                  <SelectInput
                    name="rental_agreement_info.fuel_level_in"
                    label="Fuel level at return"
                    options={FUEL_LEVEL_OPTIONS.map((level) => ({ label: level, value: level }))}
                  />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Rental Rates">
            <Stack spacing={2} mb={2}>
              {rentalRateFields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Rate #{index + 1}
                      </Typography>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeRentalRate(index)}
                        disabled={disabled}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <FieldRow>
                      <FieldCell>
                        <SelectInput
                          name={`rental_vehicle.rental_rates.${index}.rate_unit`}
                          label="Unit"
                          options={RATE_UNIT_OPTIONS}
                          onChange={(value) => {
                            const note = RATE_UNIT_OPTIONS.find((o) => o.value === value)?.note;
                            setValue(`rental_vehicle.rental_rates.${index}.rate_note`, note ?? "", {
                              shouldDirty: true,
                            });
                          }}
                        />
                      </FieldCell>
                      <FieldCell>
                        <NumberInput
                          name={`rental_vehicle.rental_rates.${index}.rate_cost`}
                          label="Cost Per Unit"
                          slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                        />
                      </FieldCell>
                    </FieldRow>

                    <FieldRow>
                      <FieldCell>
                        <TextInput
                          name={`rental_vehicle.rental_rates.${index}.rate_note`}
                          label="Unit Note"
                          slotProps={{ input: { readOnly: true } }}
                          disabled
                        />
                      </FieldCell>
                    </FieldRow>
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Button
              startIcon={<AddIcon />}
              onClick={() =>
                appendRentalRate({
                  rate_unit: RATE_UNIT_OPTIONS[0].value,
                  rate_cost: 0,
                  rate_note: RATE_UNIT_OPTIONS[0].note,
                })
              }
              variant="outlined"
              size="small"
              disabled={rentalRateFields.length >= MAX_RENTAL_RATES || disabled}
            >
              Add rate
            </Button>
          </Subsection>

          <Subsection title="Usage Charges">
            <Stack spacing={2} mb={2}>
              {usageRateFields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Usage Rate #{index + 1}
                      </Typography>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeUsageRate(index)}
                        disabled={disabled}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <FieldRow>
                      <FieldCell>
                        <SelectInput
                          name={`rental_vehicle.usage_rates.${index}.usage_type`}
                          label="Type"
                          options={USAGE_TYPE_OPTIONS}
                          onChange={(value) => {
                            const note = USAGE_TYPE_OPTIONS.find((o) => o.value === value)?.note;
                            if (note) {
                              setValue(`rental_vehicle.usage_rates.${index}.usage_note`, note);
                            }
                          }}
                        />
                      </FieldCell>
                      <FieldCell>
                        <NumberInput
                          name={`rental_vehicle.usage_rates.${index}.usage_cost`}
                          label="Cost Per Unit"
                          slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                        />
                      </FieldCell>
                    </FieldRow>

                    <FieldRow>
                      <FieldCell>
                        <TextInput
                          name={`rental_vehicle.usage_rates.${index}.usage_note`}
                          label="Unit Note"
                          slotProps={{ input: { readOnly: true } }}
                          disabled
                        />
                      </FieldCell>
                    </FieldRow>
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Button
              startIcon={<AddIcon />}
              onClick={() =>
                appendUsageRate({
                  usage_type: USAGE_TYPE_OPTIONS[0].value,
                  usage_cost: 0,
                  usage_note: USAGE_TYPE_OPTIONS[0].note,
                })
              }
              variant="outlined"
              size="small"
              disabled={usageRateFields.length >= MAX_USAGE_RATES || disabled}
            >
              Add Usage Charge
            </Button>
          </Subsection>
        </Stack>
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section
        title="Rentee details"
        description="Capture the renter's personal contact details, driver's license, optional employer details, and insurance."
      >
        <Stack spacing={2}>
          <TextInput
            name="rentee.full_name"
            label="Rentee name"
            slotProps={{
              input: {
                endAdornment: CustomerSelectAdornment,
              },
            }}
          />

          <TextInput name="rentee.address_street1" label="Street address" />
          <FieldRow>
            <FieldCell>
              <TextInput name="rentee.address_city" label="City" />
            </FieldCell>
            <FieldCell>
              <TextInput name="rentee.address_state" label="State" />
            </FieldCell>
            <FieldCell>
              <TextInput name="rentee.address_zip" label="Zip code" />
            </FieldCell>
          </FieldRow>

          <TextInput name="rentee.email" label="Email address" />
          <FieldRow>
            <FieldCell>
              <TextInput name="rentee.cell_phone" label="Cell phone" />
            </FieldCell>
            <FieldCell>
              <TextInput name="rentee.alternate_phone" label="Alternate phone" />
            </FieldCell>
          </FieldRow>

          <Subsection title="Driver's license">
            <Stack spacing={2}>
              <FieldRow>
                <FieldCell>
                  <TextInput name="rentee.driver_license_number" label="Driver's license number" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rentee.driver_license_state" label="Driver's license state" />
                </FieldCell>
                <FieldCell>
                  <DateInput
                    name="rentee.driver_license_expiration"
                    label="Driver's license expiration"
                  />
                </FieldCell>
              </FieldRow>

              <FieldRow>
                <FieldCell>
                  <DateInput name="rentee.date_of_birth" label="Date of birth" />
                </FieldCell>
                <CheckboxInput name="rentee.verified" label="Verified" />
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Employer information">
            <Stack spacing={2}>
              <FieldRow>
                <FieldCell>
                  <TextInput name="rentee.employer.company" label="Employer name" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rentee.employer.position" label="Position" />
                </FieldCell>
              </FieldRow>

              <TextInput name="rentee.employer.address_street1" label="Street address" />
              <FieldRow>
                <FieldCell>
                  <TextInput name="rentee.employer.address_city" label="City" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rentee.employer.address_state" label="State" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rentee.employer.address_zip" label="Zip code" />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Subsection>

          <Subsection title="Insurance information">
            <FieldRow>
              <FieldCell>
                <TextInput name="rentee.insurance.company" label="Insurance company" />
              </FieldCell>
              <FieldCell>
                <TextInput name="rentee.insurance.policy_number" label="Policy number" />
              </FieldCell>
            </FieldRow>
          </Subsection>
        </Stack>
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section
        title="Additional drivers"
        description="Add up to two additional drivers authorized to use the rental vehicle."
      >
        {additionalDriverFields.map((field, index) => (
          <Box
            key={field.id}
            sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
            mb={2}
          >
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Additional driver {index + 1}
                </Typography>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => removeAdditionalDriver(index)}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <TextInput name={`additional_drivers.${index}.full_name`} label="Full name" />

              <FieldRow>
                <FieldCell>
                  <DateInput
                    name={`additional_drivers.${index}.date_of_birth`}
                    label="Date of birth"
                  />
                </FieldCell>
                <FieldCell>
                  <TextInput
                    name={`additional_drivers.${index}.driver_license_number`}
                    label="Driver's license number"
                  />
                </FieldCell>
                <FieldCell>
                  <DateInput
                    name={`additional_drivers.${index}.driver_license_expiration`}
                    label="Driver's license expiration"
                  />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={() =>
            appendAdditionalDriver({
              full_name: "",
              date_of_birth: new Date(),
              driver_license_number: "",
              driver_license_expiration: new Date(),
            })
          }
          variant="outlined"
          size="small"
          disabled={additionalDriverFields.length >= MAX_ADDITIONAL_DRIVERS || disabled}
        >
          Add driver
        </Button>
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section
        title="Vehicle Damage Waiver"
        description="Optionally add vehicle damage waiver rates and the liability limit."
      >
        {hasVehicleDamageWaiver && (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }} mb={2}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Vehicle Damage Waiver
                </Typography>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() =>
                    setValue("vehicle_damage_waiver", undefined, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <FieldRow>
                <FieldCell>
                  <NumberInput
                    name="vehicle_damage_waiver.rate_per_day"
                    label="Rate per day"
                    slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                  />
                </FieldCell>
                <FieldCell>
                  <NumberInput
                    name="vehicle_damage_waiver.rate_per_week"
                    label="Rate per week"
                    slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                  />
                </FieldCell>
                <FieldCell>
                  <NumberInput
                    name="vehicle_damage_waiver.damage_liability_limit"
                    label="Damage liability limit"
                    slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                  />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Box>
        )}

        <Button
          startIcon={<AddIcon />}
          onClick={() =>
            setValue(
              "vehicle_damage_waiver",
              {
                rate_per_day: 0,
                rate_per_week: 0,
                damage_liability_limit: 0,
              },
              { shouldDirty: true, shouldTouch: true, shouldValidate: true }
            )
          }
          variant="outlined"
          size="small"
          disabled={hasVehicleDamageWaiver || disabled}
        >
          Add Vehicle Damage Waiver
        </Button>
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section
        title="Personal Accident Insurance"
        description="Optionally add personal accident insurance details."
      >
        {hasPersonalAccidentInsurance && (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }} mb={2}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Personal Accident Insurance
                </Typography>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() =>
                    setValue("personal_accident_insurance", undefined, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <FieldRow>
                <FieldCell>
                  <NumberInput
                    name="personal_accident_insurance.rate_per_day"
                    label="Rate per day"
                    slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                  />
                </FieldCell>
              </FieldRow>
            </Stack>
          </Box>
        )}

        <Button
          startIcon={<AddIcon />}
          onClick={() =>
            setValue(
              "personal_accident_insurance",
              {
                rate_per_day: 0,
              },
              { shouldDirty: true, shouldTouch: true, shouldValidate: true }
            )
          }
          variant="outlined"
          size="small"
          disabled={hasPersonalAccidentInsurance || disabled}
        >
          Add Personal Accident Insurance
        </Button>
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section
        title="Signatures"
        description="Optionally capture digital signatures for this agreement."
      >
        <SignatureInput name="clerk_signature" label="Authorized Rental Clerk Signature" />
      </Section>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={1}>
        <Tooltip title={tooltipText} placement="top" arrow>
          <span>
            <Button
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={isSubmitting || billingStatus !== "confirmed" || disabled}
              fullWidth
            >
              Generate Agreement
            </Button>
          </span>
        </Tooltip>
        <Button
          type="button"
          variant="outlined"
          fullWidth
          onClick={() => setIsChargeDialogOpen(true)}
          disabled={isSubmitting || disabled}
        >
          Edit Charges
        </Button>
        <Button
          type="button"
          variant="text"
          color="error"
          onClick={handleResetClick}
          disabled={!isDirty || disabled}
          fullWidth
        >
          Reset
        </Button>
      </Stack>

      <Dialog open={isResetDialogOpen} onClose={handleResetCancel}>
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will reset the form to the previously saved state. Are you sure you want to
            proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCancel}>Cancel</Button>
          <Button onClick={handleResetConfirm} color="error" autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {vehicleSelectionOpen && (
        <VehicleSelectionDialog onClose={() => setVehicleSelectionOpen(false)} />
      )}

      {customerSelectionOpen && (
        <CustomerSelectionDialog onClose={() => setCustomerSelectionOpen(false)} />
      )}

      {isChargeDialogOpen && (
        <ChargeConfirmationDialog
          onClose={() => setIsChargeDialogOpen(false)}
          onConfirm={() => setIsChargeDialogOpen(false)}
        />
      )}
    </Box>
  );
};
