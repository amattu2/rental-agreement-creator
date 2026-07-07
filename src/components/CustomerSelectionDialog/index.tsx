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
  TextField,
} from "@mui/material";
import { useDatabaseApi } from "@/database/provider";
import type { FormSchema } from "@/schemas/form";
import { formatAddress, formatContactInfo } from "@/utils/text";

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

  const handleSelectCustomer = (record: CustomerRecord) => {
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
  };

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

        {!isLoading && !errorMessage && !customers?.length && (
          <DialogContentText>No matching customers found.</DialogContentText>
        )}

        {!isLoading && !errorMessage && !!customers?.length && (
          <Table size="small" aria-label="Existing customers">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
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
                  <TableCell>{formatAddress(record.customer)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleSelectCustomer(record)}>
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
