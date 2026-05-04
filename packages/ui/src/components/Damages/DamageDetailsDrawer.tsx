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
  ActionIcon,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconPhoto,
  IconExternalLink,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DamageReport, DamageStatus } from "@domas/ts-types";
import { LabelValue } from "../LabelValue";
import classes from "../Table/table.module.css";

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  canManage?: boolean;
  onGetImageUrl?: (imageId: string) => Promise<string>;
  onDeleteImage?: (imageId: string) => Promise<void>;
}

export function DamageDetailsDrawer({
  opened,
  onClose,
  report,
  onApprove,
  onReject,
  loading,
  canManage,
  onGetImageUrl,
  onDeleteImage,
}: DamageDetailsDrawerProps) {
  const { t } = useTranslation();
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const handleViewImage = async (imageId: string) => {
    if (!onGetImageUrl) return;
    setViewingImageId(imageId);
    try {
      const url = await onGetImageUrl(imageId);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setViewingImageId(null);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!onDeleteImage) return;
    setDeletingImageId(imageId);
    try {
      await onDeleteImage(imageId);
    } finally {
      setDeletingImageId(null);
    }
  };

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

          <Divider
            label={t("evidence_images", "Evidence Images")}
            labelPosition="left"
          />

          {(report.images ?? []).length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              {t("no_evidence_images", "No evidence images attached")}
            </Text>
          ) : (
            <Stack gap="xs">
              {(report.images ?? []).map((img) => (
                <Paper key={img.id} withBorder p="xs" radius="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <IconPhoto
                        size={16}
                        color="var(--mantine-color-blue-5)"
                      />
                      <Text size="sm" truncate style={{ flex: 1 }}>
                        {img.filename}
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {formatBytes(img.size)}
                      </Text>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        loading={viewingImageId === img.id}
                        disabled={!onGetImageUrl}
                        onClick={() => handleViewImage(img.id)}
                        title={t("view", "View")}
                      >
                        <IconExternalLink size={14} />
                      </ActionIcon>
                      {canManage && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          loading={deletingImageId === img.id}
                          disabled={!onDeleteImage}
                          onClick={() => handleDeleteImage(img.id)}
                          title={t("delete", "Delete")}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}

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
