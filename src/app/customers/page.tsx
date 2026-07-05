"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useDatabaseApi } from "@/database/provider";
import { DEFAULT_CUSTOMER } from "@/config/constants";
import { CustomerEditorDialog } from "@/components/CustomerEditorDialog";
import { RenteeSchema } from "@/schemas/form";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { formatAddress, formatContactInfo, formatDate } from "@/utils/text";

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

  const openCreateDialog = () => {
    setActiveCustomer(null);
    setEditorOpen(true);
  };

  const openEditDialog = (record: CustomerRecord) => {
    setActiveCustomer(record);
    setEditorOpen(true);
  };

  const closeEditorDialog = () => {
    setEditorOpen(false);
    setActiveCustomer(null);
  };

  const handleSaveCustomer = async (customer: RenteeSchema) => {
    try {
      await databaseApi.upsertCustomer({ ...customer, uuid: activeCustomer?.uuid });
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

      {isLoading ? (
        <Typography color="text.secondary">Loading customers...</Typography>
      ) : customers.length === 0 ? (
        <Typography color="text.secondary">No customers found.</Typography>
      ) : (
        <Table size="small" aria-label="Customers table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver&apos;s license</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((record) => (
              <TableRow key={record.uuid}>
                <TableCell>{record.customer.full_name}</TableCell>
                <TableCell>
                  {formatContactInfo(record.customer).map((info) => (
                    <div key={info}>{info}</div>
                  ))}
                </TableCell>
                <TableCell>
                  {`${record.customer.driver_license_number} (${record.customer.driver_license_state})`}
                </TableCell>
                <TableCell>{formatAddress(record.customer)}</TableCell>
                <TableCell>{formatDate(record.updatedAt)}</TableCell>
                <TableCell>{formatDate(record.createdAt)}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openEditDialog(record)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
