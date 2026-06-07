"use client";

import { createIndexedDbDatabaseApi } from "@/database";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AgreementListPage = () => {
  const router = useRouter();
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgreements = async () => {
      try {
        const databaseApi = createIndexedDbDatabaseApi();
        const data = await databaseApi.getAllAgreements();
        setAgreements(data);
      } catch (error) {
        console.error("Failed to load agreements", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgreements();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDatetime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateNew = () => {
    router.push("/agreement");
  };

  const handleRowClick = (uuid: string) => {
    router.push(`/agreement?uuid=${uuid}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading agreements...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Rental Agreements
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage and view all rental agreements. Click on any row to view or edit an agreement.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateNew}>
          Create New Agreement
        </Button>
      </Box>

      {agreements.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            No agreements found. Create your first agreement to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Agreement No.</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rentee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pickup Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Return Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agreements.map((record) => {
                const agreement = record.agreement;
                const vehicle = agreement.rental_vehicle;
                const vehicleDisplay = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();
                const pickupDate = agreement.rental_agreement_info.date_out;
                const returnDate = agreement.rental_agreement_info.date_in;

                return (
                  <TableRow
                    key={record.uuid}
                    onClick={() => handleRowClick(record.uuid)}
                    sx={{
                      cursor: "pointer",
                    }}
                  >
                    <TableCell>{agreement.agreement_number || "—"}</TableCell>
                    <TableCell>{agreement.rentee.full_name || "—"}</TableCell>
                    <TableCell>{vehicleDisplay || "—"}</TableCell>
                    <TableCell>
                      {pickupDate?.isValid?.() ? formatDate(pickupDate.toISOString()) : "—"}
                    </TableCell>
                    <TableCell>
                      {returnDate?.isValid?.() ? formatDate(returnDate.toISOString()) : "—"}
                    </TableCell>
                    <TableCell>{formatDatetime(record.updatedAt)}</TableCell>
                    <TableCell>{formatDatetime(record.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AgreementListPage;
