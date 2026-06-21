import { Paper, Group, Stack, Text, Badge } from "@mantine/core";
import { IconMapPin, IconUser, IconCalendar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  WorkOrderView,
  WorkOrderStatus,
  WorkOrderPriority,
} from "@domas/ts-types";

interface WorkOrderCardProps {
  workOrder: WorkOrderView;
  onClick: () => void;
}

export function getWorkOrderStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case WorkOrderStatus.PENDING:
      return "gray";
    case WorkOrderStatus.ASSIGNED:
      return "blue";
    case WorkOrderStatus.IN_PROGRESS:
      return "yellow";
    case WorkOrderStatus.COMPLETED:
      return "green";
    case WorkOrderStatus.CANCELLED:
      return "red";
    default:
      return "gray";
  }
}

export function getWorkOrderPriorityColor(priority: WorkOrderPriority): string {
  switch (priority) {
    case WorkOrderPriority.LOW:
      return "gray";
    case WorkOrderPriority.MEDIUM:
      return "blue";
    case WorkOrderPriority.HIGH:
      return "orange";
    case WorkOrderPriority.URGENT:
      return "red";
    default:
      return "gray";
  }
}

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  const { t } = useTranslation();

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className="domas-work-order-card"
    >
      <Stack gap={8}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={600} size="sm" lineClamp={2} style={{ flex: 1 }}>
            {workOrder.title}
          </Text>
          <Badge
            color={getWorkOrderPriorityColor(workOrder.priority)}
            variant="light"
            size="sm"
          >
            {t(`work_order_priority.${workOrder.priority}`)}
          </Badge>
        </Group>

        <Group gap={6} wrap="nowrap">
          <IconMapPin size={14} opacity={0.6} />
          <Text size="xs" c="dimmed" truncate>
            {workOrder.locationPath || workOrder.locationName}
          </Text>
        </Group>

        <Group gap={6} wrap="nowrap">
          <IconUser size={14} opacity={0.6} />
          <Text size="xs" c="dimmed" truncate>
            {workOrder.assignedToName || t("unassigned")}
          </Text>
        </Group>

        {workOrder.dueDate && (
          <Group gap={6} wrap="nowrap">
            <IconCalendar size={14} opacity={0.6} />
            <Text size="xs" c="dimmed">
              {new Date(workOrder.dueDate).toLocaleDateString()}
            </Text>
          </Group>
        )}

        <Group justify="flex-end" mt={4}>
          <Badge
            color={getWorkOrderStatusColor(workOrder.status)}
            variant="filled"
            size="sm"
          >
            {t(`work_order_status.${workOrder.status}`)}
          </Badge>
        </Group>
      </Stack>
    </Paper>
  );
}
