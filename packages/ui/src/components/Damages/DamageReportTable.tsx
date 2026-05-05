import {
  Table,
  Badge,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  ScrollArea,
} from "@mantine/core";
import { IconEye, IconCheck, IconX } from "@tabler/icons-react";
import { DamageReport, DamageStatus } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface DamageReportTableProps {
  data: any[];
  onView: (report: DamageReport) => void;
  onApprove?: (report: DamageReport) => void;
  onReject?: (report: DamageReport) => void;
  canManage?: boolean;
}

export function DamageReportTable({
  data,
  onView,
  onApprove,
  onReject,
  canManage,
}: DamageReportTableProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: DamageStatus) => {
    switch (status) {
      case DamageStatus.PENDING:
        return "orange";
      case DamageStatus.APPROVED:
        return "green";
      case DamageStatus.REJECTED:
        return "red";
      default:
        return "gray";
    }
  };

  const rows = data.map((report) => (
    <Table.Tr key={report.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {report.locationName || report.locationId}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" lineClamp={1}>
          {report.description}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(report.status)} variant="light">
          {t(`damage_status.${report.status}`)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(report.reportedAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Tooltip label={t("view_details")}>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onView(report)}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          {canManage && report.status === DamageStatus.PENDING && (
            <>
              <Tooltip label={t("approve")}>
                <ActionIcon
                  variant="subtle"
                  color="green"
                  onClick={() => onApprove?.(report)}
                >
                  <IconCheck size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("reject")}>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => onReject?.(report)}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea type="scroll">
      <Table highlightOnHover miw={480}>
        <Table.Thead className={classes.thead}>
          <Table.Tr>
            <Table.Th className={classes.th}>{t("location")}</Table.Th>
            <Table.Th className={classes.th}>{t("description")}</Table.Th>
            <Table.Th className={classes.th}>{t("status")}</Table.Th>
            <Table.Th className={classes.th}>{t("date")}</Table.Th>
            <Table.Th className={classes.th} style={{ width: 100 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows}
          {data.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} style={{ padding: 0 }}>
                <EmptyState
                  title={t("no_records_found", {
                    defaultValue: "No records found",
                  })}
                />
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
