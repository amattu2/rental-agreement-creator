"use client";

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  Typography,
  IconButton,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs, { Dayjs } from "dayjs";
import { FormSchema } from "@/schemas/form";

const WORK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const TimesheetForm = () => {
  const { control, watch } = useFormContext<FormSchema>();

  const monthYearDate = useWatch({
    name: "monthYear",
    compute: (data: Dayjs) => (data && data?.isValid() ? data : null),
  });

  const {
    fields: eventFields,
    append: appendEvent,
    remove: removeEvent,
  } = useFieldArray({
    control,
    name: "events",
  });

  const addEvent = () => {
    // Add event on the first day of the month if no events exist
    const lastEvent = eventFields[eventFields.length - 1];
    if (!lastEvent || lastEvent.date.add(1, "day").month() !== dayjs(watch("monthYear")).month()) {
      appendEvent({ date: dayjs(watch("monthYear")).startOf("month"), description: "" });
      return;
    }

    // Add event the day after the last event
    appendEvent({ date: lastEvent.date.add(1, "day"), description: "" });
  };

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({
    control,
    name: "employees",
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Month/Year Section */}
        <Box mb={4}>
          <Typography variant="h6" mb={1}>
            Timesheet Period
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select the month and year for this timesheet
          </Typography>
          <Controller
            name="monthYear"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DatePicker
                {...field}
                value={field.value ? field.value.toDate() : null}
                onChange={(date) => field.onChange(date ? dayjs(date) : null)}
                views={["year", "month"]}
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
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Employees Section */}
        <Box mb={4}>
          <Typography variant="h6" mb={1}>
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Provide the full names of employees to generate individual timesheets for.
          </Typography>
          <Stack spacing={2} mb={2}>
            {employeeFields.map((field, index) => (
              <Box key={field.id} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Controller
                  name={`employees.${index}.fullName`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      placeholder="Full Name"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                {employeeFields.length > 1 && (
                  <IconButton color="error" size="small" onClick={() => removeEmployee(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Stack>
          <Button
            startIcon={<AddIcon />}
            onClick={() => appendEmployee({ fullName: "" })}
            variant="outlined"
            size="small"
          >
            Add Employee
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Events Section */}
        <Box mb={4}>
          <Typography variant="h6" mb={1}>
            Events
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add custom events to this timesheet (e.g., holidays, closures, etc).
          </Typography>
          <Stack spacing={2} mb={2}>
            {eventFields.map((field, index) => (
              <Box key={field.id} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Controller
                  name={`events.${index}.date`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      {...field}
                      value={field.value ? field.value.toDate() : null}
                      onChange={(date) => field.onChange(date ? dayjs(date) : null)}
                      minDate={monthYearDate ? monthYearDate.startOf("month").toDate() : undefined}
                      maxDate={monthYearDate ? monthYearDate.endOf("month").toDate() : undefined}
                      slotProps={{
                        textField: { size: "small", error: !!error, helperText: error?.message },
                      }}
                    />
                  )}
                />
                <Controller
                  name={`events.${index}.description`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      placeholder="Description (optional)"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <IconButton color="error" size="small" onClick={() => removeEvent(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
          <Button startIcon={<AddIcon />} onClick={addEvent} variant="outlined" size="small">
            Add Event
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Submit Button */}
        <Button type="submit" variant="contained" fullWidth>
          Create Timesheet{employeeFields.length > 1 ? "s" : ""}
        </Button>
      </Box>
    </LocalizationProvider>
  );
};
