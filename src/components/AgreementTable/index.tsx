import CancelIcon from "@mui/icons-material/Cancel";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TaskIcon from "@mui/icons-material/Task";
import { Tooltip, NoSsr } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridActionsCellItem,
  GridRowParams,
} from "@mui/x-data-grid";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Link from "next/link";
import { memo, useCallback, useState, useMemo } from "react";

import { CancellationDialog } from "@/components/CancellationDialog";
import { FinalizationDialog } from "@/components/FinalizationDialog";
import StatusChip from "@/components/StatusChip";
import { ENV_SCHEMA } from "@/schemas/env";
import { FinalizationSchema } from "@/schemas/finalization";
import { formatDate, formatNumber } from "@/utils/text";

const AGREEMENT_TABLE_COLUMNS: GridColDef<AgreementRecord>[] = [
  {
    field: "agreement_number",
    headerName: "Agreement No.",
    flex: 1,
    minWidth: 120,
    sortable: false,
    hideable: false,
    renderCell: ({ row }: GridRenderCellParams<AgreementRecord>) => {
      return (
        <Tooltip title={`Manage agreement - ${row.agreement.agreement_number}`}>
          <Link href={`/agreement?uuid=${row.uuid}`}>{row.agreement.agreement_number}</Link>
        </Tooltip>
      );
    },
  },
  {
    field: "full_name",
    headerName: "Rentee",
    flex: 1,
    minWidth: 120,
    sortable: true,
    valueGetter: (_, row: AgreementRecord) => row.agreement.rentee.full_name,
  },
  {
    field: "license",
    headerName: "Driver's license",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: AgreementRecord) =>
      `${row.agreement.rentee.driver_license_number} (${row.agreement.rentee.driver_license_state})`,
  },
  {
    field: "vehicle",
    headerName: "Vehicle",
    flex: 1,
    minWidth: 150,
    sortable: true,
    valueGetter: (_, row: AgreementRecord) => {
      const { year, make, model } = row.agreement.rental_vehicle;
      return `${year} ${make} ${model}`.trim();
    },
  },
  {
    field: "VIN",
    headerName: "VIN",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: AgreementRecord) => row.agreement.rental_vehicle.VIN,
  },
  {
    field: "date_out",
    headerName: "Pickup Date",
    flex: 1,
    minWidth: 140,
    sortable: true,
    valueGetter: (_, row: AgreementRecord) => row.agreement.rental_agreement_info.date_out,
    renderCell: ({ row }: GridRenderCellParams<AgreementRecord>) =>
      formatDate(row.agreement.rental_agreement_info.date_out, "MM/DD/YYYY h:mma"),
  },
  {
    field: "odometer_out",
    headerName: "Odometer Out",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: AgreementRecord) =>
      `${formatNumber(row.agreement.rental_agreement_info.odometer_out, false)} ${row.agreement.rental_agreement_info.max_distance_measurement}`,
  },
  {
    field: "date_in",
    headerName: "Return Date",
    flex: 1,
    minWidth: 140,
    sortable: true,
    valueGetter: (_, row: AgreementRecord) => row.agreement.rental_agreement_info.date_in,
    renderCell: ({ row }: GridRenderCellParams<AgreementRecord>) =>
      formatDate(row.agreement.rental_agreement_info.date_in, "MM/DD/YYYY h:mma"),
  },
  {
    field: "odometer_in",
    headerName: "Odometer In",
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_, row: AgreementRecord) =>
      `${formatNumber(row.agreement.rental_agreement_info.odometer_in, false)} ${row.agreement.rental_agreement_info.max_distance_measurement}`,
  },
  {
    field: "updatedAt",
    headerName: "Updated",
    flex: 1,
    minWidth: 140,
    sortable: true,
    valueGetter: (_, row: AgreementRecord) => row.updatedAt,
    renderCell: ({ row }: GridRenderCellParams<AgreementRecord>) =>
      formatDate(row.updatedAt, "MM/DD/YYYY h:mma"),
  },
  {
    field: "createdAt",
    headerName: "Created",
    flex: 1,
    minWidth: 140,
    sortable: true,
    valueGetter: (_, row: AgreementRecord) => row.createdAt,
    renderCell: ({ row }: GridRenderCellParams<AgreementRecord>) =>
      formatDate(row.createdAt, "MM/DD/YYYY h:mma"),
  },
  {
    field: "status",
    headerName: "Status",
    width: 100,
    sortable: true,
    renderCell: ({ row }: GridRenderCellParams<AgreementRecord>) => (
      <StatusChip status={row.status} />
    ),
  },
];

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
   *
   * @param uuid - The UUID of the agreement to archive.
   * @param details - The finalization details for the agreement.
   * @returns A promise that resolves to the finalized agreement record.
   */
  onArchive: (uuid: string, details: FinalizationSchema) => Promise<AgreementRecord>;
  /**
   * Callback function to cancel an agreement.
   *
   * @param uuid - The UUID of the agreement to cancel.
   * @returns A promise that resolves to the canceled agreement record.
   */
  onCancel: (uuid: string) => Promise<AgreementRecord>;
};

