import { useEffect, useState } from "react";
import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Button,
  Select,
  Textarea,
} from "@mantine/core";
import {
  IconMessageReport,
  IconCheck,
  IconX,
  IconArrowForwardUp,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  TicketView,
  TicketStatus,
  AssignableTechnician,
  WorkOrderPriority,
} from "@domas/ts-types";
import { LabelValue } from "../LabelValue";
import { getTicketStatusColor } from "./TicketTable";
import { getWorkOrderStatusColor } from "../WorkOrders/WorkOrderCard";

interface TicketDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  ticket: TicketView | null;
  canTriage?: boolean;
  technicians?: AssignableTechnician[];
  loading?: boolean;
  onResolve?: (id: string, resolutionNotes: string) => Promise<void>;
  onReject?: (id: string, rejectionReason: string) => Promise<void>;
  onEscalate?: (
    id: string,
    assignedTo?: string,
    priority?: WorkOrderPriority,
  ) => Promise<void>;
}

type Action = "resolve" | "reject" | "escalate" | null;

export function TicketDetailsDrawer({
  opened,
  onClose,
  ticket,
  canTriage,
  technicians = [],
  loading,
  onResolve,
  onReject,
  onEscalate,
}: TicketDetailsDrawerProps) {
  const { t } = useTranslation();
  const [action, setAction] = useState<Action>(null);
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [priority, setPriority] = useState<WorkOrderPriority | null>(
    WorkOrderPriority.MEDIUM,
  );

  useEffect(() => {
    setAction(null);
    setNotes("");
    setAssignedTo(null);
    setPriority(WorkOrderPriority.MEDIUM);
  }, [ticket]);

  if (!ticket) {
    return (
      <Drawer opened={opened} onClose={onClose} position="right" size="md">
        {null}
      </Drawer>
    );
  }

  const isOpen = ticket.status === TicketStatus.OPEN;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMessageReport
            size={18}
            color="var(--mantine-color-orange-filled)"
          />
          <Text fw={700} size="sm">
            {t("ticket_details")}
          </Text>
        </Group>
      }
      position="right"
      size="md"
    >
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text fw={700} size="md">
              {ticket.title}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(ticket.createdAt).toLocaleString()}
            </Text>
          </Stack>
          <Badge
            color={getTicketStatusColor(ticket.status)}
            variant="light"
            size="lg"
          >
            {t(`ticket_status.${ticket.status}`)}
          </Badge>
        </Group>

        <Divider />

        <Stack gap="md">
          <LabelValue label={t("description")}>{ticket.description}</LabelValue>

          <Group grow>
            <LabelValue label={t("student")}>{ticket.studentName}</LabelValue>
            <LabelValue label={t("category")}>
              {t(`ticket_category.${ticket.category}`)}
            </LabelValue>
          </Group>

          <LabelValue label={t("location")}>
            {ticket.locationPath || ticket.locationName}
          </LabelValue>

          {ticket.status === TicketStatus.REJECTED &&
            ticket.rejectionReason && (
              <LabelValue label={t("rejection_reason")}>
                {ticket.rejectionReason}
              </LabelValue>
            )}

          {ticket.status === TicketStatus.RESOLVED &&
            ticket.resolutionNotes && (
              <LabelValue label={t("resolution_notes")}>
                {ticket.resolutionNotes}
              </LabelValue>
            )}

          {ticket.workOrderId && (
            <>
              <Divider label={t("linked_work_order")} labelPosition="left" />
              <Group justify="space-between">
                <LabelValue label={t("assigned_to")}>
                  {ticket.workOrderAssignedToName || t("unassigned")}
                </LabelValue>
                {ticket.workOrderStatus && (
                  <Badge
                    color={getWorkOrderStatusColor(ticket.workOrderStatus)}
                    variant="light"
                  >
                    {t(`work_order_status.${ticket.workOrderStatus}`)}
                  </Badge>
                )}
              </Group>
            </>
          )}
        </Stack>

        {canTriage && isOpen && (
          <>
            <Divider />

            {action === null && (
              <Group grow>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={() => setAction("reject")}
                >
                  {t("reject")}
                </Button>
                <Button
                  variant="light"
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => setAction("resolve")}
                >
                  {t("resolve")}
                </Button>
                <Button
                  leftSection={<IconArrowForwardUp size={16} />}
                  onClick={() => setAction("escalate")}
                >
                  {t("escalate_to_technician")}
                </Button>
              </Group>
            )}

            {action === "reject" && (
              <Stack gap="sm">
                <Textarea
                  label={t("rejection_reason")}
                  placeholder={t("rejection_reason_placeholder")}
                  minRows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.currentTarget.value)}
                  autoFocus
                />
                <Group grow>
                  <Button variant="default" onClick={() => setAction(null)}>
                    {t("cancel")}
                  </Button>
                  <Button
                    color="red"
                    disabled={notes.trim().length < 3}
                    loading={loading}
                    onClick={() => onReject?.(ticket.id, notes)}
                  >
                    {t("reject_ticket")}
                  </Button>
                </Group>
              </Stack>
            )}

            {action === "resolve" && (
              <Stack gap="sm">
                <Textarea
                  label={t("resolution_notes")}
                  placeholder={t("resolution_notes_placeholder")}
                  minRows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.currentTarget.value)}
                  autoFocus
                />
                <Group grow>
                  <Button variant="default" onClick={() => setAction(null)}>
                    {t("cancel")}
                  </Button>
                  <Button
                    color="green"
                    disabled={notes.trim().length < 3}
                    loading={loading}
                    onClick={() => onResolve?.(ticket.id, notes)}
                  >
                    {t("resolve_directly")}
                  </Button>
                </Group>
              </Stack>
            )}

            {action === "escalate" && (
              <Stack gap="sm">
                <Select
                  label={t("assign_technician")}
                  placeholder={t("select_technician")}
                  data={technicians.map((tech) => ({
                    value: tech.id,
                    label: `${tech.firstName} ${tech.lastName}`,
                  }))}
                  searchable
                  clearable
                  value={assignedTo}
                  onChange={setAssignedTo}
                />
                <Select
                  label={t("priority")}
                  data={Object.values(WorkOrderPriority).map((p) => ({
                    value: p,
                    label: t(`work_order_priority.${p}`),
                  }))}
                  value={priority}
                  onChange={(val) => setPriority(val as WorkOrderPriority)}
                />
                <Group grow>
                  <Button variant="default" onClick={() => setAction(null)}>
                    {t("cancel")}
                  </Button>
                  <Button
                    loading={loading}
                    onClick={() =>
                      onEscalate?.(
                        ticket.id,
                        assignedTo ?? undefined,
                        priority ?? undefined,
                      )
                    }
                  >
                    {t("escalate_to_technician")}
                  </Button>
                </Group>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Drawer>
  );
}
