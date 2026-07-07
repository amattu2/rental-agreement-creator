"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Alert, Box, Button, Stack, TextField, Typography, NoSsr } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import { useDatabaseApi } from "@/database/provider";
import { DEFAULT_CUSTOMER } from "@/config/constants";
import { CustomerEditorDialog } from "@/components/CustomerEditorDialog";
import { RenteeSchema } from "@/schemas/form";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { formatAddress, formatDate } from "@/utils/text";

const CUSTOMERS_TABLE_BASE_COLUMNS: GridColDef<CustomerRecord>[] = [
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    minWidth: 90,
    sortable: true,
    hideable: false,
    valueGetter: (_, row: CustomerRecord) => row.customer.full_name,
  },
  {
    field: "cell_phone",
    headerName: "Cell phone",
    flex: 1,
    sortable: false,
    valueGetter: (_, row: CustomerRecord) => row.customer.cell_phone,
  },
  {
    field: "alternate_phone",
    headerName: "Alternate phone",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: CustomerRecord) => row.customer.alternate_phone,
  },
  {
    field: "email",
    headerName: "Email address",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: CustomerRecord) => row.customer.email,
  },
  {
    field: "license",
    headerName: "Driver's license",
    flex: 1,
    minWidth: 140,
    sortable: false,
    valueGetter: (_, row: CustomerRecord) =>
      `${row.customer.driver_license_number} (${row.customer.driver_license_state})`,
  },
  {
    field: "address",
    headerName: "Address",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: CustomerRecord) => formatAddress(row.customer),
  },
  {
    field: "updated",
    headerName: "Updated",
    sortable: true,
    valueGetter: (_, row: CustomerRecord) => row.updatedAt,
    renderCell: ({ row }) => formatDate(row.updatedAt),
  },
  {
    field: "created",
    headerName: "Created",
    sortable: true,
    valueGetter: (_, row: CustomerRecord) => row.createdAt,
    renderCell: ({ row }) => formatDate(row.createdAt),
  },
];

const CustomersPage = () => {
  const databaseApi = useDatabaseApi();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const records = await databaseApi.searchCustomers(query);
        setCustomers(
          records.sort((a, b) => a.customer?.full_name?.localeCompare(b?.customer?.full_name))
        );
        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to load customers", error);
        setErrorMessage("Unable to load customer list.");
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [databaseApi]
  );

  const openCreateDialog = useCallback(() => {
    setActiveCustomer(null);
    setEditorOpen(true);
  }, []);

  const openEditDialog = useCallback((record: CustomerRecord) => {
    setActiveCustomer(record);
    setEditorOpen(true);
  }, []);

  const closeEditorDialog = useCallback(() => {
    setEditorOpen(false);
    setActiveCustomer(null);
  }, []);

  const handleSaveCustomer = async (customer: RenteeSchema) => {
    try {
      await databaseApi.upsertCustomer(activeCustomer?.uuid, customer);
      await handleSearch(query);
      closeEditorDialog();
    } catch (error) {
      console.error("Failed to save customer", error);
      setErrorMessage("Unable to save customer profile.");
    }
  };

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  const columns = useMemo<GridColDef<CustomerRecord>[]>(
    () => [
      ...CUSTOMERS_TABLE_BASE_COLUMNS,
      {
        field: "actions",
        type: "actions",
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit-customer"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => openEditDialog(row)}
          />,
        ],
      },
    ],
    [openEditDialog]
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Customers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, manage, and edit customer profiles.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search customers"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fullWidth
        />

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
          rows={customers}
          columns={columns}
          getRowId={(row) => row.uuid}
          loading={isLoading}
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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CustomerEditorDialog
            initialValue={activeCustomer ? activeCustomer.customer : DEFAULT_CUSTOMER}
            onClose={closeEditorDialog}
            onSave={handleSaveCustomer}
          />
        </LocalizationProvider>
      )}
    </Box>
  );
};

export default CustomersPage;
