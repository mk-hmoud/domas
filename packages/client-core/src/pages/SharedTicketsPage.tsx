import { useEffect, useState, useCallback } from "react";
import {
  PageHeader,
  PageShell,
  TicketTable,
  TicketDetailsDrawer,
} from "@domas/ui";
import { Paper, LoadingOverlay, Tabs, Badge } from "@mantine/core";
import { IconListSearch, IconHistory } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  tickets as ticketsApi,
  workOrders as workOrdersApi,
} from "@domas/api-client";
import {
  TicketView,
  AssignableTechnician,
  TicketStatus,
  WorkOrderPriority,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

export function SharedTicketsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canTriage = hasPermission("tickets.triage");

  const [ticketList, setTicketList] = useState<TicketView[]>([]);
  const [technicians, setTechnicians] = useState<AssignableTechnician[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketView | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ticketsApi.getAll();
      setTicketList(data);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (canTriage) {
      workOrdersApi
        .getAssignableTechnicians()
        .then(setTechnicians)
        .catch(() => {});
    }
  }, [canTriage]);

  const handleViewDetails = (ticket: TicketView) => {
    setSelectedTicket(ticket);
    setDrawerOpened(true);
  };

  const handleResolve = async (id: string, resolutionNotes: string) => {
    setActionLoading(true);
    try {
      await ticketsApi.resolve(id, { resolutionNotes });
      notifications.show({
        title: t("success"),
        message: t("ticket_resolved_success"),
        color: "green",
      });
      setDrawerOpened(false);
      fetchTickets();
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

  const handleReject = async (id: string, rejectionReason: string) => {
    setActionLoading(true);
    try {
      await ticketsApi.reject(id, { rejectionReason });
      notifications.show({
        title: t("success"),
        message: t("ticket_rejected_success"),
        color: "green",
      });
      setDrawerOpened(false);
      fetchTickets();
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

  const handleEscalate = async (
    id: string,
    assignedTo?: string,
    priority?: WorkOrderPriority,
  ) => {
    setActionLoading(true);
    try {
      await ticketsApi.escalate(id, { assignedTo, priority });
      notifications.show({
        title: t("success"),
        message: t("ticket_escalated_success"),
        color: "green",
      });
      setDrawerOpened(false);
      fetchTickets();
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

  const newTickets = ticketList.filter((ti) => ti.status === TicketStatus.OPEN);
  const history = ticketList.filter((ti) => ti.status !== TicketStatus.OPEN);

  return (
    <>
      <PageHeader title={t("tickets")} subtitle={t("tickets_description")} />
      <PageShell>
        <Tabs defaultValue="new">
          <Tabs.List mb="md">
            <Tabs.Tab
              value="new"
              leftSection={<IconListSearch size={14} />}
              rightSection={
                newTickets.length > 0 ? (
                  <Badge size="xs" color="red" variant="filled">
                    {newTickets.length}
                  </Badge>
                ) : undefined
              }
            >
              {t("new_tickets")}
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
              {t("ticket_history")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="new">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <TicketTable data={newTickets} onView={handleViewDetails} />
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <TicketTable data={history} onView={handleViewDetails} />
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </PageShell>

      <TicketDetailsDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        ticket={selectedTicket}
        canTriage={canTriage}
        technicians={technicians}
        loading={actionLoading}
        onResolve={handleResolve}
        onReject={handleReject}
        onEscalate={handleEscalate}
      />
    </>
  );
}
