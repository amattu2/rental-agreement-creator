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
  Skeleton,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { memo, useCallback, useState, MouseEvent } from "react";
import Link from "next/link";
import { FinalizationSchema } from "@/schemas/finalization";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FinalizationDialog } from "../FinalizationDialog";

const TABLE_COLUMNS = [
  { id: "agreement_number", label: "Agreement No." },
  { id: "status", label: "Status" },
  { id: "rentee", label: "Rentee" },
  { id: "vehicle", label: "Vehicle" },
  { id: "pickup_date", label: "Pickup Date" },
  { id: "return_date", label: "Return Date" },
  { id: "updated", label: "Updated" },
  { id: "created", label: "Created" },
  { id: "actions", label: "", sx: { width: 72 } },
] as const;

const LoadingRows = () =>
  Array.from({ length: 5 }).map((_, rowIndex) => (
    <TableRow key={rowIndex} aria-hidden>
      {TABLE_COLUMNS.map((column) => (
        <TableCell key={column.id}>
          <Skeleton animation="wave" variant="rounded" width="100%" height={20} />
        </TableCell>
      ))}
    </TableRow>
  ));

const PlaceholderRow = () => (
  <TableRow>
    <TableCell
      colSpan={TABLE_COLUMNS.length}
      align="center"
      sx={{ py: 4, color: "text.secondary" }}
    >
      No agreements found. Adjust your filters or check back soon.
    </TableCell>
  </TableRow>
);

export type AgreementTableProps = {
  /**
   * The list of rental agreements to display in the table.
   */
  agreements: AgreementRecord[];
  /**
   * Indicates whether the table data is currently loading.
   */
  loading: boolean;
  /**
   * Callback function to archive an agreement.
   * @param uuid - The UUID of the agreement to archive.
   * @param details - The finalization details for the agreement.
   * @returns A promise that resolves to the finalized agreement record.
   */
  onArchive: (uuid: string, details: FinalizationSchema) => Promise<AgreementRecord>;
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

    const { generateAgreement } = await import("@/pdfs/agreement");

    const pdfUrl = URL.createObjectURL(await generateAgreement(envData, activeAgreement));
    window.open(pdfUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10_000);

    handleCloseMenu();
  }, [activeAgreement, handleCloseMenu]);

  const handleViewReceipt = useCallback(
    async (record: AgreementRecord) => {
      if (!record) {
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

      const { generateReceipt } = await import("@/pdfs/receipt");

      const pdfUrl = URL.createObjectURL(await generateReceipt(envData, record));
      window.open(pdfUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10_000);

      handleCloseMenu();
    },
    [handleCloseMenu]
  );

  const handleArchive = () => setFinalizingAgreement(true);

  const handleFinalizationConfirm = useCallback(
    async (details: FinalizationSchema) => {
      if (!activeAgreement?.uuid) {
        return;
      }

      setFinalizingAgreement(false);
      const record = await onArchive(activeAgreement.uuid, details);
      handleViewReceipt(record);
    },
    [activeAgreement, onArchive, handleViewReceipt]
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {TABLE_COLUMNS.map((column) => (
              <TableCell
                key={column.id}
                sx={{ fontWeight: 600, ...("sx" in column ? column.sx : undefined) }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <LoadingRows />}
          {!loading && agreements.length === 0 && <PlaceholderRow />}
          {!loading &&
            agreements?.map((record: AgreementRecord) => {
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
          <MenuItem onClick={() => handleViewReceipt(activeAgreement)}>View Receipt</MenuItem>
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
