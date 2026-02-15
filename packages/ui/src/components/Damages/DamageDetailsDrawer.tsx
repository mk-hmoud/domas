import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Title,
  Divider,
  Box,
  Button,
  Table,
  Paper,
} from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DamageReport, DamageStatus } from "@domas/ts-types";

interface DamageDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  report:
    | (DamageReport & {
        liabilities?: any[];
        locationName?: string;
        reportedByName?: string;
        reviewedByName?: string;
        costTry?: number;
        costForeign?: number;
        currencyCode?: string;
        culpritNames?: string;
      })
    | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  loading?: boolean;
}

export function DamageDetailsDrawer({
  opened,
  onClose,
  report,
  onApprove,
  onReject,
  loading,
}: DamageDetailsDrawerProps) {
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

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle
            size={20}
            color="var(--mantine-color-orange-filled)"
          />
          <Text fw={700}>
            {t("damage_report_details", "Damage Report Details")}
          </Text>
        </Group>
      }
      position="right"
      size="md"
    >
      {report && (
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Title order={3}>
                {report.locationName || report.locationId}
              </Title>
              <Text size="sm" c="dimmed">
                {new Date(report.reportedAt).toLocaleString()}
              </Text>
            </Stack>
            <Badge
              color={getStatusColor(report.status)}
              variant="filled"
              size="lg"
            >
              {t(`damage_status.${report.status}`)}
            </Badge>
          </Group>

          <Divider
            label={t("incident_info", "Incident Information")}
            labelPosition="center"
          />

          <Box>
            <Text size="xs" c="dimmed" mb={4} tt="uppercase" fw={700}>
              {t("description")}
            </Text>
            <Text size="sm">{report.description}</Text>
          </Box>

          <Group grow>
            <Box>
              <Text size="xs" c="dimmed" mb={4} tt="uppercase" fw={700}>
                {t("price_try")}
              </Text>
              <Text fw={700} size="lg">
                {report.costTry || 0} TRY
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb={4} tt="uppercase" fw={700}>
                {t("price_foreign")}
              </Text>
              <Text fw={700} size="lg">
                {report.costForeign || 0} {report.currencyCode}
              </Text>
            </Box>
          </Group>

          <Box>
            <Text size="xs" c="dimmed" mb={4} tt="uppercase" fw={700}>
              {t("culprits")}
            </Text>
            {report.culpritNames ? (
              <Text size="sm" fw={500}>
                {report.culpritNames}
              </Text>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">
                {t(
                  "group_liability_note",
                  "No specific students identified (Group liability will apply)",
                )}
              </Text>
            )}
          </Box>

          {report.status === DamageStatus.APPROVED && (
            <Box>
              <Text size="xs" c="dimmed" mb={8} tt="uppercase" fw={700}>
                {t("liabilities")}
              </Text>
              <Paper
                withBorder
                radius="md"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t("student")}</Table.Th>
                      <Table.Th>{t("amount")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {report.liabilities?.map((l) => (
                      <Table.Tr key={l.id}>
                        <Table.Td>{l.studentName || l.studentId}</Table.Td>
                        <Table.Td>
                          {l.amount} {l.currency}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>
          )}

          <Divider />

          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              {t("reported_by")}: {report.reportedByName || report.reportedBy}
            </Text>
            {report.reviewedBy && (
              <Text size="xs" c="dimmed">
                {t("reviewed_by")}: {report.reviewedByName || report.reviewedBy}{" "}
                at {new Date(report.reviewedAt!).toLocaleString()}
              </Text>
            )}
          </Stack>

          {report.status === DamageStatus.PENDING &&
            (onApprove || onReject) && (
              <Group grow mt="xl">
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={() => onReject?.(report.id)}
                  loading={loading}
                >
                  {t("reject")}
                </Button>
                <Button
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => onApprove?.(report.id)}
                  loading={loading}
                >
                  {t("approve")}
                </Button>
              </Group>
            )}
        </Stack>
      )}
    </Drawer>
  );
}
