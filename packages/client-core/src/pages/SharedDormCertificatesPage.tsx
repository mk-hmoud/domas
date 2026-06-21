import { useEffect, useState } from "react";
import { PageHeader, PageShell, LabelValue } from "@domas/ui";
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
  IconDownload,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { dormCertificates } from "@domas/api-client";
import {
  DormCertificateRequest,
  DormCertificateRequestStatus,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS: Record<DormCertificateRequestStatus, string> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

export function SharedDormCertificatesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("students.review_applications");

  const [requests, setRequests] = useState<DormCertificateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    DormCertificateRequestStatus | "all"
  >("pending");
  const [selected, setSelected] = useState<DormCertificateRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await dormCertificates.listAll(
        statusFilter !== "all"
          ? (statusFilter as DormCertificateRequestStatus)
          : undefined,
      );
      setRequests(result);
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

  const handleApprove = async (req: DormCertificateRequest) => {
    setActionLoading(true);
    try {
      await dormCertificates.approve(req.id);
      notifications.show({
        title: t("success"),
        message: t("certificate_issued", "Certificate issued successfully"),
        color: "green",
      });
      setSelected(null);
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

  const handleReject = async (req: DormCertificateRequest) => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await dormCertificates.reject(req.id, rejectReason.trim());
      notifications.show({
        title: t("success"),
        message: t("request_rejected", "Request rejected"),
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
      <PageHeader title={t("dorm_certificates", "Dorm Certificates")} />
      <PageShell>
        <Group mb="md">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as any) ?? "all")}
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
                  <Table.Th>{t("requested_at", "Requested")}</Table.Th>
                  <Table.Th>{t("status")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.length === 0 && !loading && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text ta="center" c="dimmed" py="lg" size="sm">
                        {t("no_requests", "No requests found")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {requests.map((req: any) => (
                  <Table.Tr
                    key={req.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(req)}
                  >
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {req.studentNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>{req.studentName}</Table.Td>
                    <Table.Td>
                      {new Date(req.requestedAt).toLocaleDateString("en-GB")}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          STATUS_COLORS[
                            req.status as DormCertificateRequestStatus
                          ]
                        }
                        size="sm"
                      >
                        {t(`cert_status_${req.status}`, {
                          defaultValue: req.status,
                        })}
                      </Badge>
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      {req.status === "pending" && canManage && (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label={t("approve", "Approve")}>
                            <ActionIcon
                              color="green"
                              variant="light"
                              size="sm"
                              loading={actionLoading}
                              onClick={() => handleApprove(req)}
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
                                setSelected(req);
                                setShowRejectInput(true);
                              }}
                            >
                              <IconX size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                      {req.status === "approved" && req.certificateUrl && (
                        <Tooltip
                          label={t(
                            "download_certificate",
                            "Download Certificate",
                          )}
                        >
                          <ActionIcon
                            variant="light"
                            size="sm"
                            onClick={() =>
                              window.open(req.certificateUrl, "_blank")
                            }
                          >
                            <IconDownload size={14} />
                          </ActionIcon>
                        </Tooltip>
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
        title={t("request_details", "Request Details")}
        position="right"
        size="md"
      >
        {selected && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700} size="lg">
                {(selected as any).studentName ?? selected.studentId}
              </Text>
              <Badge color={STATUS_COLORS[selected.status]}>
                {t(`cert_status_${selected.status}`, {
                  defaultValue: selected.status,
                })}
              </Badge>
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

            <LabelValue label={t("student_number")}>
              {(selected as any).studentNumber ?? "-"}
            </LabelValue>
            <LabelValue label={t("requested_at", "Requested")}>
              {new Date(selected.requestedAt).toLocaleString("en-GB")}
            </LabelValue>

            {(selected as any).enrollmentCertUrl && (
              <>
                <Divider />
                <Button
                  leftSection={<IconExternalLink size={16} />}
                  variant="light"
                  onClick={() =>
                    window.open((selected as any).enrollmentCertUrl, "_blank")
                  }
                >
                  {t("view_enrollment_cert", "View Enrollment Certificate")}
                </Button>
              </>
            )}

            {selected.status === "approved" && selected.certificateUrl && (
              <>
                <Divider />
                <Button
                  leftSection={<IconDownload size={16} />}
                  variant="light"
                  color="green"
                  onClick={() => window.open(selected.certificateUrl, "_blank")}
                >
                  {t(
                    "download_issued_certificate",
                    "Download Issued Certificate",
                  )}
                </Button>
              </>
            )}

            {selected.status === "pending" && canManage && (
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
                        "Explain why…",
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
