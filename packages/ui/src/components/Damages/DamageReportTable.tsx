import { Table, Badge, Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconEye, IconCheck, IconX } from "@tabler/icons-react";
import { DamageReport, DamageStatus } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface DamageReportTableProps {
  data: any[]; // Extended with student and location names from mapping
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
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("location")}</Table.Th>
          <Table.Th>{t("description")}</Table.Th>
          <Table.Th>{t("status")}</Table.Th>
          <Table.Th>{t("date")}</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text ta="center" c="dimmed" py="xl">
                {t("no_records_found")}
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
