"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  Box,
  Button,
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
import {
  MAX_ADDITIONAL_DRIVERS,
  FUEL_LEVEL_OPTIONS,
  DISTANCE_MEASUREMENT_OPTIONS,
  PAYLOAD_MEASUREMENT_OPTIONS,
  MAX_RENTAL_RATES,
  RATE_UNIT_OPTIONS,
} from "@/config/constants";
import { useBillingState } from "../BillingContext";

const StyledIconButton = styled(IconButton)({
  marginRight: "-5px",
});

export const RentalAgreementForm = () => {
  const {
    control,
    formState: { isDirty, isSubmitting },
    reset,
    setValue,
    watch,
  } = useFormContext<FormSchema>();
  const { status: billingStatus, description: billingDescription } = useBillingState();

  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
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

  const odometerOut = watch("rental_agreement_info.odometer_out");
  const maxDistance = watch("rental_agreement_info.max_distance");
  const odometerIn = watch("rental_agreement_info.odometer_in");

  const CalculateAdornment = useMemo<React.ReactElement>(() => {
    const newDistance = (odometerOut ?? 0) + (maxDistance ?? 0);

    return (
      <Tooltip title="Calculate odometer at return">
        <span>
          <StyledIconButton
            type="button"
            size="small"
            disabled={newDistance === 0 || newDistance === odometerIn}
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
  }, [odometerOut, maxDistance, odometerIn, setValue]);

  const VehicleSelectAdornment = useMemo<React.ReactElement>(() => {
    return (
      <Tooltip title="Select an existing vehicle">
        <StyledIconButton type="button" size="small" onClick={() => setVehicleSelectionOpen(true)}>
          <SearchIcon />
        </StyledIconButton>
      </Tooltip>
    );
  }, [setVehicleSelectionOpen]);

  const vehicleDamageWaiver = watch("vehicle_damage_waiver");
  const hasVehicleDamageWaiver = vehicleDamageWaiver !== undefined;
  const personalAccidentInsurance = watch("personal_accident_insurance");
  const hasPersonalAccidentInsurance = personalAccidentInsurance !== undefined;

  const handleResetClick = () => setIsResetDialogOpen(true);

  const handleResetCancel = () => {
    setIsResetDialogOpen(false);
  };

  const handleResetConfirm = () => {
    reset();
    setIsResetDialogOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  name="rental_vehicle.identifier"
                  label="Vehicle identifier (Stock #)"
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
                              setValue(
                                `rental_vehicle.rental_rates.${index}.rate_note`,
                                note ?? "",
                                { shouldDirty: true }
                              );
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
                    rate_unit: "days",
                    rate_cost: 0,
                  })
                }
                variant="outlined"
                size="small"
                disabled={rentalRateFields.length >= MAX_RENTAL_RATES}
              >
                Add rate
              </Button>
            </Subsection>
          </Stack>
        </Section>

        <Divider sx={{ my: 3 }} />

        <Section
          title="Rentee details"
          description="Capture the renter's personal contact details, driver's license, optional employer details, and insurance."
        >
          <Stack spacing={3}>
            <TextInput name="rentee.full_name" label="Rentee name" />

            <FieldRow>
              <FieldCell>
                <TextInput name="rentee.address_street1" label="Street address" />
              </FieldCell>
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

            <CheckboxInput name="rentee.verified" label="Rentee information verified" />

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
              <FieldCell>
                <TextInput name="rentee.cell_phone" label="Cell phone" />
              </FieldCell>
              <FieldCell>
                <TextInput name="rentee.alternate_phone" label="Alternate phone" />
              </FieldCell>
            </FieldRow>

            <TextInput name="rentee.email" label="Email address" />

            <Subsection title="Employer information">
              <Stack spacing={2}>
                <FieldRow>
                  <FieldCell>
                    <TextInput name="rentee_employer.company" label="Employer name" />
                  </FieldCell>
                  <FieldCell>
                    <TextInput name="rentee_employer.position" label="Position" />
                  </FieldCell>
                </FieldRow>

                <FieldRow>
                  <FieldCell>
                    <TextInput name="rentee_employer.address_street1" label="Street address" />
                  </FieldCell>
                  <FieldCell>
                    <TextInput name="rentee_employer.address_city" label="City" />
                  </FieldCell>
                  <FieldCell>
                    <TextInput name="rentee_employer.address_state" label="State" />
                  </FieldCell>
                  <FieldCell>
                    <TextInput name="rentee_employer.address_zip" label="Zip code" />
                  </FieldCell>
                </FieldRow>
              </Stack>
            </Subsection>

            <Subsection title="Insurance information">
              <FieldRow>
                <FieldCell>
                  <TextInput name="rentee_insurance.company" label="Insurance company" />
                </FieldCell>
                <FieldCell>
                  <TextInput name="rentee_insurance.policy_number" label="Policy number" />
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
            disabled={additionalDriverFields.length >= MAX_ADDITIONAL_DRIVERS}
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
            disabled={hasVehicleDamageWaiver}
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
            disabled={hasPersonalAccidentInsurance}
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
          <Button
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={isSubmitting || billingStatus !== "confirmed"}
            fullWidth
          >
            Generate Agreement
          </Button>
          <Button
            type="button"
            variant="outlined"
            fullWidth
            onClick={() => setIsChargeDialogOpen(true)}
            disabled={isSubmitting}
          >
            Edit Charges
          </Button>
          {billingStatus !== "confirmed" && (
            <Typography
              variant="caption"
              color={billingStatus === "stale" ? "warning.main" : "text.secondary"}
              textAlign="center"
            >
              {billingDescription}
            </Typography>
          )}
          <Button
            type="button"
            variant="text"
            color="error"
            onClick={handleResetClick}
            disabled={!isDirty}
            fullWidth
          >
            Reset
          </Button>
        </Stack>

        <Dialog open={isResetDialogOpen} onClose={handleResetCancel}>
          <DialogTitle>Discard Changes?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This action will reset the form to the previously saved state. Are you sure you want
              to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResetCancel}>Cancel</Button>
            <Button onClick={handleResetConfirm} color="error" autoFocus>
              Reset
            </Button>
          </DialogActions>
        </Dialog>

        <VehicleSelectionDialog
          open={vehicleSelectionOpen}
          onClose={() => setVehicleSelectionOpen(false)}
        />

        {isChargeDialogOpen && (
          <ChargeConfirmationDialog
            onClose={() => setIsChargeDialogOpen(false)}
            onConfirm={() => setIsChargeDialogOpen(false)}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};
