import { useState, useEffect, useMemo } from "react";
import { PageHeader, PageShell, EmptyState } from "@domas/ui";
import {
  Stack,
  Group,
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
  Drawer,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconClock,
  IconHistory,
  IconInfoCircle,
  IconCalendarCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { preReservations, semesters } from "@domas/api-client";
import {
  PreReservationView,
  Semester,
  StaffAvailableBed,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

export function SharedPreReservationsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [items, setItems] = useState<PreReservationView[]>([]);
  const [loading, setLoading] = useState(false);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [filterSemesterId, setFilterSemesterId] = useState<string | null>(null);

  // Review drawer
  const [selected, setSelected] = useState<PreReservationView | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignedBedId, setAssignedBedId] = useState<string | null>(null);
  const [availableBeds, setAvailableBeds] = useState<StaffAvailableBed[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async (semesterId?: number) => {
    setLoading(true);
    try {
      const data = await preReservations.getAll(
        semesterId ? { semesterId } : undefined,
      );
      setItems(data);
    } catch {
      notifications.show({ message: t("failed_to_fetch_data"), color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    semesters.findAll({ limit: 100 }).then((res) => setAllSemesters(res.data));
    fetchItems();
  }, []);

  const handleSemesterFilter = (val: string | null) => {
    setFilterSemesterId(val);
    fetchItems(val ? parseInt(val, 10) : undefined);
  };

  const pending = useMemo(
    () => items.filter((r) => r.status === "pending"),
    [items],
  );
  const resolved = useMemo(
    () => items.filter((r) => r.status !== "pending"),
    [items],
  );

  const openDrawer = (item: PreReservationView) => {
    setSelected(item);
    setRejectionReason("");
    setAssignedBedId(null);
    setBedsLoading(true);
    preReservations
      .getAvailableBeds(item.semesterId, item.startDate, item.endDate)
      .then(setAvailableBeds)
      .catch(() =>
        notifications.show({
          message: t("failed_to_fetch_data"),
          color: "red",
        }),
      )
      .finally(() => setBedsLoading(false));
  };

  const handleAssign = async () => {
    if (!selected || !assignedBedId) return;
    setActionLoading(true);
    try {
      await preReservations.assign(selected.id, {
        bedId: parseInt(assignedBedId, 10),
      });
      notifications.show({
        message: t("pre_reservation.assigned_success", {
          defaultValue: "Bed assigned and booking created.",
        }),
        color: "green",
      });
      setSelected(null);
      fetchItems(filterSemesterId ? parseInt(filterSemesterId, 10) : undefined);
    } catch (e: any) {
      notifications.show({
        message:
          e?.response?.data?.message ??
          t("pre_reservation.action_error", { defaultValue: "Action failed" }),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await preReservations.reject(selected.id, {
        rejectionReason: rejectionReason || undefined,
      });
      notifications.show({
        message: t("pre_reservation.rejected_success", {
          defaultValue: "Pre-reservation rejected.",
        }),
        color: "orange",
      });
      setSelected(null);
      fetchItems(filterSemesterId ? parseInt(filterSemesterId, 10) : undefined);
    } catch (e: any) {
      notifications.show({
        message:
          e?.response?.data?.message ??
          t("pre_reservation.action_error", { defaultValue: "Action failed" }),
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

  const statusColor = (status: string) => {
    if (status === "pending") return "yellow";
    if (status === "assigned") return "green";
    return "red";
  };

  const renderCard = (item: PreReservationView) => {
    const isPending = item.status === "pending";
    const color = statusColor(item.status);
    const borderColor = isPending
      ? "var(--mantine-color-yellow-filled)"
      : item.status === "assigned"
        ? "var(--mantine-color-green-filled)"
        : "var(--mantine-color-red-filled)";

    return (
      <Paper
        key={item.id}
        radius="md"
        p="md"
        withBorder
        style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon size={28} radius="md" variant="light" color={color}>
              {isPending ? (
                <IconClock size={15} />
              ) : item.status === "assigned" ? (
                <IconCheck size={15} />
              ) : (
                <IconX size={15} />
              )}
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={700} lineClamp={1}>
                {item.studentName}
                <Text component="span" size="xs" c="dimmed" fw={400}>
                  {" "}
                  · {item.studentNumber}
                </Text>
              </Text>
              <Text size="xs" c="dimmed">
                {item.semesterDisplayName} ·{" "}
                {new Date(item.startDate).toLocaleDateString()} –{" "}
                {new Date(item.endDate).toLocaleDateString()}
              </Text>
              {item.roomTypeName && (
                <Text size="xs" c="blue">
                  {t("pre_reservation.preferred_type", {
                    defaultValue: "Preferred: ",
                  })}
                  {item.roomTypeName}
                </Text>
              )}
              {item.note && (
                <Text size="xs" c="dimmed" fs="italic" mt={2}>
                  "{item.note}"
                </Text>
              )}
              {item.rejectionReason && (
                <Text size="xs" c="red.7" mt={2}>
                  {item.rejectionReason}
                </Text>
              )}
            </Box>
          </Group>

          <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
            <Badge size="xs" color={color} variant="light">
              {t(`pre_reservation.status_${item.status}`, {
                defaultValue: item.status,
              })}
            </Badge>
            <Text size="xs" c="dimmed">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {isPending && hasPermission("pre_reservations.manage") && (
              <Button
                size="xs"
                variant="light"
                onClick={() => openDrawer(item)}
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
    <>
      <PageHeader
        title={t("pre_reservation.page_title", {
          defaultValue: "Pre-Reservations",
        })}
        actions={
          <Select
            placeholder={t("all_semesters")}
            data={semesterOptions}
            value={filterSemesterId}
            onChange={handleSemesterFilter}
            clearable
            w={200}
          />
        }
      />
      <PageShell>
        <Stack gap="lg" pos="relative">
          <LoadingOverlay visible={loading} />

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
                {t("pre_reservation.tab_pending", { defaultValue: "Pending" })}
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
                {t("pre_reservation.tab_history", { defaultValue: "History" })}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="pending" pt="md">
              {pending.length === 0 ? (
                <EmptyState
                  title={t("pre_reservation.no_pending", {
                    defaultValue: "No pending pre-reservations",
                  })}
                />
              ) : (
                <Stack gap="sm">{pending.map(renderCard)}</Stack>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="md">
              {resolved.length === 0 ? (
                <EmptyState
                  title={t("pre_reservation.no_history", {
                    defaultValue: "No resolved pre-reservations",
                  })}
                />
              ) : (
                <Stack gap="sm">{resolved.map(renderCard)}</Stack>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </PageShell>

      <Drawer
        opened={!!selected}
        onClose={() => {
          setSelected(null);
          setRejectionReason("");
          setAssignedBedId(null);
          setAvailableBeds([]);
        }}
        title={
          <Group gap="xs">
            <IconCalendarCheck size={16} />
            <Text fw={700}>
              {t("pre_reservation.review_title", {
                defaultValue: "Assign Pre-Reservation",
              })}
            </Text>
          </Group>
        }
        position="right"
        size="md"
      >
        {selected && (
          <Stack gap="md">
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
                  {t("pre_reservation.period", { defaultValue: "Period" })}
                </Text>
                <Text size="sm">
                  {new Date(selected.startDate).toLocaleDateString()} –{" "}
                  {new Date(selected.endDate).toLocaleDateString()}
                </Text>
              </Box>
              {selected.roomTypeName && (
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("pre_reservation.preferred_type", {
                      defaultValue: "Preferred type",
                    })}
                  </Text>
                  <Text size="sm" c="blue" fw={500}>
                    {selected.roomTypeName}
                  </Text>
                </Box>
              )}
            </Group>

            <Divider />

            <Select
              label={t("room_change.assign_bed_label")}
              placeholder={t("room_change.assign_bed_placeholder")}
              data={availableBeds.map((b) => ({
                value: String(b.id),
                label: `${b.label} — ${b.locationPath}`,
              }))}
              value={assignedBedId}
              onChange={setAssignedBedId}
              disabled={bedsLoading}
              searchable
              required
              withAsterisk
            />

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

            <Divider />

            <Textarea
              label={t("room_change.rejection_reason_label")}
              placeholder={t("room_change.rejection_reason_placeholder")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.currentTarget.value)}
              autosize
              minRows={2}
              maxRows={4}
              radius="md"
            />

            <Group grow mt="xs">
              <Button
                variant="light"
                color="red"
                onClick={handleReject}
                loading={actionLoading}
                leftSection={<IconX size={14} />}
              >
                {t("room_change.reject")}
              </Button>
              <Button
                color="green"
                onClick={handleAssign}
                loading={actionLoading}
                disabled={!assignedBedId}
                leftSection={<IconCheck size={14} />}
              >
                {t("pre_reservation.assign_bed", {
                  defaultValue: "Assign Bed",
                })}
              </Button>
            </Group>
          </Stack>
        )}
      </Drawer>
    </>
  );
}
