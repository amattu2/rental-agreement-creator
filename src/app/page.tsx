"use client";

import { Box, Button, Typography, MenuItem, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import AgreementTable from "@/components/AgreementTable";
import { useDatabaseApi } from "@/database/provider";
import { FinalizationSchema } from "@/schemas/finalization";

const AgreementListPage = () => {
  const router = useRouter();
  const databaseApi = useDatabaseApi();
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | "all">("active");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleCreateNew = () => {
    router.push("/agreement");
  };

  const handleSearch = useCallback(
    async (query: string, status: AgreementStatus | "all") => {
      setIsLoading(true);
      try {
        const data = await databaseApi.searchAgreements(query, status);
        setAgreements(data);
      } catch (error) {
        console.error("Failed to load agreements", error);
        setAgreements([]);
      } finally {
        setIsLoading(false);
      }
    },
    [databaseApi]
  );

  const handleArchive = useCallback(
    async (uuid: string, details: FinalizationSchema): Promise<AgreementRecord> => {
      const record = await databaseApi.finalizeAgreement(uuid, details);
      await handleSearch(searchQuery, statusFilter);
      return record;
    },
    [databaseApi, handleSearch, searchQuery, statusFilter]
  );

  const handleCancel = useCallback(
    async (uuid: string): Promise<AgreementRecord> => {
      const record = await databaseApi.cancelAgreement(uuid);
      await handleSearch(searchQuery, statusFilter);
      return record;
    },
    [databaseApi, handleSearch, searchQuery, statusFilter]
  );

  useEffect(() => {
    handleSearch(searchQuery, statusFilter);
  }, [handleSearch, searchQuery, statusFilter]);

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
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="Search agreements"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 450 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as AgreementStatus | "all")}
            sx={{ minWidth: 250 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
            <MenuItem value="canceled">Canceled</MenuItem>
          </TextField>
        </Box>
        <AgreementTable
          agreements={agreements}
          loading={isLoading}
          onArchive={handleArchive}
          onCancel={handleCancel}
        />
      </Box>
    </Box>
  );
};

export default AgreementListPage;
