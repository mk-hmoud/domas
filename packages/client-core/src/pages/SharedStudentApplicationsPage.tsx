import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconExternalLink,
  IconFileDescription,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { students } from "@domas/api-client";
import {
  ApplicationDocumentType,
  ApplicationStatus,
  StudentApplication,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { LabelValue } from "@domas/ui";

const DOC_TYPE_COLORS: Record<ApplicationDocumentType, string> = {
  freshman: "blue",
  returning: "orange",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

export function SharedStudentApplicationsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canReview = hasPermission("students.review_applications");
  const [applications, setApplications] = useState<
    (StudentApplication & { documentUrl: string })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "pending",
  );
  const [selected, setSelected] = useState<
    (StudentApplication & { documentUrl: string }) | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await students.listApplications(
        statusFilter !== "all" ? statusFilter : undefined,
      );
      setApplications(result);
    } catch {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleApprove = (app: StudentApplication & { letterUrl: string }) => {
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
      labels: { confirm: t("approve", "Approve"), cancel: t("cancel") },
      confirmProps: { color: "green" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await students.reviewApplication(app.id, "approve");
          notifications.show({
            title: t("success"),
            message: t(
              "application_approved",
              "Application approved — student account created",
            ),
            color: "green",
          });
          setSelected(null);
          fetchData();
        } catch (err: any) {
          notifications.show({
            title: t("error"),
            message:
              err?.response?.data?.message ??
              t("action_failed", "Action failed"),
            color: "red",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = async (
    app: StudentApplication & { letterUrl: string },
  ) => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await students.reviewApplication(app.id, "reject", rejectReason.trim());
      notifications.show({
        title: t("success"),
        message: t("application_rejected", "Application rejected"),
        color: "orange",
      });
      setSelected(null);
      setRejectReason("");
      setShowRejectInput(false);
      fetchData();
    } catch (err: any) {
      notifications.show({
        title: t("error"),
        message:
          err?.response?.data?.message ?? t("action_failed", "Action failed"),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelected(null);
    setRejectReason("");
    setShowRejectInput(false);
  };

  return (
    <>
      <PageHeader title={t("student_applications", "Student Applications")} />
      <PageShell>
        <Group mb="md">
          <Select
            value={statusFilter}
            onChange={(v) =>
              setStatusFilter((v as ApplicationStatus | "all") ?? "all")
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
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("student_number")}</Table.Th>
                  <Table.Th>{t("name")}</Table.Th>
                  <Table.Th>{t("department")}</Table.Th>
                  <Table.Th>{t("nationality")}</Table.Th>
                  <Table.Th>{t("type", "Type")}</Table.Th>
                  <Table.Th>{t("submitted_at", "Submitted")}</Table.Th>
                  <Table.Th>{t("status")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {applications.length === 0 && !loading && (
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
                    onClick={() => setSelected(app)}
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
                      <Badge
                        color={DOC_TYPE_COLORS[app.documentType ?? "freshman"]}
                        size="sm"
                        variant="light"
                      >
                        {t(
                          `doc_type_${app.documentType ?? "freshman"}`,
                          app.documentType === "returning"
                            ? "Returning"
                            : "Freshman",
                        )}
                      </Badge>
                    </Table.Td>
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
                              onClick={() => handleApprove(app)}
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
                                setSelected(app);
                                setShowRejectInput(true);
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
      </PageShell>

      <Drawer
        opened={!!selected}
        onClose={closeDrawer}
        title={t("application_details", "Application Details")}
        position="right"
        size="md"
      >
        {selected && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700} size="lg">
                {selected.firstName} {selected.lastName}
              </Text>
              <Group gap={6}>
                <Badge
                  color={DOC_TYPE_COLORS[selected.documentType ?? "freshman"]}
                  variant="light"
                >
                  {selected.documentType === "returning"
                    ? t("returning", "Returning")
                    : t("freshman", "Freshman")}
                </Badge>
                <Badge color={STATUS_COLORS[selected.status]}>
                  {t(`app_status_${selected.status}`, selected.status)}
                </Badge>
              </Group>
            </Group>

            {selected.rejectionReason && (
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{ borderColor: "var(--mantine-color-red-4)" }}
              >
                <Text size="xs" fw={600} c="red" mb={4}>
                  {t("rejection_reason", "Rejection Reason")}
                </Text>
                <Text size="sm">{selected.rejectionReason}</Text>
              </Paper>
            )}

            <Group grow>
              <LabelValue label={t("student_number")}>
                {selected.studentNumber}
              </LabelValue>
              <LabelValue label={t("gender")}>{t(selected.gender)}</LabelValue>
            </Group>

            <Group grow>
              <LabelValue label={t("nationality")}>
                {selected.nationalityCode}
              </LabelValue>
              <LabelValue label={t("national_id")}>
                {selected.nationalId}
              </LabelValue>
            </Group>

            <Group grow>
              <LabelValue label={t("birth_date")}>
                {new Date(selected.birthDate).toLocaleDateString("en-GB")}
              </LabelValue>
              <LabelValue label={t("birth_place")}>
                {selected.birthPlace}
              </LabelValue>
            </Group>

            <LabelValue label={t("department")}>
              {selected.department}
            </LabelValue>

            {selected.email && (
              <LabelValue label={t("email")}>{selected.email}</LabelValue>
            )}

            {selected.phoneNumber && (
              <LabelValue label={t("phone_number")}>
                {selected.phoneNumber}
              </LabelValue>
            )}

            <LabelValue label={t("submitted_at", "Submitted")}>
              {new Date(selected.submittedAt).toLocaleString("en-GB")}
            </LabelValue>

            <Divider />

            <Button
              leftSection={<IconFileDescription size={16} />}
              rightSection={<IconExternalLink size={14} />}
              variant="light"
              onClick={() => window.open(selected.documentUrl, "_blank")}
            >
              {selected.documentType === "returning"
                ? t("view_student_certificate", "View Student Certificate")
                : t("view_acceptance_letter", "View Acceptance Letter")}
            </Button>
            {selected.documentType === "returning" &&
              selected.documentExpiryDate && (
                <Text size="xs" c="dimmed">
                  {t("certificate_expires", "Certificate expires")}:{" "}
                  {new Date(selected.documentExpiryDate).toLocaleDateString(
                    "en-GB",
                  )}
                </Text>
              )}

            {selected.status === "pending" && canReview && (
              <>
                <Divider />

                {!showRejectInput ? (
                  <Group grow>
                    <Button
                      color="green"
                      leftSection={<IconCheck size={16} />}
                      loading={actionLoading}
                      onClick={() => handleApprove(selected)}
                    >
                      {t("approve", "Approve")}
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      leftSection={<IconX size={16} />}
                      onClick={() => setShowRejectInput(true)}
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
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.currentTarget.value)}
                      autosize
                      minRows={3}
                      required
                    />
                    <Group gap="xs">
                      <Button
                        color="red"
                        loading={actionLoading}
                        disabled={!rejectReason.trim()}
                        onClick={() => handleReject(selected)}
                      >
                        {t("confirm_reject", "Confirm Reject")}
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          setShowRejectInput(false);
                          setRejectReason("");
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
