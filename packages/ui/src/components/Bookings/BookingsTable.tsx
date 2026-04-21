import { Table, Badge, ActionIcon, Menu } from "@mantine/core";
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconArrowsLeftRight,
} from "@tabler/icons-react";
import { Booking } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface BookingsTableProps {
  data: Booking[];
  studentsMap: Map<string, string>;
  bedsMap: Map<number, string>;
  onSelect?: (booking: Booking) => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (booking: Booking) => void;
  onView?: (booking: Booking) => void;
  onTransfer?: (booking: Booking) => void;
}

export function BookingsTable({
  data,
  studentsMap,
  bedsMap,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onTransfer,
}: BookingsTableProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "ready_for_checkin":
        return "blue";
      case "confirmed":
        return "cyan";
      case "transferred":
        return "grape";
      case "pending_accounting":
        return "orange";
      case "draft":
        return "yellow";
      case "completed":
        return "gray";
      case "cancelled":
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const rows = data.map((booking) => (
    <Table.Tr
      key={booking.id}
      onClick={() => onSelect?.(booking)}
      style={{ cursor: onSelect ? "pointer" : "default" }}
    >
      <Table.Td>
        {studentsMap.get(booking.studentId) || booking.studentId}
      </Table.Td>
      <Table.Td>{bedsMap.get(booking.bedId) || booking.bedId}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(booking.status)} variant="light">
          {t(`booking_status.${booking.status}`, {
            defaultValue: booking.status,
          })}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(booking.startDate).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(booking.endDate).toLocaleDateString()}</Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <Menu shadow="md" width={200} withinPortal position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {onView && (
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => onView(booking)}
              >
                {t("view_details", { defaultValue: "View Details" })}
              </Menu.Item>
            )}
            {onTransfer && (
              <Menu.Item
                leftSection={<IconArrowsLeftRight size={14} />}
                onClick={() => onTransfer(booking)}
              >
                {t("transfer_to_semester", {
                  defaultValue: "Transfer to Next Semester",
                })}
              </Menu.Item>
            )}
            {onEdit && (
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => onEdit(booking)}
              >
                {t("edit")}
              </Menu.Item>
            )}
            {onDelete && (
              <>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete(booking)}
                >
                  {t("delete")}
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table highlightOnHover>
      <Table.Thead className={classes.thead}>
        <Table.Tr>
          <Table.Th className={classes.th}>{t("student")}</Table.Th>
          <Table.Th className={classes.th}>{t("bed")}</Table.Th>
          <Table.Th className={classes.th}>{t("status")}</Table.Th>
          <Table.Th className={classes.th}>{t("start_date")}</Table.Th>
          <Table.Th className={classes.th}>{t("end_date")}</Table.Th>
          <Table.Th className={classes.th} style={{ width: 48 }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={6} style={{ padding: 0 }}>
              <EmptyState
                title={t("no_bookings_found", {
                  defaultValue: "No bookings found",
                })}
              />
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
