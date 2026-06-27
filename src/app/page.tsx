"use client";

import { useDatabaseApi } from "@/database/provider";
import { Box, Button, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import AgreementTable from "@/components/AgreementTable";
import { FinalizationSchema } from "@/schemas/finalization";

const AgreementListPage = () => {
  const router = useRouter();
  const databaseApi = useDatabaseApi();
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | "all">("active");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const filteredAgreements = useMemo<AgreementRecord[]>(
    () =>
      agreements.filter((agreement) => {
        if (statusFilter === "active") {
          return agreement.status === "active";
        }
        if (statusFilter === "archived") {
          return agreement.status === "archived";
        }
        return true;
      }),
    [agreements, statusFilter]
  );

  const handleFilterChange = (filter: AgreementStatus | "all") => {
    setStatusFilter(filter);
  };

  const handleCreateNew = () => {
    router.push("/agreement");
  };

  const handleArchive = useCallback(
    async (uuid: string, details: FinalizationSchema): Promise<AgreementRecord> => {
      const record = await databaseApi.finalizeAgreement(uuid, details);
      const data = await databaseApi.getAllAgreements();

      setAgreements(data);
      return record;
    },
    [databaseApi]
  );

  useEffect(() => {
    const loadAgreements = async () => {
      try {
        const data = await databaseApi.getAllAgreements();
        setAgreements(data);
      } catch (error) {
        console.error("Failed to load agreements", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgreements();
  }, [databaseApi]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Rental Agreements
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View and manage rental agreements. Click on an agreement to view details or create a new
          one to get started.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateNew}>
          Create Agreement
        </Button>
      </Box>

      <Box>
        <FormControl sx={{ minWidth: 250, mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value as AgreementStatus | "all")}
            label="Status"
            size="small"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>
        <AgreementTable
          agreements={filteredAgreements}
          loading={isLoading}
          onArchive={handleArchive}
        />
      </Box>
    </Box>
  );
};

export default AgreementListPage;
