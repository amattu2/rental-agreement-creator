"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  NoSsr,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useDatabaseApi } from "@/database/provider";
import type { FormSchema } from "@/schemas/form";

const VEHICLE_SELECTION_BASE_COLUMNS: GridColDef<VehicleRecord>[] = [
  {
    field: "stock_number",
    headerName: "Stock #",
    flex: 1,
    minWidth: 100,
    sortable: true,
    hideable: false,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.stock_number,
  },
  {
    field: "year",
    headerName: "Year",
    minWidth: 90,
    sortable: true,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.year,
  },
  {
    field: "make",
    headerName: "Make",
    flex: 1,
    minWidth: 120,
    sortable: true,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.make,
  },
  {
    field: "model",
    headerName: "Model",
    flex: 1,
    minWidth: 120,
    sortable: true,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.model,
  },
  {
    field: "VIN",
    headerName: "VIN",
    flex: 1,
    minWidth: 120,
    sortable: false,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.VIN,
  },
  {
    field: "license_plate",
    headerName: "License plate",
    flex: 1,
    minWidth: 120,
    sortable: false,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.license_plate,
  },
  {
    field: "color",
    headerName: "Color",
    sortable: false,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.color,
  },
];

type VehicleSelectionDialogProps = {
  onClose: () => void;
};

export const VehicleSelectionDialog = ({ onClose }: VehicleSelectionDialogProps) => {
  const databaseApi = useDatabaseApi();
  const { setValue } = useFormContext<FormSchema>();

  const [vehicles, setVehicles] = useState<VehicleRecord[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const isLoading = vehicles === null && errorMessage === null;

  const handleSelectVehicle = useCallback(
    (record: VehicleRecord) => {
      const { vehicle, uuid } = record;

      setValue("vehicle_uuid", uuid, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue(
        "rental_vehicle",
        {
          ...vehicle,
          rental_rates: vehicle.rental_rates ?? [],
          usage_rates: vehicle.usage_rates ?? [],
        },
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
      setValue("rental_vehicle.rental_rates", vehicle.rental_rates ?? [], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("rental_vehicle.usage_rates", vehicle.usage_rates ?? [], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      onClose();
    },
    [onClose, setValue]
  );

  useEffect(() => {
    databaseApi
      .searchVehicles(query)
      .then((records) => {
        setVehicles(records.filter(({ status }) => status === "active"));
        setErrorMessage(null);
      })
      .catch((error) => {
        console.error("Failed to load vehicles", error);
        setErrorMessage("Unable to load vehicle list.");
        setVehicles([]);
      });
  }, [databaseApi, query]);

  const columns = useMemo<GridColDef<VehicleRecord>[]>(
    () => [
      ...VEHICLE_SELECTION_BASE_COLUMNS,
      {
        field: "actions",
        type: "actions",
        hideable: false,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="select-vehicle"
            icon={<CheckCircleOutlineIcon />}
            label="Select"
            onClick={() => handleSelectVehicle(row)}
          />,
        ],
      },
    ],
    [handleSelectVehicle]
  );

  return (
    <Dialog onClose={onClose} maxWidth="md" open fullWidth>
      <DialogTitle>Select Vehicle</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2, mb: 2 }}>
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            label="Search"
            size="small"
            fullWidth
          />
        </Stack>

        {!isLoading && errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <NoSsr>
          <DataGrid
            rows={vehicles ?? []}
            loading={isLoading}
            localeText={{ noRowsLabel: "No saved vehicles found." }}
            columns={columns}
            getRowId={(row) => row.uuid}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
              sorting: {
                sortModel: [{ field: "year", sort: "desc" }],
              },
            }}
            disableRowSelectionOnClick
            disableColumnFilter
            sx={{ border: "none" }}
          />
        </NoSsr>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
