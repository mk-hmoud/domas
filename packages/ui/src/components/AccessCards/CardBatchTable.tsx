import { Table, Text, Badge } from "@mantine/core";
import { CardBatch } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface CardBatchTableProps {
  data: CardBatch[];
}

export function CardBatchTable({ data }: CardBatchTableProps) {
  const { t } = useTranslation();

  const rows = data.map((batch) => (
    <Table.Tr key={batch.id}>
      <Table.Td fw={500}>{batch.name}</Table.Td>
      <Table.Td>
        {batch.rangeStart} - {batch.rangeEnd}
      </Table.Td>
      <Table.Td>
        <Badge variant="outline">
          {batch.rangeEnd - batch.rangeStart + 1} {t("cards", "Cards")}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {new Date(batch.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table highlightOnHover>
      <Table.Thead className={classes.thead}>
        <Table.Tr>
          <Table.Th className={classes.th}>{t("batch_name")}</Table.Th>
          <Table.Th className={classes.th}>{t("range")}</Table.Th>
          <Table.Th className={classes.th}>
            {t("total_cards", "Total")}
          </Table.Th>
          <Table.Th className={classes.th}>{t("created_at")}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={4} style={{ padding: 0 }}>
              <EmptyState
                title={t("no_batches_found", "No card batches found")}
              />
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
