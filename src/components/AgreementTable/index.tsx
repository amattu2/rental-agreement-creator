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
  Typography,
  styled,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { memo, useCallback } from "react";

const StyledAgreementButton = styled(Typography)({
  cursor: "pointer",
  textDecoration: "underline",
});

export type AgreementTableProps = {
  agreements: AgreementRecord[];
  onRowClick: (uuid: string) => void;
};

const AgreementTable = ({ agreements, onRowClick }: AgreementTableProps) => {
  const handleViewPdf = useCallback(async (agreement: AgreementRecord["agreement"]) => {
    const envData = ENV_SCHEMA.parse({
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
    });

    const pdfUrl = URL.createObjectURL(await generateRentalPDF(envData, agreement));
    window.open(pdfUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10_000);
  }, []);

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
            <TableCell sx={{ fontWeight: 600, width: 72 }}>View</TableCell>
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
                    <StyledAgreementButton variant="button" onClick={() => onRowClick(uuid)}>
                      {agreement_number}
                    </StyledAgreementButton>
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
                  <Tooltip title={`View PDF for agreement ${agreement_number}`}>
                    <IconButton
                      size="small"
                      aria-label={`View PDF for agreement ${agreement_number}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPdf(agreement);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default memo<AgreementTableProps>(AgreementTable);
