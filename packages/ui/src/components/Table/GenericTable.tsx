import { Table, Text, LoadingOverlay, Paper } from "@mantine/core";
import { ReactNode } from "react";

export interface Column<T> {
  header: ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
}

export function GenericTable<T>({
  data,
  columns,
  loading = false,
  onRowClick,
  actions,
  emptyMessage = "No data found",
  rowKey,
}: GenericTableProps<T>) {
  return (
    <Paper
      withBorder
      radius="md"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <LoadingOverlay
        visible={loading}
        zIndex={10}
        overlayProps={{ blur: 2 }}
      />
      <Table striped highlightOnHover={!!onRowClick}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col, index) => (
              <Table.Th
                key={index}
                style={{ width: col.width, textAlign: col.align }}
              >
                {col.header}
              </Table.Th>
            ))}
            {actions && <Table.Th style={{ width: 80 }} />}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.length > 0 ? (
            data.map((row) => (
              <Table.Tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((col, index) => (
                  <Table.Td key={index} style={{ textAlign: col.align }}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                        ? (row[col.accessorKey] as ReactNode)
                        : null}
                  </Table.Td>
                ))}
                {actions && <Table.Td>{actions(row)}</Table.Td>}
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td
                colSpan={columns.length + (actions ? 1 : 0)}
                style={{ height: 100 }}
              >
                <Text c="dimmed" ta="center">
                  {emptyMessage}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