const AgreementTable = ({ agreements, loading, onArchive, onCancel }: AgreementTableProps) => {
  const [activeAgreement, setActiveAgreement] = useState<AgreementRecord | null>(null);
  const [finalizingAgreement, setFinalizingAgreement] = useState<boolean>(false);
  const [cancelingAgreement, setCancelingAgreement] = useState<boolean>(false);

  const handleViewAgreement = useCallback(async (record: AgreementRecord) => {
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

    const { generateAgreement } = await import("@/pdfs/agreement");

    const pdfUrl = URL.createObjectURL(
      await generateAgreement(envData, record, record.status !== "active")
    );
    window.open(pdfUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10_000);
  }, []);

  const handleViewReceipt = useCallback(async (record: AgreementRecord) => {
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
  }, []);

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

  const handleCancellationConfirm = useCallback(async () => {
    if (!activeAgreement?.uuid) {
      return;
    }

    await onCancel(activeAgreement.uuid);
    setCancelingAgreement(false);
  }, [activeAgreement, onCancel]);

  const columns = useMemo<GridColDef<AgreementRecord>[]>(
    () => [
      ...AGREEMENT_TABLE_COLUMNS,
      {
        field: "actions",
        type: "actions",
        hideable: false,
        getActions: (params: GridRowParams<AgreementRecord>) =>
          [
            <GridActionsCellItem
              icon={<PictureAsPdfIcon />}
              onClick={() => handleViewAgreement(params.row)}
              label="View Agreement"
              key="view-agreement"
              showInMenu
            />,
            params.row?.status === "archived" ? (
              <GridActionsCellItem
                icon={<ReceiptLongIcon />}
                onClick={() => handleViewReceipt(params.row)}
                label="View Receipt"
                key="view-receipt"
                showInMenu
              />
            ) : null,
            params.row?.status === "active" ? (
              <GridActionsCellItem
                icon={<TaskIcon />}
                onClick={() => {
                  setActiveAgreement(params.row);
                  setFinalizingAgreement(true);
                }}
                label="Finalize"
                key="finalize"
                showInMenu
              />
            ) : null,
            params.row?.status === "active" ? (
              <GridActionsCellItem
                icon={<CancelIcon />}
                onClick={() => {
                  setActiveAgreement(params.row);
                  setCancelingAgreement(true);
                }}
                label="Cancel"
                key="cancel"
                showInMenu
              />
            ) : null,
          ].filter(Boolean),
      },
    ],
    [handleViewAgreement, handleViewReceipt]
  );

  return (
    <>
      <NoSsr>
        <DataGrid
          rows={agreements}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.uuid}
          localeText={{
            noRowsLabel: "No agreements found. Adjust your filters or check back soon.",
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
            sorting: {
              sortModel: [{ field: "updatedAt", sort: "desc" }],
            },
            columns: {
              columnVisibilityModel: {
                license: false,
                VIN: false,
                odometer_in: false,
                createdAt: false,
              },
            },
          }}
          sx={{ border: "none" }}
          disableRowSelectionOnClick
          disableColumnFilter
        />
      </NoSsr>

      {finalizingAgreement && activeAgreement && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FinalizationDialog
            agreement={activeAgreement.agreement}
            onClose={() => setFinalizingAgreement(false)}
            onConfirm={handleFinalizationConfirm}
          />
        </LocalizationProvider>
      )}

      {cancelingAgreement && activeAgreement && (
        <CancellationDialog
          onClose={() => setCancelingAgreement(false)}
          onConfirm={handleCancellationConfirm}
        />
      )}
    </>
  );
};

export default memo<AgreementTableProps>(AgreementTable);
