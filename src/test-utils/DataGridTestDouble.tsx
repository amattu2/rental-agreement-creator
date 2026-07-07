import type { ReactNode } from "react";

type GridRowId = string | number;

type GridRenderCellParams<Row> = {
  row: Row;
  value: unknown;
};

type GridActionParams<Row> = {
  row: Row;
};

type GridColumn<Row> = {
  field: string;
  headerName?: string;
  type?: "actions" | string;
  valueGetter?: (_value: unknown, row: Row) => ReactNode;
  renderCell?: (params: GridRenderCellParams<Row>) => ReactNode;
  getActions?: (params: GridActionParams<Row>) => ReactNode[];
};

type DataGridTestDoubleProps<Row> = {
  rows: Row[];
  columns: GridColumn<Row>[];
  getRowId: (row: Row) => GridRowId;
};

type GridActionsCellItemTestDoubleProps = {
  label: string;
  onClick: () => void;
};

export const GridActionsCellItemTestDouble = ({
  label,
  onClick,
}: GridActionsCellItemTestDoubleProps) => {
  return (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  );
};

export const DataGridTestDouble = <Row,>({
  rows,
  columns,
  getRowId,
}: DataGridTestDoubleProps<Row>) => {
  return (
    <table aria-label="mock-data-grid">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.field}>{column.headerName ?? column.field}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(getRowId(row))}>
            {columns.map((column) => {
              const value = column.valueGetter
                ? column.valueGetter(undefined, row)
                : (row as Record<string, unknown>)[column.field];

              if (column.type === "actions" && column.getActions) {
                return <td key={column.field}>{column.getActions({ row })}</td>;
              }

              if (column.renderCell) {
                return <td key={column.field}>{column.renderCell({ row, value })}</td>;
              }

              return <td key={column.field}>{value as ReactNode}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
