import { useEffect, useState } from "react";
import { PageHeader, PageShell, EmptyState } from "@domas/ui";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCheck,
  IconDoorEnter,
  IconDoorExit,
  IconDotsVertical,
  IconEdit,
  IconSearch,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  guests as guestsApi,
  guestStays as guestStaysApi,
} from "@domas/api-client";
import { Guest, GuestStay, GuestStayStatus } from "@domas/ts-types";
import { HierarchicalBedSelector } from "@domas/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StayFormValues {
  // Guest section
  guestId: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  phone: string;
  guestNotes: string;
  reuseExisting: boolean;
  // Stay section
  bedId: number | null;
  checkInDate: string;
  checkOutDate: string;
  paymentRequired: boolean;
  amountDue: number | string;
  currency: string;
  paymentNotes: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: GuestStayStatus): string {
  switch (status) {
    case GuestStayStatus.ACTIVE:
      return "green";
    case GuestStayStatus.COMPLETED:
      return "blue";
    case GuestStayStatus.CANCELLED:
      return "red";
    default:
      return "yellow";
  }
}

function statusBorderColor(status: GuestStayStatus): string {
  switch (status) {
    case GuestStayStatus.ACTIVE:
      return "var(--mantine-color-green-filled)";
    case GuestStayStatus.COMPLETED:
      return "var(--mantine-color-blue-filled)";
    case GuestStayStatus.CANCELLED:
      return "var(--mantine-color-gray-4)";
    default:
      return "var(--mantine-color-yellow-filled)";
  }
}

function paymentBadge(stay: GuestStay) {
  if (!stay.paymentRequired) return null;
  const paid = Number(stay.amountPaid ?? 0);
  const due = Number(stay.amountDue ?? 0);
  if (paid >= due && due > 0) return { label: "Paid", color: "green" };
  if (paid > 0) return { label: "Partial", color: "orange" };
  return { label: "Unpaid", color: "red" };
}

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

