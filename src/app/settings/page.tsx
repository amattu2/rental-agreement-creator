"use client";

import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { useDatabaseApi } from "@/database/provider";
import { createDataBackup } from "@/utils/dataTransfer";

const Page = () => {
  const databaseApi = useDatabaseApi();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const snapshot = await databaseApi.getExportSnapshot();
      const { blob, filename } = await createDataBackup(snapshot);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error("Failed to export data", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your application preferences and data.
        </Typography>
      </Box>

      <Stack spacing={3}>
        <Card component="section" variant="outlined" aria-labelledby="import-data-title">
          <CardContent>
            <Typography variant="h6" component="h2" id="import-data-title" sx={{ mb: 1 }}>
              Import data
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Restore saved data from a backup.
            </Typography>
            <Button variant="contained" disabled>
              Import data
            </Button>
          </CardContent>
        </Card>

        <Card component="section" variant="outlined" aria-labelledby="export-data-title">
          <CardContent>
            <Typography variant="h6" component="h2" id="export-data-title" sx={{ mb: 1 }}>
              Export data
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Download an unencrypted backup of your data. Store it securely to protect personal
              information.
            </Typography>
            <Button
              variant="contained"
              onClick={handleExport}
              loading={isExporting}
              loadingPosition="start"
            >
              Export data
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default Page;
