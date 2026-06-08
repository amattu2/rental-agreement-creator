"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useDatabaseApi } from "@/database/provider";
import type { FormSchema, VehicleSchema } from "@/schemas/form";

type VehicleSelectionDialogProps = {
  open: boolean;
  onClose: () => void;
};

const getVehicleDisplayName = (vehicle: VehicleSchema) => {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();
};

export const VehicleSelectionDialog = ({ open, onClose }: VehicleSelectionDialogProps) => {
  const databaseApi = useDatabaseApi();
  const { setValue } = useFormContext<FormSchema>();

  const [vehicles, setVehicles] = useState<VehicleRecord[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoading = vehicles === null && errorMessage === null;

  useEffect(() => {
    if (!open) {
      return;
    }

    databaseApi
      .getAllVehicles()
      .then((records) => {
        setVehicles(records.sort((a, b) => b.vehicle.year - a.vehicle.year));
        setErrorMessage(null);
      })
      .catch((error) => {
        console.error("Failed to load vehicles", error);
        setErrorMessage("Unable to load vehicle list.");
        setVehicles([]);
      });
  }, [databaseApi, open]);

  const handleSelectVehicle = (vehicle: VehicleSchema) => {
    setValue(
      "rental_vehicle",
      {
        ...vehicle,
        rental_rates: vehicle.rental_rates ?? [],
      },
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    );

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Vehicle</DialogTitle>
      <DialogContent>
        {isLoading && (
          <Stack alignItems="center" py={3}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {!isLoading && errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {!isLoading && !errorMessage && vehicles?.length === 0 && (
          <DialogContentText>No saved vehicles found.</DialogContentText>
        )}

        {!isLoading && !errorMessage && (vehicles?.length ?? 0) > 0 && (
          <Table size="small" aria-label="Saved vehicles">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Identifier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>VIN</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>License plate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles?.map(({ uuid, vehicle }) => (
                <TableRow key={uuid}>
                  <TableCell>{vehicle.identifier}</TableCell>
                  <TableCell>{getVehicleDisplayName(vehicle)}</TableCell>
                  <TableCell>{vehicle.VIN}</TableCell>
                  <TableCell>{vehicle.license_plate}</TableCell>
                  <TableCell>{vehicle.color}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleSelectVehicle(vehicle)}>
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
