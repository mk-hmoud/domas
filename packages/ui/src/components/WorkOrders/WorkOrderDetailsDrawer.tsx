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
  IconTool,
  IconPlayerPlay,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  WorkOrderView,
  WorkOrderStatus,
  AssignableTechnician,
} from "@domas/ts-types";
import { LabelValue } from "../LabelValue";
import {
  getWorkOrderStatusColor,
  getWorkOrderPriorityColor,
} from "./WorkOrderCard";

const CLOSED_STATUSES = [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED];

interface WorkOrderDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  workOrder: WorkOrderView | null;
  canManage?: boolean;
  canUpdate?: boolean;
  technicians?: AssignableTechnician[];
  loading?: boolean;
  onAssign?: (id: string, assignedTo: string) => Promise<void>;
  onUpdateStatus?: (
    id: string,
    status: WorkOrderStatus,
    completionNotes?: string,
  ) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

export function WorkOrderDetailsDrawer({
  opened,
  onClose,
  workOrder,
  canManage,
  canUpdate,
  technicians = [],
  loading,
  onAssign,
  onUpdateStatus,
  onCancel,
}: WorkOrderDetailsDrawerProps) {
  const { t } = useTranslation();
  const [assignTo, setAssignTo] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  useEffect(() => {
    setAssignTo(workOrder?.assignedTo ?? null);
    setCompletionNotes("");
  }, [workOrder]);

  if (!workOrder) {
    return (
      <Drawer opened={opened} onClose={onClose} position="right" size="md">
        {null}
      </Drawer>
    );
  }

  const isClosed = CLOSED_STATUSES.includes(workOrder.status);
  const canStart =
    canUpdate &&
    !isClosed &&
    (workOrder.status === WorkOrderStatus.PENDING ||
      workOrder.status === WorkOrderStatus.ASSIGNED);
  const canComplete =
    canUpdate && workOrder.status === WorkOrderStatus.IN_PROGRESS;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconTool size={18} color="var(--mantine-color-blue-filled)" />
          <Text fw={700} size="sm">
            {t("work_order_details")}
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
              {workOrder.title}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(workOrder.createdAt).toLocaleString()}
            </Text>
          </Stack>
          <Badge
            color={getWorkOrderStatusColor(workOrder.status)}
            variant="light"
            size="lg"
          >
            {t(`work_order_status.${workOrder.status}`)}
          </Badge>
        </Group>

        <Divider />

        <Stack gap="md">
          {workOrder.description && (
            <LabelValue label={t("description")}>
              {workOrder.description}
            </LabelValue>
          )}

          <Group grow>
            <LabelValue label={t("location")}>
              {workOrder.locationPath || workOrder.locationName}
            </LabelValue>
            <LabelValue label={t("priority")}>
              <Badge
                color={getWorkOrderPriorityColor(workOrder.priority)}
                variant="light"
              >
                {t(`work_order_priority.${workOrder.priority}`)}
              </Badge>
            </LabelValue>
          </Group>

          <Group grow>
            <LabelValue label={t("assigned_to")}>
              {workOrder.assignedToName || t("unassigned")}
            </LabelValue>
            <LabelValue label={t("created_by")}>
              {workOrder.createdByName}
            </LabelValue>
          </Group>

          {workOrder.dueDate && (
            <LabelValue label={t("due_date")}>
              {new Date(workOrder.dueDate).toLocaleDateString()}
            </LabelValue>
          )}

          {workOrder.completionNotes && (
            <LabelValue label={t("completion_notes")}>
              {workOrder.completionNotes}
            </LabelValue>
          )}
        </Stack>

        {canManage && !isClosed && (
          <>
            <Divider label={t("reassign_technician")} labelPosition="left" />
            <Group align="flex-end">
              <Select
                style={{ flex: 1 }}
                placeholder={t("select_technician")}
                data={technicians.map((tech) => ({
                  value: tech.id,
                  label: `${tech.firstName} ${tech.lastName}`,
                }))}
                searchable
                value={assignTo}
                onChange={setAssignTo}
              />
              <Button
                disabled={!assignTo || assignTo === workOrder.assignedTo}
                loading={loading}
                onClick={() => assignTo && onAssign?.(workOrder.id, assignTo)}
              >
                {t("assign_technician")}
              </Button>
            </Group>
          </>
        )}

        {canComplete && (
          <>
            <Divider />
            <Textarea
              label={t("completion_notes")}
              placeholder={t("completion_notes_placeholder")}
              minRows={2}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.currentTarget.value)}
            />
          </>
        )}

        {(canStart || canComplete || (canManage && !isClosed)) && (
          <Group grow mt="md">
            {canManage && !isClosed && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconX size={16} />}
                loading={loading}
                onClick={() => onCancel?.(workOrder.id)}
              >
                {t("cancel_work_order")}
              </Button>
            )}
            {canStart && (
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                loading={loading}
                onClick={() =>
                  onUpdateStatus?.(workOrder.id, WorkOrderStatus.IN_PROGRESS)
                }
              >
                {t("start_work")}
              </Button>
            )}
            {canComplete && (
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                loading={loading}
                onClick={() =>
                  onUpdateStatus?.(
                    workOrder.id,
                    WorkOrderStatus.COMPLETED,
                    completionNotes,
                  )
                }
              >
                {t("complete_work")}
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Drawer>
  );
}