function StayModal({
  opened,
  onClose,
  onSaved,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: GuestStay | null;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);

  const isEdit = !!initial;

  const form = useForm<StayFormValues>({
    initialValues: {
      guestId: "",
      firstName: "",
      lastName: "",
      idNumber: "",
      email: "",
      phone: "",
      guestNotes: "",
      reuseExisting: false,
      bedId: null,
      checkInDate: "",
      checkOutDate: "",
      paymentRequired: false,
      amountDue: "",
      currency: "TRY",
      paymentNotes: "",
      notes: "",
    },
    validate: {
      firstName: (v, vals) =>
        !vals.reuseExisting && !v.trim() ? t("field_required") : null,
      lastName: (v, vals) =>
        !vals.reuseExisting && !v.trim() ? t("field_required") : null,
      guestId: (v, vals) =>
        vals.reuseExisting && !v ? t("field_required") : null,
      bedId: (v) => (!v ? t("field_required") : null),
      checkInDate: (v) => (!v ? t("field_required") : null),
      checkOutDate: (v, vals) => {
        if (!v) return t("field_required");
        if (vals.checkInDate && v <= vals.checkInDate)
          return t("checkout_after_checkin", {
            defaultValue: "Check-out must be after check-in",
          });
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      setFoundGuest(null);
      if (initial) {
        form.setValues({
          guestId: initial.guestId,
          firstName: initial.guest.firstName,
          lastName: initial.guest.lastName,
          idNumber: initial.guest.idNumber ?? "",
          email: initial.guest.email ?? "",
          phone: initial.guest.phone ?? "",
          guestNotes: "",
          reuseExisting: false,
          bedId: initial.bedId,
          checkInDate: initial.checkInDate,
          checkOutDate: initial.checkOutDate,
          paymentRequired: initial.paymentRequired,
          amountDue: initial.amountDue ?? "",
          currency: initial.currency ?? "TRY",
          paymentNotes: initial.paymentNotes ?? "",
          notes: initial.notes ?? "",
        });
      } else {
        form.reset();
      }
    }
  }, [opened, initial]);

  const handleIdNumberSearch = async () => {
    if (!form.values.idNumber.trim()) return;
    setSearching(true);
    try {
      const g = await guestsApi.findByIdNumber(form.values.idNumber.trim());
      if (g) {
        setFoundGuest(g);
        form.setValues({
          guestId: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email ?? "",
          phone: g.phone ?? "",
          reuseExisting: true,
        });
      } else {
        setFoundGuest(null);
        form.setFieldValue("reuseExisting", false);
        form.setFieldValue("guestId", "");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (values: StayFormValues) => {
    setLoading(true);
    try {
      if (isEdit) {
        await guestStaysApi.update(initial!.id, {
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          paymentRequired: values.paymentRequired,
          amountDue:
            values.amountDue !== "" ? Number(values.amountDue) : undefined,
          currency: values.currency || undefined,
          paymentNotes: values.paymentNotes || undefined,
          notes: values.notes || undefined,
        });
        notifications.show({
          color: "green",
          message: t("saved_successfully", { defaultValue: "Saved" }),
        });
      } else {
        // Create or reuse guest
        let guestId = values.guestId;
        if (!values.reuseExisting) {
          const g = await guestsApi.create({
            firstName: values.firstName,
            lastName: values.lastName,
            idNumber: values.idNumber || undefined,
            email: values.email || undefined,
            phone: values.phone || undefined,
            notes: values.guestNotes || undefined,
          });
          guestId = g.id;
        }
        await guestStaysApi.create({
          guestId,
          bedId: values.bedId!,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          paymentRequired: values.paymentRequired,
          amountDue:
            values.amountDue !== "" ? Number(values.amountDue) : undefined,
          currency: values.currency || undefined,
          paymentNotes: values.paymentNotes || undefined,
          notes: values.notes || undefined,
        });
        notifications.show({
          color: "green",
          message: t("created_successfully", { defaultValue: "Created" }),
        });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? t("error");
      notifications.show({ color: "red", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit
          ? t("edit_guest_stay", { defaultValue: "Edit Stay" })
          : t("new_guest_stay", { defaultValue: "New Guest Stay" })
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Guest section — hidden in edit mode */}
          {!isEdit && (
            <>
              <Text fw={600} size="sm">
                {t("guest_info", { defaultValue: "Guest Information" })}
              </Text>

              {/* ID number lookup */}
              <Group align="flex-end" gap="xs">
                <TextInput
                  label={t("id_number", {
                    defaultValue: "ID / Passport Number",
                  })}
                  style={{ flex: 1 }}
                  {...form.getInputProps("idNumber")}
                />
                <Button
                  variant="default"
                  leftSection={<IconSearch size={14} />}
                  loading={searching}
                  onClick={handleIdNumberSearch}
                >
                  {t("lookup", { defaultValue: "Lookup" })}
                </Button>
              </Group>

              {foundGuest && (
                <Group
                  gap="xs"
                  p="xs"
                  style={{
                    background: "var(--mantine-color-green-light)",
                    borderRadius: 8,
                  }}
                >
                  <IconCheck
                    size={14}
                    color="var(--mantine-color-green-filled)"
                  />
                  <Text size="sm" c="green">
                    {t("existing_guest_found", {
                      defaultValue: "Existing guest found",
                    })}
                    : {foundGuest.firstName} {foundGuest.lastName}
                  </Text>
                </Group>
              )}

              <Group grow>
                <TextInput
                  label={t("first_name")}
                  required={!form.values.reuseExisting}
                  disabled={form.values.reuseExisting}
                  {...form.getInputProps("firstName")}
                />
                <TextInput
                  label={t("last_name")}
                  required={!form.values.reuseExisting}
                  disabled={form.values.reuseExisting}
                  {...form.getInputProps("lastName")}
                />
              </Group>
              <Group grow>
                <TextInput
                  label={t("email")}
                  disabled={form.values.reuseExisting}
                  {...form.getInputProps("email")}
                />
                <TextInput
                  label={t("phone")}
                  disabled={form.values.reuseExisting}
                  {...form.getInputProps("phone")}
                />
              </Group>
              {!form.values.reuseExisting && (
                <Textarea
                  label={t("notes")}
                  minRows={2}
                  autosize
                  {...form.getInputProps("guestNotes")}
                />
              )}
              <Divider />
            </>
          )}

          {/* Stay section */}
          <Text fw={600} size="sm">
            {t("stay_details", { defaultValue: "Stay Details" })}
          </Text>

          {!isEdit && (
            <HierarchicalBedSelector
              value={form.values.bedId ?? undefined}
              onChange={(id) => form.setFieldValue("bedId", id)}
              error={form.errors.bedId}
            />
          )}

          <Group grow>
            <TextInput
              label={t("check_in_date", { defaultValue: "Check-in Date" })}
              type="date"
              required
              {...form.getInputProps("checkInDate")}
            />
            <TextInput
              label={t("check_out_date", { defaultValue: "Check-out Date" })}
              type="date"
              required
              {...form.getInputProps("checkOutDate")}
            />
          </Group>

          <Switch
            label={t("payment_required", { defaultValue: "Payment required" })}
            checked={form.values.paymentRequired}
            onChange={(e) =>
              form.setFieldValue("paymentRequired", e.currentTarget.checked)
            }
          />

          {form.values.paymentRequired && (
            <Group grow>
              <NumberInput
                label={t("amount_due", { defaultValue: "Amount Due" })}
                min={0}
                decimalScale={2}
                value={
                  form.values.amountDue !== ""
                    ? Number(form.values.amountDue)
                    : undefined
                }
                onChange={(v) => form.setFieldValue("amountDue", v ?? "")}
              />
              <Select
                label={t("currency")}
                data={["TRY", "USD", "EUR", "GBP"]}
                {...form.getInputProps("currency")}
              />
            </Group>
          )}

          {form.values.paymentRequired && (
            <Textarea
              label={t("payment_notes", { defaultValue: "Payment Notes" })}
              minRows={2}
              autosize
              {...form.getInputProps("paymentNotes")}
            />
          )}

          <Textarea
            label={t("notes")}
            minRows={2}
            autosize
            {...form.getInputProps("notes")}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? t("save") : t("create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Stay card ────────────────────────────────────────────────────────────────

function StayCard({
  stay,
  onEdit,
  onRefresh,
}: {
  stay: GuestStay;
  onEdit: (s: GuestStay) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const payment = paymentBadge(stay);

  const confirmAction = (
    label: string,
    message: string,
    action: () => Promise<void>,
  ) => {
    modals.openConfirmModal({
      title: label,
      children: <Text size="sm">{message}</Text>,
      labels: { confirm: label, cancel: t("cancel") },
      onConfirm: async () => {
        try {
          await action();
          onRefresh();
        } catch (e: any) {
          notifications.show({
            color: "red",
            message: e?.response?.data?.message ?? t("error"),
          });
        }
      },
    });
  };

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: statusBorderColor(stay.status),
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Box style={{ flex: 1 }}>
          <Group gap="xs" mb={4}>
            <Text fw={600}>
              {stay.guest.firstName} {stay.guest.lastName}
            </Text>
            {stay.guest.idNumber && (
              <Text size="xs" c="dimmed">
                #{stay.guest.idNumber}
              </Text>
            )}
            <Badge color={statusColor(stay.status)} variant="light" size="sm">
              {t(`guest_status.${stay.status}`, { defaultValue: stay.status })}
            </Badge>
            {payment && (
              <Badge color={payment.color} variant="light" size="sm">
                {t(`payment_${payment.label.toLowerCase()}`, {
                  defaultValue: payment.label,
                })}
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {stay.locationPath} — {stay.roomName},{" "}
            {t("bed_label", {
              defaultValue: "Bed {{label}}",
              label: stay.bedLabel,
            })}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            <IconCalendar
              size={11}
              style={{ marginRight: 3, verticalAlign: "middle" }}
            />
            {new Date(stay.checkInDate).toLocaleDateString()} –{" "}
            {new Date(stay.checkOutDate).toLocaleDateString()}
          </Text>
          {stay.paymentRequired && (
            <Text size="xs" c="dimmed">
              {t("amount_due", { defaultValue: "Due" })}: {stay.amountDue ?? 0}{" "}
              {stay.currency}
              {" · "}
              {t("amount_paid", { defaultValue: "Paid" })}: {stay.amountPaid}{" "}
              {stay.currency}
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {t("created_by", { defaultValue: "By" })} {stay.createdByName}
          </Text>
        </Box>

        <Menu shadow="md" width={180} withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={() => onEdit(stay)}
            >
              {t("edit")}
            </Menu.Item>
            {stay.status === "confirmed" && (
              <Menu.Item
                leftSection={<IconDoorEnter size={14} />}
                onClick={() =>
                  confirmAction(
                    t("check_in", { defaultValue: "Check In" }),
                    t("check_in_confirm", {
                      defaultValue: "Mark guest as checked in?",
                    }),
                    async () => {
                      await guestStaysApi.checkIn(stay.id);
                    },
                  )
                }
              >
                {t("check_in", { defaultValue: "Check In" })}
              </Menu.Item>
            )}
            {stay.status === "active" && (
              <Menu.Item
                leftSection={<IconDoorExit size={14} />}
                onClick={() =>
                  confirmAction(
                    t("check_out", { defaultValue: "Check Out" }),
                    t("check_out_confirm", {
                      defaultValue: "Mark guest as checked out?",
                    }),
                    async () => {
                      await guestStaysApi.checkOut(stay.id);
                    },
                  )
                }
              >
                {t("check_out", { defaultValue: "Check Out" })}
              </Menu.Item>
            )}
            {(stay.status === "confirmed" || stay.status === "active") && (
              <>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconX size={14} />}
                  onClick={() =>
                    confirmAction(
                      t("cancel_stay", { defaultValue: "Cancel Stay" }),
                      t("cancel_stay_confirm", {
                        defaultValue:
                          "Cancel this guest stay? This cannot be undone.",
                      }),
                      async () => {
                        await guestStaysApi.cancel(stay.id);
                      },
                    )
                  }
                >
                  {t("cancel_stay", { defaultValue: "Cancel Stay" })}
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SharedGuestStaysPage() {
  const { t } = useTranslation();
  const [stays, setStays] = useState<GuestStay[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [modalOpened, setModalOpened] = useState(false);
  const [editing, setEditing] = useState<GuestStay | null>(null);

  const load = async (tab = activeTab) => {
    setLoading(true);
    try {
      let data: GuestStay[];
      if (tab === "active") {
        data = await guestStaysApi.findAll({ status: "active" });
        // Also include confirmed (upcoming within today)
        const confirmed = await guestStaysApi.findAll({ status: "confirmed" });
        data = [...data, ...confirmed].sort(
          (a, b) =>
            new Date(a.checkInDate).getTime() -
            new Date(b.checkInDate).getTime(),
        );
      } else if (tab === "upcoming") {
        data = await guestStaysApi.findAll({ upcoming: true });
      } else {
        data = await guestStaysApi.findAll();
      }
      setStays(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTabChange = (tab: string | null) => {
    if (!tab) return;
    setActiveTab(tab);
    load(tab);
  };

  return (
    <>
      <PageHeader
        title={t("guest_stays", { defaultValue: "Guest Stays" })}
        actions={
          <Button
            leftSection={<IconUserPlus size={16} />}
            onClick={() => {
              setEditing(null);
              setModalOpened(true);
            }}
          >
            {t("new_guest_stay", { defaultValue: "New Guest Stay" })}
          </Button>
        }
      />
      <PageShell>
        <Tabs value={activeTab} onChange={handleTabChange} mb="md">
          <Tabs.List>
            <Tabs.Tab value="active">
              {t("active_and_upcoming", { defaultValue: "Active & Upcoming" })}
            </Tabs.Tab>
            <Tabs.Tab value="upcoming">
              {t("future_stays", { defaultValue: "Future Stays" })}
            </Tabs.Tab>
            <Tabs.Tab value="all">
              {t("all_stays", { defaultValue: "All Stays" })}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Stack gap="sm" pos="relative">
          <LoadingOverlay visible={loading} />
          {!loading && stays.length === 0 && (
            <EmptyState
              title={t("no_guest_stays", {
                defaultValue: "No guest stays found.",
              })}
            />
          )}
          {stays.map((s) => (
            <StayCard
              key={s.id}
              stay={s}
              onEdit={(stay) => {
                setEditing(stay);
                setModalOpened(true);
              }}
              onRefresh={() => load()}
            />
          ))}
        </Stack>

        <StayModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onSaved={() => load()}
          initial={editing}
        />
      </PageShell>
    </>
  );
}
