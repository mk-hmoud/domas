import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Paper,
  LoadingOverlay,
  Tabs,
  Badge,
  Box,
  Textarea,
  Alert,
  Divider,
  ThemeIcon,
  Select,
} from "@mantine/core";
import {
  IconArrowsExchange,
  IconCheck,
  IconX,
  IconClock,
  IconHistory,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { roomChanges, semesters } from "@domas/api-client";
import { RoomChangeRequestView, Semester } from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

export function SharedRoomChangesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [requests, setRequests] = useState<RoomChangeRequestView[]>([]);
  const [loading, setLoading] = useState(false);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [filterSemesterId, setFilterSemesterId] = useState<string | null>(null);

  // Resolve drawer
  const [selected, setSelected] = useState<RoomChangeRequestView | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async (semesterId?: number) => {
    setLoading(true);
    try {
      const data = await roomChanges.getAll(
        semesterId ? { semesterId } : undefined,
      );
      setRequests(data);
    } catch {
      notifications.show({ message: t("failed_to_fetch_data"), color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    semesters.findAll({ limit: 100 }).then((res) => setAllSemesters(res.data));
    fetchRequests();
  }, []);

  const handleSemesterFilter = (val: string | null) => {
    setFilterSemesterId(val);
    fetchRequests(val ? parseInt(val, 10) : undefined);
  };

  const pending = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests],
  );
  const resolved = useMemo(
    () => requests.filter((r) => r.status !== "pending"),
    [requests],
  );

  const handleResolve = async (approved: boolean) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await roomChanges.resolve(selected.id, {
        approved,
        rejectionReason: approved ? undefined : rejectionReason || undefined,
      });
      notifications.show({
        message: approved
          ? t("room_change.approved_success")
          : t("room_change.rejected_success"),
        color: approved ? "green" : "orange",
      });
      setSelected(null);
      setRejectionReason("");
      fetchRequests(
        filterSemesterId ? parseInt(filterSemesterId, 10) : undefined,
      );
    } catch (e: any) {
      notifications.show({
        message: e?.response?.data?.message ?? t("room_change.action_error"),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const semesterOptions = allSemesters.map((s) => ({
    value: String(s.id),
    label: s.displayName,
  }));

  const renderCard = (req: RoomChangeRequestView) => {
    const isPending = req.status === "pending";
    const statusColor = isPending
      ? "yellow"
      : req.status === "approved"
        ? "green"
        : "red";

    return (
      <Paper key={req.id} radius="lg" p="md" withBorder>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon
              size={28}
              radius="md"
              variant="light"
              color={statusColor}
            >
              {isPending ? (
                <IconClock size={15} />
              ) : req.status === "approved" ? (
                <IconCheck size={15} />
              ) : (
                <IconX size={15} />
              )}
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={700} lineClamp={1}>
                {req.studentName}
                <Text component="span" size="xs" c="dimmed" fw={400}>
                  {" "}
                  · {req.studentNumber}
                </Text>
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {t("room_change.from_label")}: {req.currentBedLabel} —{" "}
                {req.currentLocationPath}
              </Text>
              <Text size="xs" lineClamp={1}>
                {t("room_change.to_label")}: {req.requestedBedLabel} —{" "}
                {req.requestedLocationPath}
              </Text>
              {req.note && (
                <Text size="xs" c="dimmed" fs="italic" mt={2}>
                  "{req.note}"
                </Text>
              )}
              {req.rejectionReason && (
                <Text size="xs" c="red.7" mt={2}>
                  {req.rejectionReason}
                </Text>
              )}
            </Box>
          </Group>

          <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
            <Badge size="xs" color={statusColor} variant="light">
              {t(`room_change.status_${req.status}`)}
            </Badge>
            <Text size="xs" c="dimmed">
              {new Date(req.createdAt).toLocaleDateString()}
            </Text>
            {isPending && hasPermission("room_changes.manage") && (
              <Button
                size="xs"
                variant="light"
                onClick={() => {
                  setSelected(req);
                  setRejectionReason("");
                }}
              >
                {t("review")}
              </Button>
            )}
          </Stack>
        </Group>
      </Paper>
    );
  };

  return (
    <Container size="lg">
      <Stack gap="lg" pos="relative" pt="xl">
        <LoadingOverlay visible={loading} />

        <Group justify="space-between" align="center">
          <Title order={2}>{t("room_change.page_title")}</Title>
          <Select
            placeholder={t("all_semesters")}
            data={semesterOptions}
            value={filterSemesterId}
            onChange={handleSemesterFilter}
            clearable
            size="sm"
            w={200}
          />
        </Group>

        {/* Review panel */}
        {selected && (
          <Paper
            radius="xl"
            p="lg"
            withBorder
            style={{ borderColor: "var(--mantine-color-blue-4)" }}
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700}>{t("room_change.review_title")}</Text>
                <Button
                  variant="subtle"
                  size="xs"
                  color="gray"
                  onClick={() => setSelected(null)}
                >
                  <IconX size={14} />
                </Button>
              </Group>

              <Divider />

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("room_change.student")}
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.studentName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {selected.studentNumber}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("room_change.semester")}
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.semesterDisplayName}
                  </Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("room_change.current_bed")}
                  </Text>
                  <Text size="sm">{selected.currentBedLabel}</Text>
                  <Text size="xs" c="dimmed">
                    {selected.currentLocationPath}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("room_change.requested_bed")}
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.requestedBedLabel}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {selected.requestedLocationPath}
                  </Text>
                </Box>
              </Group>

              {selected.note && (
                <Alert
                  icon={<IconInfoCircle size={14} />}
                  color="blue"
                  variant="light"
                  radius="md"
                >
                  {selected.note}
                </Alert>
              )}

              <Textarea
                label={t("room_change.rejection_reason_label")}
                placeholder={t("room_change.rejection_reason_placeholder")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.currentTarget.value)}
                autosize
                minRows={2}
                maxRows={3}
                radius="md"
              />

              <Group justify="flex-end" gap="sm">
                <Button
                  variant="light"
                  color="red"
                  onClick={() => handleResolve(false)}
                  loading={actionLoading}
                  leftSection={<IconX size={14} />}
                >
                  {t("room_change.reject")}
                </Button>
                <Button
                  color="green"
                  onClick={() => handleResolve(true)}
                  loading={actionLoading}
                  leftSection={<IconCheck size={14} />}
                >
                  {t("room_change.approve")}
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        <Tabs defaultValue="pending">
          <Tabs.List>
            <Tabs.Tab
              value="pending"
              leftSection={<IconClock size={14} />}
              rightSection={
                pending.length > 0 ? (
                  <Badge size="xs" color="yellow" variant="filled">
                    {pending.length}
                  </Badge>
                ) : undefined
              }
            >
              {t("room_change.tab_pending")}
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
              {t("room_change.tab_history")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending" pt="md">
            {pending.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                {t("room_change.no_pending")}
              </Text>
            ) : (
              <Stack gap="sm">{pending.map(renderCard)}</Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            {resolved.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                {t("room_change.no_history")}
              </Text>
            ) : (
              <Stack gap="sm">{resolved.map(renderCard)}</Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
