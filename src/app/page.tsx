"use client";

import { useDatabaseApi } from "@/database/provider";
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AgreementTable from "@/components/AgreementTable";
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
            placeholder="Search agreements"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 450 }}
          />
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AgreementStatus | "all")}
              label="Status"
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
            </Select>
          </FormControl>
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
