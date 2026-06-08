"use client";

import { useDatabaseApi } from "@/database/provider";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgreementTable from "@/components/AgreementTable";

const AgreementListPage = () => {
  const router = useRouter();
  const databaseApi = useDatabaseApi();
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        <AgreementTable agreements={agreements} onRowClick={handleRowClick} />
      )}
    </Box>
  );
};

export default AgreementListPage;
