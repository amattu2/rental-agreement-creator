"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Box, Button, Divider, IconButton, Stack, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import { FormSchema } from "@/schemas/form";
import { CheckboxInput } from "../CheckboxInput";
import { DateInput } from "../DateInput";
import { FieldCell } from "../FieldCell";
import { FieldRow } from "../FieldRow";
import { NumberInput } from "../NumberInput";
import { Section } from "../Section";
import { SelectInput } from "../SelectInput";
import { Subsection } from "../Subsection";
import { TextInput } from "../TextInput";

const MAX_ADDITIONAL_DRIVERS = 2;

const DISTANCE_MEASUREMENT_OPTIONS = [
  { label: "Miles (MI)", value: "MI" },
  { label: "Kilometers (KM)", value: "KM" },
];

const PAYLOAD_MEASUREMENT_OPTIONS = [
  { label: "Pounds (LB)", value: "LB" },
  { label: "Kilograms (KG)", value: "KG" },
];

const FUEL_LEVEL_OPTIONS = ["E", "1/4", "1/2", "3/4", "F"];

export const RentalAgreementForm = () => {
  const { control, reset } = useFormContext<FormSchema>();

  const {
    fields: additionalDriverFields,
    append: appendAdditionalDriver,
    remove: removeAdditionalDriver,
  } = useFieldArray({
    control,
    name: "additional_drivers",
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Section
          title="Agreement number"
          description="Enter the reference number used to identify this rental agreement."
        >
          <TextInput name="agreement_number" label="Agreement number" />
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
              <Stack spacing={3}>
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
          <Stack spacing={2} mb={2}>
            {additionalDriverFields.map((field, index) => (
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
          </Stack>

          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              appendAdditionalDriver({
                full_name: "",
                date_of_birth: dayjs(null),
                driver_license_number: "",
                driver_license_expiration: dayjs(null),
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
          title="Rental vehicle"
          description="Enter the vehicle being rented, including its identifying details and appearance."
        >
          <Stack spacing={3}>
            <TextInput name="rental_vehicle.identifier" label="Vehicle identifier" />

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
        </Section>

        <Divider sx={{ my: 3 }} />

        <Section
          title="Agreement info"
          description="Set the rental terms, pickup and return details, and usage limits."
        >
          <Stack spacing={3}>
            <FieldRow>
              <FieldCell>
                <DateInput name="rental_agreement_info.date_out" label="Pickup date" />
              </FieldCell>
              <FieldCell>
                <DateInput name="rental_agreement_info.date_in" label="Return date" />
              </FieldCell>
            </FieldRow>

            <FieldRow>
              <FieldCell>
                <NumberInput name="rental_agreement_info.odometer_in" label="Odometer at pickup" />
              </FieldCell>
              <FieldCell>
                <NumberInput name="rental_agreement_info.odometer_out" label="Odometer at return" />
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

            <FieldRow>
              <FieldCell>
                <SelectInput
                  name="rental_agreement_info.fuel_level_in"
                  label="Fuel level at pickup"
                  options={FUEL_LEVEL_OPTIONS.map((level) => ({ label: level, value: level }))}
                />
              </FieldCell>
              <FieldCell>
                <SelectInput
                  name="rental_agreement_info.fuel_level_out"
                  label="Fuel level at return"
                  options={FUEL_LEVEL_OPTIONS.map((level) => ({ label: level, value: level }))}
                />
              </FieldCell>
            </FieldRow>
          </Stack>
        </Section>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={1}>
          <Button type="submit" variant="contained" fullWidth>
            Generate Agreement
          </Button>
          <Button type="button" variant="text" color="error" fullWidth onClick={() => reset()}>
            Reset
          </Button>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};
