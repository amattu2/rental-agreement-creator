"use client";

import type { ReactNode } from "react";
import { Controller, Path, useFieldArray, useFormContext } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { FormSchema } from "@/schemas/form";

const MAX_ADDITIONAL_DRIVERS = 2;

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <Box mb={4}>
    <Typography variant="h6" mb={1}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>
      {description}
    </Typography>
    {children}
  </Box>
);

const Subsection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>
      {title}
    </Typography>
    {children}
  </Box>
);

const FieldRow = ({ children }: { children: ReactNode }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
    {children}
  </Stack>
);

const FieldCell = ({ children }: { children: ReactNode }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
);

const TextInput = ({
  name,
  label,
  placeholder,
}: {
  name: Path<FormSchema>;
  label: string;
  placeholder?: string;
}) => {
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
        />
      )}
    />
  );
};

const NumberInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => {
            const nextValue = event.target.value === "" ? undefined : Number(event.target.value);
            field.onChange(Number.isNaN(nextValue) ? undefined : nextValue);
          }}
          label={label}
          type="number"
          inputProps={{ min: 0, step: 1 }}
          fullWidth
          size="small"
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  );
};

const DateInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          value={(field.value ?? null) as Dayjs | null}
          onChange={(date) => field.onChange(date)}
          label={label}
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
  );
};

const SelectInput = ({
  name,
  label,
  options,
}: {
  name: Path<FormSchema>;
  label: string;
  options: Array<{ label: string; value: string }>;
}) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          label={label}
          fullWidth
          size="small"
          error={!!error}
          helperText={error?.message}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
};

const CheckboxInput = ({ name, label }: { name: Path<FormSchema>; label: string }) => {
  const { control } = useFormContext<FormSchema>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox checked={!!field.value} onChange={(_, checked) => field.onChange(checked)} />
          }
          label={label}
        />
      )}
    />
  );
};

export const RentalAgreementForm = () => {
  const { control } = useFormContext<FormSchema>();

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
          description="Capture the renter's personal contact details, driver's license, employer, and insurance."
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
            {additionalDriverFields.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No additional drivers added yet.
              </Typography>
            ) : null}

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
            <FieldRow>
              <FieldCell>
                <TextInput name="rental_vehicle.identifier" label="Vehicle identifier" />
              </FieldCell>
              <FieldCell>
                <TextInput name="rental_vehicle.VIN" label="VIN" />
              </FieldCell>
              <FieldCell>
                <TextInput name="rental_vehicle.license_plate" label="License plate" />
              </FieldCell>
            </FieldRow>

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
                <NumberInput name="rental_agreement_info.odometer_in" label="Odometer at pickup" />
              </FieldCell>
              <FieldCell>
                <DateInput name="rental_agreement_info.date_in" label="Pickup date" />
              </FieldCell>
            </FieldRow>

            <FieldRow>
              <FieldCell>
                <NumberInput name="rental_agreement_info.odometer_out" label="Odometer at return" />
              </FieldCell>
              <FieldCell>
                <DateInput name="rental_agreement_info.date_out" label="Return date" />
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
                  options={[
                    { label: "Miles", value: "MI" },
                    { label: "Kilometers", value: "KM" },
                  ]}
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
                  options={[
                    { label: "Pounds", value: "LB" },
                    { label: "Kilograms", value: "KG" },
                  ]}
                />
              </FieldCell>
            </FieldRow>
          </Stack>
        </Section>

        <Divider sx={{ my: 3 }} />

        <Button type="submit" variant="contained" fullWidth>
          Generate PDF
        </Button>
      </Box>
    </LocalizationProvider>
  );
};
