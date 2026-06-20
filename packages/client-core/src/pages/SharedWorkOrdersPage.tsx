import { useEffect, useState, useCallback } from "react";
import {
  PageHeader,
  PageShell,
  WorkOrderCard,
  CreateWorkOrderModal,
  WorkOrderDetailsDrawer,
  EmptyState,
} from "@domas/ui";
import {
  Button,
  SimpleGrid,
  LoadingOverlay,
  Group,
  Select,
  Drawer,
  Indicator,
  ActionIcon,
} from "@mantine/core";
import { IconPlus, IconFilter, IconTool } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { workOrders as workOrdersApi } from "@domas/api-client";
import {
  WorkOrderView,
  AssignableTechnician,
  WorkOrderStatus,
  WorkOrderPriority,
  CreateWorkOrderDto,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useAuth } from "../context/AuthContext";

export function SharedWorkOrdersPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("work_orders.manage");
  const canUpdate = hasPermission("work_orders.update");

  const [workOrderList, setWorkOrderList] = useState<WorkOrderView[]>([]);
  const [technicians, setTechnicians] = useState<AssignableTechnician[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [filterDrawerOpened, setFilterDrawerOpened] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] =
    useState<WorkOrderView | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | null>(
    null,
  );
  const [priorityFilter, setPriorityFilter] =
    useState<WorkOrderPriority | null>(null);

  const activeFilterCount = [statusFilter, priorityFilter].filter(
    Boolean,
  ).length;

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workOrdersApi.getAll({
        status: statusFilter ?? undefined,
        priority: priorityFilter ?? undefined,
      });
      setWorkOrderList(data);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, t]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  useEffect(() => {
    if (canManage) {
      workOrdersApi
        .getAssignableTechnicians()
        .then(setTechnicians)
        .catch(() => {});
    }
  }, [canManage]);

  const handleViewDetails = (workOrder: WorkOrderView) => {
    setSelectedWorkOrder(workOrder);
    setDrawerOpened(true);
  };

  const applyUpdate = (updated: WorkOrderView) => {
    setWorkOrderList((prev) =>
      prev.map((wo) => (wo.id === updated.id ? updated : wo)),
    );
    setSelectedWorkOrder(updated);
  };

  const handleCreate = async (dto: CreateWorkOrderDto) => {
    setActionLoading(true);
    try {
      await workOrdersApi.create(dto);
      notifications.show({
        title: t("success"),
        message: t("work_order_created"),
        color: "green",
      });
      fetchWorkOrders();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("action_failed", { defaultValue: "Action failed" }),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (id: string, assignedTo: string) => {
    setActionLoading(true);
    try {
      const updated = await workOrdersApi.assign(id, { assignedTo });
      notifications.show({
        title: t("success"),
        message: t("work_order_assigned"),
        color: "green",
      });
      applyUpdate(updated);
      fetchWorkOrders();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("action_failed", { defaultValue: "Action failed" }),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: WorkOrderStatus,
    completionNotes?: string,
  ) => {
    setActionLoading(true);
    try {
      const updated = await workOrdersApi.updateStatus(id, {
        status,
        completionNotes,
      });
      notifications.show({
        title: t("success"),
        message: t("work_order_status_updated"),
        color: "green",
      });
      applyUpdate(updated);
      if (status === WorkOrderStatus.COMPLETED) setDrawerOpened(false);
      fetchWorkOrders();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("action_failed", { defaultValue: "Action failed" }),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    modals.openConfirmModal({
      title: t("cancel_work_order"),
      children: t("cancel_work_order_confirm"),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await workOrdersApi.update(id, {
            status: WorkOrderStatus.CANCELLED,
          });
          notifications.show({
            title: t("success"),
            message: t("work_order_cancelled"),
            color: "green",
          });
          applyUpdate(updated);
          setDrawerOpened(false);
          fetchWorkOrders();
        } catch (error) {
          notifications.show({
            title: t("error"),
            message: t("action_failed", { defaultValue: "Action failed" }),
            color: "red",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <>
      <PageHeader
        title={t("work_orders")}
        subtitle={t("work_orders_description")}
        actions={
          <Group gap="xs">
            <Indicator
              disabled={activeFilterCount === 0}
              label={activeFilterCount}
              size={16}
              color="blue"
            >
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => setFilterDrawerOpened(true)}
                aria-label={t("filters")}
              >
                <IconFilter size={18} />
              </ActionIcon>
            </Indicator>
            {canManage && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpened(true)}
              >
                {t("create_work_order")}
              </Button>
            )}
          </Group>
        }
      />
      <PageShell>
        <div style={{ position: "relative", minHeight: 200 }}>
          <LoadingOverlay visible={loading} />
          {!loading && workOrderList.length === 0 ? (
            <EmptyState
              icon={<IconTool size={26} />}
              title={t("no_work_orders_found")}
              description={t("no_work_orders_description")}
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {workOrderList.map((wo) => (
                <WorkOrderCard
                  key={wo.id}
                  workOrder={wo}
                  onClick={() => handleViewDetails(wo)}
                />
              ))}
            </SimpleGrid>
          )}
        </div>
      </PageShell>

      <Drawer
        opened={filterDrawerOpened}
        onClose={() => setFilterDrawerOpened(false)}
        title={t("filters")}
        position="bottom"
        size="sm"
      >
        <Group grow align="flex-end">
          <Select
            label={t("status")}
            placeholder={t("all_statuses")}
            data={Object.values(WorkOrderStatus).map((s) => ({
              value: s,
              label: t(`work_order_status.${s}`),
            }))}
            clearable
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as WorkOrderStatus | null)}
          />
          <Select
            label={t("priority")}
            placeholder={t("all_priorities")}
            data={Object.values(WorkOrderPriority).map((p) => ({
              value: p,
              label: t(`work_order_priority.${p}`),
            }))}
            clearable
            value={priorityFilter}
            onChange={(val) =>
              setPriorityFilter(val as WorkOrderPriority | null)
            }
          />
        </Group>
      </Drawer>

      <CreateWorkOrderModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreate}
        technicians={technicians}
        loading={actionLoading}
      />

      <WorkOrderDetailsDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        workOrder={selectedWorkOrder}
        canManage={canManage}
        canUpdate={canUpdate}
        technicians={technicians}
        loading={actionLoading}
        onAssign={handleAssign}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancel}
      />
    </>
  );
}
