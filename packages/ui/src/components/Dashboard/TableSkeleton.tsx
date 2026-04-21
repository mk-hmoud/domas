import { Skeleton, Table } from "@mantine/core";

interface TableSkeletonProps {
  rows?: number;
  cols: number;
}

export function TableSkeleton({ rows = 6, cols }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <Table.Tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <Table.Td key={j}>
              <Skeleton height={13} radius="sm" />
            </Table.Td>
          ))}
        </Table.Tr>
      ))}
    </>
  );
}
