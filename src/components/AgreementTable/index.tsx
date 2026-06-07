import { formatDate } from "@/utils/text";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { memo } from "react";

export type AgreementTableProps = {
  agreements: AgreementRecord[];
  onRowClick: (uuid: string) => void;
};

const AgreementTable = ({ agreements, onRowClick }: AgreementTableProps) => (
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
        {agreements.map(({ uuid, agreement, updatedAt, createdAt }) => {
          const { agreement_number, rentee, rental_agreement_info } = agreement;
          const { year, make, model } = agreement.rental_vehicle;

          return (
            <TableRow key={uuid} onClick={() => onRowClick(uuid)} sx={{ cursor: "pointer" }}>
              <TableCell>{agreement_number}</TableCell>
              <TableCell>{rentee.full_name}</TableCell>
              <TableCell>{`${year} ${make} ${model}`.trim()}</TableCell>
              <TableCell>{formatDate(rental_agreement_info.date_out)}</TableCell>
              <TableCell>{formatDate(rental_agreement_info.date_in)}</TableCell>
              <TableCell>{updatedAt}</TableCell>
              <TableCell>{createdAt}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

export default memo<AgreementTableProps>(AgreementTable);
