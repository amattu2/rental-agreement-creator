"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
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
import { useEffect, useState, useMemo, useCallback } from "react";
import { useFormContext } from "react-hook-form";

import { useDatabaseApi } from "@/database/provider";
import type { FormSchema } from "@/schemas/form";
import { formatAddress } from "@/utils/text";

const CUSTOMER_SELECTION_BASE_COLUMNS: GridColDef<CustomerRecord>[] = [
  {
    field: "full_name",
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
    field: "email",
    headerName: "Email address",
    flex: 1,
    sortable: false,
    valueGetter: (_, row: CustomerRecord) => row.customer.email,
  },
  {
    field: "license",
    headerName: "Driver's license",
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
];

type CustomerSelectionDialogProps = {
  onClose: () => void;
};

export const CustomerSelectionDialog = ({ onClose }: CustomerSelectionDialogProps) => {
  const databaseApi = useDatabaseApi();
  const { setValue } = useFormContext<FormSchema>();

  const [customers, setCustomers] = useState<CustomerRecord[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const isLoading = customers === null && errorMessage === null;

  const handleSelectCustomer = useCallback(
    (record: CustomerRecord) => {
      setValue("customer_uuid", record.uuid, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("rentee", record.customer, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("rentee.employer", record.customer.employer, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("rentee.insurance", record.customer.insurance, {
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
      .searchCustomers(query)
      .then((records) => {
        setCustomers(records);
        setErrorMessage(null);
      })
      .catch((error) => {
        console.error("Failed to load customers", error);
        setErrorMessage("Unable to load customer list.");
        setCustomers([]);
      });
  }, [query, databaseApi]);

  const columns = useMemo<GridColDef<CustomerRecord>[]>(
    () => [
      ...CUSTOMER_SELECTION_BASE_COLUMNS,
      {
        field: "actions",
        type: "actions",
        hideable: false,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="select-customer"
            icon={<CheckCircleOutlineIcon />}
            label="Select"
            onClick={() => handleSelectCustomer(row)}
          />,
        ],
      },
    ],
    [handleSelectCustomer]
  );

  return (
    <Dialog onClose={onClose} maxWidth="md" open fullWidth>
      <DialogTitle>Select Customer</DialogTitle>
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
            rows={customers ?? []}
            loading={isLoading}
            localeText={{ noRowsLabel: "No matching customers found." }}
            columns={columns}
            getRowId={(row) => row.uuid}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
              sorting: {
                sortModel: [{ field: "full_name", sort: "asc" }],
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
