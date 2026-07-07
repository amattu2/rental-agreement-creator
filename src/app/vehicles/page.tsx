"use client";

import EditIcon from "@mui/icons-material/Edit";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  NoSsr,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_VEHICLE } from "@/config/constants";
import { VehicleEditorDialog } from "@/components/VehicleEditorDialog";
import { useDatabaseApi } from "@/database/provider";
import type { VehicleSchema } from "@/schemas/form";
import { formatDate } from "@/utils/text";

const VEHICLES_TABLE_BASE_COLUMNS: GridColDef<VehicleRecord>[] = [
  {
    field: "stock_number",
    headerName: "Stock #",
    flex: 1,
    minWidth: 120,
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
    minWidth: 140,
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
    flex: 1,
    minWidth: 100,
    sortable: false,
    valueGetter: (_, row: VehicleRecord) => row.vehicle.color,
  },
  {
    field: "status",
    headerName: "Status",
    minWidth: 110,
    sortable: true,
    renderCell: ({ row }) => (
      <Chip
        label={row.status === "active" ? "Active" : "Inactive"}
        color={row.status === "active" ? "success" : "default"}
        size="small"
        variant={row.status === "active" ? "filled" : "outlined"}
      />
    ),
  },
  {
    field: "updated",
    headerName: "Updated",
    sortable: true,
    valueGetter: (_, row: VehicleRecord) => row.updatedAt,
    renderCell: ({ row }) => formatDate(row.updatedAt),
  },
  {
    field: "created",
    headerName: "Created",
    sortable: true,
    valueGetter: (_, row: VehicleRecord) => row.createdAt,
    renderCell: ({ row }) => formatDate(row.createdAt),
  },
];

const VehiclesPage = () => {
  const databaseApi = useDatabaseApi();

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<BaseStatus>("active");
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [activeVehicle, setActiveVehicle] = useState<VehicleRecord | null>(null);

  const handleSearch = useCallback(
    async (nextQuery: string) => {
      setIsLoading(true);
      try {
        const records = await databaseApi.searchVehicles(nextQuery);
        setVehicles(records.filter((record) => record.status === statusFilter));
        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to load vehicles", error);
        setErrorMessage("Unable to load vehicle list.");
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [databaseApi, statusFilter]
  );

  const openCreateDialog = useCallback(() => {
    setActiveVehicle(null);
    setEditorOpen(true);
  }, []);

  const openEditDialog = useCallback((record: VehicleRecord) => {
    setActiveVehicle(record);
    setEditorOpen(true);
  }, []);

  const closeEditorDialog = useCallback(() => {
    setEditorOpen(false);
    setActiveVehicle(null);
  }, []);

  const handleSaveVehicle = async (vehicle: VehicleSchema) => {
    try {
      await databaseApi.upsertVehicle(activeVehicle?.uuid, vehicle);
      await handleSearch(query);
      closeEditorDialog();
    } catch (error) {
      console.error("Failed to save vehicle", error);
      setErrorMessage("Unable to save vehicle profile.");
    }
  };

  const handleToggleVehicleStatus = useCallback(
    async (record: VehicleRecord) => {
      try {
        await databaseApi.setVehicleStatus(
          record.uuid,
          record.status === "active" ? "inactive" : "active"
        );
        await handleSearch(query);
      } catch (error) {
        console.error("Failed to update vehicle status", error);
        setErrorMessage("Unable to update vehicle status.");
      }
    },
    [databaseApi, query, handleSearch]
  );

  const columns = useMemo<GridColDef<VehicleRecord>[]>(
    () => [
      ...VEHICLES_TABLE_BASE_COLUMNS,
      {
        field: "actions",
        type: "actions",
        hideable: false,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit-vehicle"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => openEditDialog(row)}
          />,
          <GridActionsCellItem
            key="toggle-vehicle-status"
            icon={row.status === "active" ? <VisibilityOffIcon /> : <VisibilityIcon />}
            label={row.status === "active" ? "Deactivate" : "Activate"}
            onClick={() => handleToggleVehicleStatus(row)}
          />,
        ],
      },
    ],
    [handleToggleVehicleStatus, openEditDialog]
  );

  useEffect(() => {
    handleSearch(query);
  }, [handleSearch, query, statusFilter]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Vehicles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, manage, and edit rental vehicles.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search vehicles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fullWidth
        />

        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as BaseStatus)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>

        <Button variant="contained" onClick={openCreateDialog}>
          Create
        </Button>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <NoSsr>
        <DataGrid
          rows={vehicles}
          columns={columns}
          getRowId={(row) => row.uuid}
          loading={isLoading}
          localeText={{ noRowsLabel: "No vehicles found." }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          sx={{ border: "none" }}
          disableRowSelectionOnClick
          disableColumnFilter
        />
      </NoSsr>

      {editorOpen && (
        <VehicleEditorDialog
          initialValue={activeVehicle ? activeVehicle.vehicle : DEFAULT_VEHICLE}
          onClose={closeEditorDialog}
          onSave={handleSaveVehicle}
        />
      )}
    </Box>
  );
};

export default VehiclesPage;
