import {
  Table,
  Badge,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { TicketView, TicketStatus } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface TicketTableProps {
  data: TicketView[];
  onView: (ticket: TicketView) => void;
}

export function getTicketStatusColor(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.OPEN:
      return "orange";
    case TicketStatus.ESCALATED:
      return "blue";
    case TicketStatus.RESOLVED:
      return "green";
    case TicketStatus.REJECTED:
      return "red";
    default:
      return "gray";
  }
}

export function TicketTable({ data, onView }: TicketTableProps) {
  const { t } = useTranslation();

  const rows = data.map((ticket) => (
    <Table.Tr key={ticket.id}>
      <Table.Td>
        <Stack gap={2}>
          <Text size="sm" fw={500} lineClamp={1}>
            {ticket.title}
          </Text>
          <Text size="xs" c="dimmed">
            {ticket.studentName}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="gray" size="sm">
          {t(`ticket_category.${ticket.category}`)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{ticket.locationName}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={getTicketStatusColor(ticket.status)} variant="light">
          {t(`ticket_status.${ticket.status}`)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Tooltip label={t("view_details")}>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onView(ticket)}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea type="scroll">
      <Table highlightOnHover miw={600}>
        <Table.Thead className={classes.thead}>
          <Table.Tr>
            <Table.Th className={classes.th}>{t("title")}</Table.Th>
            <Table.Th className={classes.th}>{t("category")}</Table.Th>
            <Table.Th className={classes.th}>{t("location")}</Table.Th>
            <Table.Th className={classes.th}>{t("status")}</Table.Th>
            <Table.Th className={classes.th}>{t("date")}</Table.Th>
            <Table.Th className={classes.th} style={{ width: 80 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows}
          {data.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6} style={{ padding: 0 }}>
                <EmptyState title={t("no_tickets_found")} />
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
