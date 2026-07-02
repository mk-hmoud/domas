import { Table, LoadingOverlay, Paper, ScrollArea } from "@mantine/core";
import { memo, ReactNode } from "react";
import { EmptyState } from "../EmptyState";
import classes from "./table.module.css";

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
  maxHeight?: number;
}

function GenericTableInner<T>({
  data,
  columns,
  loading = false,
  onRowClick,
  actions,
  emptyMessage = "No data found",
  rowKey,
  maxHeight,
}: GenericTableProps<T>) {
  const colSpan = columns.length + (actions ? 1 : 0);

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
      <ScrollArea h={maxHeight} type="auto" scrollbarSize={6}>
        <Table highlightOnHover={!!onRowClick} stickyHeader>
          <Table.Thead className={classes.thead}>
            <Table.Tr>
              {columns.map((col, index) => (
                <Table.Th
                  key={index}
                  className={classes.th}
                  style={{ width: col.width, textAlign: col.align }}
                >
                  {col.header}
                </Table.Th>
              ))}
              {actions && (
                <Table.Th className={classes.th} style={{ width: 64 }} />
              )}
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
                <Table.Td colSpan={colSpan} style={{ padding: 0 }}>
                  <EmptyState title={emptyMessage} />
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}

// memo cast preserves the generic type parameter
export const GenericTable = memo(GenericTableInner) as typeof GenericTableInner;
