import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Select,
  Paper,
  LoadingOverlay,
  ScrollArea,
  Table,
  Text,
  Badge,
  Textarea,
  Button,
  ActionIcon,
  Tooltip,
  Divider,
  Drawer,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconFileDescription,
  IconExternalLink,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { students } from "@domas/api-client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { StudentApplication, ApplicationStatus } from "@domas/ts-types";
import { LabelValue } from "@domas/ui";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

interface StudentApplicationsPanelProps {
  active: boolean;
  canReview: boolean;
  onPendingCountChange: (count: number) => void;
}

export function StudentApplicationsPanel({
  active,
  canReview,
  onPendingCountChange,
}: StudentApplicationsPanelProps) {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<
    (StudentApplication & { documentUrl: string })[]
  >([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appActionLoading, setAppActionLoading] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState<
    ApplicationStatus | "all"
  >("pending");
  const [appSelected, setAppSelected] = useState<
    (StudentApplication & { documentUrl: string }) | null
  >(null);
  const [appRejectReason, setAppRejectReason] = useState("");
  const [appShowRejectInput, setAppShowRejectInput] = useState(false);

  const fetchApplications = async () => {
    setAppLoading(true);
    try {
      const result = await students.listApplications(
        appStatusFilter !== "all" ? appStatusFilter : undefined,
      );
      setApplications(result);
      onPendingCountChange(appStatusFilter === "pending" ? result.length : 0);
    } catch {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (active) fetchApplications();
  }, [active, appStatusFilter]);

  const closeAppDrawer = () => {
    setAppSelected(null);
    setAppRejectReason("");
    setAppShowRejectInput(false);
  };

  const handleAppApprove = (
    app: StudentApplication & { documentUrl: string },
  ) => {
    modals.openConfirmModal({
      title: t("approve_application", "Approve Application"),
      children: (
        <Text size="sm">
          {t(
            "approve_application_confirm",
            "Approve the application for {{name}} ({{number}})? A student account will be created automatically.",
            {
              name: `${app.firstName} ${app.lastName}`,
              number: app.studentNumber,
            },
          )}
        </Text>
      ),
      labels: {
        confirm: t("approve", "Approve"),
        cancel: t("cancel"),
      },
      confirmProps: { color: "green" },
      onConfirm: async () => {
        setAppActionLoading(true);
        try {
          await students.reviewApplication(app.id, "approve");
          notifications.show({
            title: t("success"),
            message: t("application_approved", "Application approved"),
            color: "green",
          });
          closeAppDrawer();
          fetchApplications();
        } catch (err: any) {
          notifications.show({
            title: t("error"),
            message:
              err?.response?.data?.message ??
              t("action_failed", "Action failed"),
            color: "red",
          });
        } finally {
          setAppActionLoading(false);
        }
      },
    });
  };

  const handleAppReject = async (
    app: StudentApplication & { documentUrl: string },
  ) => {
    if (!appRejectReason.trim()) return;
    setAppActionLoading(true);
    try {
      await students.reviewApplication(
        app.id,
        "reject",
        appRejectReason.trim(),
      );
      notifications.show({
        title: t("success"),
        message: t("application_rejected", "Application rejected"),
        color: "orange",
      });
      closeAppDrawer();
      fetchApplications();
    } catch (err: any) {
      notifications.show({
        title: t("error"),
        message:
          err?.response?.data?.message ?? t("action_failed", "Action failed"),
        color: "red",
      });
    } finally {
      setAppActionLoading(false);
    }
  };

  return (
    <>
      <Group mb="md">
        <Select
          value={appStatusFilter}
          onChange={(v) =>
            setAppStatusFilter((v as ApplicationStatus | "all") ?? "all")
          }
          data={[
            { value: "all", label: t("all", "All") },
            { value: "pending", label: t("pending", "Pending") },
            { value: "approved", label: t("approved", "Approved") },
            { value: "rejected", label: t("rejected", "Rejected") },
          ]}
          w={160}
        />
      </Group>

      <Paper withBorder radius="md" style={{ position: "relative" }}>
        <LoadingOverlay visible={appLoading} overlayProps={{ blur: 2 }} />
        <ScrollArea>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("student_number")}</Table.Th>
                <Table.Th>{t("name")}</Table.Th>
                <Table.Th>{t("department")}</Table.Th>
                <Table.Th>{t("nationality")}</Table.Th>
                <Table.Th>{t("submitted_at", "Submitted")}</Table.Th>
                <Table.Th>{t("status")}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {applications.length === 0 && !appLoading && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="lg" size="sm">
                      {t("no_applications", "No applications found")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {applications.map((app) => (
                <Table.Tr
                  key={app.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setAppSelected(app)}
                >
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {app.studentNumber}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {app.firstName} {app.lastName}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {app.department}
                    </Text>
                  </Table.Td>
                  <Table.Td>{app.nationalityCode}</Table.Td>
                  <Table.Td>
                    {new Date(app.submittedAt).toLocaleDateString("en-GB")}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[app.status]} size="sm">
                      {t(`app_status_${app.status}`, app.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    {app.status === "pending" && canReview && (
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label={t("approve", "Approve")}>
                          <ActionIcon
                            color="green"
                            variant="light"
                            size="sm"
                            onClick={() => handleAppApprove(app)}
                          >
                            <IconCheck size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t("reject", "Reject")}>
                          <ActionIcon
                            color="red"
                            variant="light"
                            size="sm"
                            onClick={() => {
                              setAppSelected(app);
                              setAppShowRejectInput(true);
                            }}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      {/* Application detail drawer */}
      <Drawer
        opened={!!appSelected}
        onClose={closeAppDrawer}
        title={t("application_details", "Application Details")}
        position="right"
        size="md"
      >
        {appSelected && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700} size="lg">
                {appSelected.firstName} {appSelected.lastName}
              </Text>
              <Badge color={STATUS_COLORS[appSelected.status]}>
                {t(`app_status_${appSelected.status}`, appSelected.status)}
              </Badge>
            </Group>

            {appSelected.rejectionReason && (
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{ borderColor: "var(--mantine-color-red-4)" }}
              >
                <Text size="xs" fw={600} c="red" mb={4}>
                  {t("rejection_reason", "Rejection Reason")}
                </Text>
                <Text size="sm">{appSelected.rejectionReason}</Text>
              </Paper>
            )}

            <Group grow>
              <LabelValue label={t("student_number")}>
                {appSelected.studentNumber}
              </LabelValue>
              <LabelValue label={t("gender")}>
                {t(appSelected.gender)}
              </LabelValue>
            </Group>

            <Group grow>
              <LabelValue label={t("nationality")}>
                {appSelected.nationalityCode}
              </LabelValue>
              <LabelValue label={t("national_id")}>
                {appSelected.nationalId}
              </LabelValue>
            </Group>

            <Group grow>
              <LabelValue label={t("birth_date")}>
                {new Date(appSelected.birthDate).toLocaleDateString("en-GB")}
              </LabelValue>
              <LabelValue label={t("birth_place")}>
                {appSelected.birthPlace}
              </LabelValue>
            </Group>

            <LabelValue label={t("department")}>
              {appSelected.department}
            </LabelValue>

            {appSelected.email && (
              <LabelValue label={t("email")}>{appSelected.email}</LabelValue>
            )}

            {appSelected.phoneNumber && (
              <LabelValue label={t("phone_number")}>
                {appSelected.phoneNumber}
              </LabelValue>
            )}

            <LabelValue label={t("submitted_at", "Submitted")}>
              {new Date(appSelected.submittedAt).toLocaleString("en-GB")}
            </LabelValue>

            <Divider />

            <Button
              leftSection={<IconFileDescription size={16} />}
              rightSection={<IconExternalLink size={14} />}
              variant="light"
              onClick={() => window.open(appSelected.documentUrl, "_blank")}
            >
              {appSelected.documentType === "returning"
                ? t("view_student_certificate", "View Student Certificate")
                : t("view_acceptance_letter", "View Acceptance Letter")}
            </Button>

            {appSelected.status === "pending" && canReview && (
              <>
                <Divider />

                {!appShowRejectInput ? (
                  <Group grow>
                    <Button
                      color="green"
                      leftSection={<IconCheck size={16} />}
                      loading={appActionLoading}
                      onClick={() => handleAppApprove(appSelected)}
                    >
                      {t("approve", "Approve")}
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      leftSection={<IconX size={16} />}
                      onClick={() => setAppShowRejectInput(true)}
                    >
                      {t("reject", "Reject")}
                    </Button>
                  </Group>
                ) : (
                  <Stack gap="xs">
                    <Textarea
                      label={t("rejection_reason", "Rejection Reason")}
                      placeholder={t(
                        "rejection_reason_placeholder",
                        "Explain why this application is being rejected…",
                      )}
                      value={appRejectReason}
                      onChange={(e) =>
                        setAppRejectReason(e.currentTarget.value)
                      }
                      autosize
                      minRows={3}
                      required
                    />
                    <Group gap="xs">
                      <Button
                        color="red"
                        loading={appActionLoading}
                        disabled={!appRejectReason.trim()}
                        onClick={() => handleAppReject(appSelected)}
                      >
                        {t("confirm_reject", "Confirm Reject")}
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          setAppShowRejectInput(false);
                          setAppRejectReason("");
                        }}
                      >
                        {t("cancel")}
                      </Button>
                    </Group>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        )}
      </Drawer>
    </>
  );
}
