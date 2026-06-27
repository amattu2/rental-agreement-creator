import { formatDate } from "@/utils/text";
import { ENV_SCHEMA } from "@/schemas/env";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { memo, useCallback, useState, MouseEvent } from "react";
import Link from "next/link";
import { FinalizationSchema } from "@/schemas/finalization";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FinalizationDialog } from "../FinalizationDialog";

export type AgreementTableProps = {
  agreements: AgreementRecord[];
  loading: boolean;
  onArchive: (uuid: string, details: FinalizationSchema) => Promise<void>;
};

const AgreementTable = ({ agreements, loading, onArchive }: AgreementTableProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeAgreement, setActiveAgreement] = useState<AgreementRecord | null>(null);
  const [finalizingAgreement, setFinalizingAgreement] = useState<boolean>(false);

  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>, agreement: AgreementRecord) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveAgreement(agreement);
  };

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveAgreement(null);
  }, []);

  const handleViewAgreement = useCallback(async () => {
    if (!activeAgreement) {
      return;
    }

    const envData = ENV_SCHEMA.parse({
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
      NEXT_PUBLIC_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
    });

    const { generatePDF } = await import("@/utils/pdf");

    const pdfUrl = URL.createObjectURL(await generatePDF(envData, activeAgreement));
    window.open(pdfUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10_000);

    handleCloseMenu();
  }, [activeAgreement, handleCloseMenu]);

  const handleViewReceipt = useCallback(async () => {
    if (!activeAgreement) {
      return;
    }

    const envData = ENV_SCHEMA.parse({
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
      NEXT_PUBLIC_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
    });

    const { generateReceiptPDF } = await import("@/utils/receiptPdf");

    const pdfUrl = URL.createObjectURL(await generateReceiptPDF(envData, activeAgreement));
    window.open(pdfUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10_000);

    handleCloseMenu();
  }, [activeAgreement, handleCloseMenu]);

  const handleArchive = () => setFinalizingAgreement(true);

  const handleFinalizationConfirm = useCallback(
    async (details: FinalizationSchema) => {
      if (!activeAgreement?.uuid) {
        return;
      }

      setFinalizingAgreement(false);
      await onArchive(activeAgreement.uuid, details);
      handleViewReceipt();
      handleCloseMenu();
    },
    [activeAgreement, onArchive, handleCloseMenu, handleViewReceipt]
  );

  if (loading) {
    return "Loading..."; // TODO: Table skeleton
  }

  if (agreements.length === 0) {
    return "No agreements found."; // TODO: Empty state component
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Agreement No.</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rentee</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Pickup Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Return Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
            <TableCell sx={{ width: 72 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {agreements.map((record: AgreementRecord) => {
            const { uuid, agreement, status, updatedAt, createdAt } = record;
            const { agreement_number, rentee, rental_agreement_info, rental_vehicle } = agreement;
            const { year, make, model } = rental_vehicle;
            const isArchived = status === "archived";

            return (
              <TableRow
                key={uuid}
                sx={{
                  opacity: isArchived ? 0.6 : 1,
                  backgroundColor: isArchived ? "action.hover" : "transparent",
                }}
              >
                <TableCell>
                  <Tooltip title={`Edit agreement ${agreement_number}`}>
                    <Link href={`/agreement?uuid=${uuid}`}>{agreement_number}</Link>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    label={status === "archived" ? "Archived" : "Active"}
                    color={status === "archived" ? "default" : "success"}
                    variant={status === "archived" ? "outlined" : "filled"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{rentee.full_name}</TableCell>
                <TableCell>{`${year} ${make} ${model}`.trim()}</TableCell>
                <TableCell>
                  {formatDate(rental_agreement_info.date_out, "MM/DD/YYYY h:mma")}
                </TableCell>
                <TableCell>
                  {formatDate(rental_agreement_info.date_in, "MM/DD/YYYY h:mma")}
                </TableCell>
                <TableCell>{formatDate(updatedAt, "MM/DD/YYYY h:mma")}</TableCell>
                <TableCell>{formatDate(createdAt, "MM/DD/YYYY h:mma")}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    aria-label={`Actions for agreement ${agreement_number}`}
                    onClick={(event) => handleOpenMenu(event, record)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleViewAgreement}>View Agreement</MenuItem>
        {activeAgreement?.status === "archived" && (
          <MenuItem onClick={handleViewReceipt}>View Receipt</MenuItem>
        )}
        {activeAgreement?.status === "active" && (
          <MenuItem onClick={handleArchive}>Finalize</MenuItem>
        )}
      </Menu>

      {finalizingAgreement && activeAgreement && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FinalizationDialog
            agreement={activeAgreement.agreement}
            onClose={() => setFinalizingAgreement(false)}
            onConfirm={handleFinalizationConfirm}
          />
        </LocalizationProvider>
      )}
    </TableContainer>
  );
};

export default memo<AgreementTableProps>(AgreementTable);
