import { formatDate } from "@/utils/text";
import { generateRentalPDF } from "@/utils/pdf";
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
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { memo, useCallback, useState, MouseEvent } from "react";
import Link from "next/link";

export type AgreementTableProps = {
  agreements: AgreementRecord[];
};

const AgreementTable = ({ agreements }: AgreementTableProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeAgreement, setActiveAgreement] = useState<AgreementRecord["agreement"] | null>(null);

  const handleOpenMenu = (
    event: MouseEvent<HTMLButtonElement>,
    agreement: AgreementRecord["agreement"]
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveAgreement(agreement);
  };

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveAgreement(null);
  }, []);

  const handleViewPdf = useCallback(async () => {
    const envData = ENV_SCHEMA.parse({
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
    });

    if (!activeAgreement) {
      return;
    }

    const pdfUrl = URL.createObjectURL(await generateRentalPDF(envData, activeAgreement));
    window.open(pdfUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10_000);

    handleCloseMenu();
  }, [activeAgreement, handleCloseMenu]);

  return (
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
            <TableCell sx={{ width: 72 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {agreements.map(({ uuid, agreement, updatedAt, createdAt }) => {
            const { agreement_number, rentee, rental_agreement_info } = agreement;
            const { year, make, model } = agreement.rental_vehicle;

            return (
              <TableRow key={uuid}>
                <TableCell>
                  <Tooltip title={`Edit agreement ${agreement_number}`}>
                    <Link href={`/agreement?uuid=${uuid}`}>{agreement_number}</Link>
                  </Tooltip>
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
                    onClick={(event) => handleOpenMenu(event, agreement)}
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
        <MenuItem onClick={handleViewPdf}>View PDF</MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default memo<AgreementTableProps>(AgreementTable);
