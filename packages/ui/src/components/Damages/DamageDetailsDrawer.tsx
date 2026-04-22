import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Button,
  Table,
  Paper,
} from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DamageReport, DamageStatus } from "@domas/ts-types";
import { LabelValue } from "../LabelValue";
import classes from "../Table/table.module.css";

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
            size={18}
            color="var(--mantine-color-orange-filled)"
          />
          <Text fw={700} size="sm">
            {t("damage_report_details", "Damage Report Details")}
          </Text>
        </Group>
      }
      position="right"
      size="md"
    >
      {report && (
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text fw={700} size="md">
                {report.locationName || report.locationId}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(report.reportedAt).toLocaleString()}
              </Text>
            </Stack>
            <Badge
              color={getStatusColor(report.status)}
              variant="light"
              size="lg"
            >
              {t(`damage_status.${report.status}`)}
            </Badge>
          </Group>

          <Divider />

          <Stack gap="md">
            <LabelValue label={t("description")}>
              {report.description}
            </LabelValue>

            <Group grow>
              <LabelValue label={t("price_try")}>
                <Text fw={700} size="lg">
                  {report.costTry || 0} TRY
                </Text>
              </LabelValue>
              <LabelValue label={t("price_foreign")}>
                <Text fw={700} size="lg">
                  {report.costForeign || 0} {report.currencyCode}
                </Text>
              </LabelValue>
            </Group>

            <LabelValue label={t("culprits")}>
              {report.culpritNames ? (
                report.culpritNames
              ) : (
                <Text size="sm" c="dimmed" fs="italic">
                  {t(
                    "group_liability_note",
                    "No specific students identified (Group liability will apply)",
                  )}
                </Text>
              )}
            </LabelValue>
          </Stack>

          {report.status === DamageStatus.APPROVED && (
            <>
              <Divider label={t("liabilities")} labelPosition="left" />
              <Paper
                withBorder
                radius="md"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table highlightOnHover>
                  <Table.Thead className={classes.thead}>
                    <Table.Tr>
                      <Table.Th className={classes.th}>
                        {t("culprit", { defaultValue: "Culprit" })}
                      </Table.Th>
                      <Table.Th className={classes.th}>{t("amount")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {report.liabilities?.map((l) => (
                      <Table.Tr key={l.id}>
                        <Table.Td>
                          {l.studentName || l.guestName ? (
                            <>
                              {l.studentName || l.guestName}
                              {l.guestName && (
                                <Text span size="xs" c="dimmed" ml={4}>
                                  ({t("guest", { defaultValue: "Guest" })}
                                  {l.guestStayCheckIn
                                    ? ` · ${new Date(l.guestStayCheckIn).toLocaleDateString()}`
                                    : ""}
                                  )
                                </Text>
                              )}
                            </>
                          ) : (
                            l.studentId || l.guestStayId
                          )}
                        </Table.Td>
                        <Table.Td>
                          {l.amount} {l.currency}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </>
          )}

          <Divider />

          <Stack gap={4}>
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
              <Group grow mt="md">
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
