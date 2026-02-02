import {
  Table,
  Badge,
  ActionIcon,
  Menu,
  Group,
  Text,
  Checkbox,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEye,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { BookingOpsStatus } from "@domas/ts-types";

export interface StudentPayment {
  id: string; // Booking ID
  studentNumber: string;
  studentName: string;
  studentEmail: string;
  bookingType: string;
  amount: number;
  status: BookingOpsStatus;
  date: string;
  processedAt?: string;
}

interface PaymentsTableProps {
  data: StudentPayment[];
  onSelect: (payment: StudentPayment) => void;
  onAccept?: (payment: StudentPayment) => void;
  onReject?: (payment: StudentPayment) => void;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export function PaymentsTable({
  data,
  onSelect,
  onAccept,
  onReject,
  selectedIds = [],
  onToggleSelection,
  onToggleSelectAll,
}: PaymentsTableProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const getStatusColor = (status: BookingOpsStatus) => {
    switch (status) {
      case BookingOpsStatus.PENDING_ACCOUNTING:
        return "yellow";
      case BookingOpsStatus.READY_FOR_CHECKIN:
      case BookingOpsStatus.ACTIVE:
      case BookingOpsStatus.COMPLETED:
        return "green";
      case BookingOpsStatus.REJECTED:
        return "red";
      case BookingOpsStatus.CANCELLED:
        return "gray";
      default:
        return "gray";
    }
  };

  const allSelected =
    data.length > 0 && data.every((p) => selectedIds.includes(p.id));
  const someSelected =
    data.some((p) => selectedIds.includes(p.id)) && !allSelected;

  const rows = data.map((payment) => {
    const isSelected = selectedIds.includes(payment.id);
    return (
      <Table.Tr
        key={payment.id}
        onClick={() => onSelect(payment)}
        style={{ cursor: "pointer" }}
        bg={isSelected ? "var(--mantine-color-blue-light)" : undefined}
      >
        <Table.Td onClick={(e) => e.stopPropagation()}>
          {payment.status === BookingOpsStatus.PENDING_ACCOUNTING &&
            onToggleSelection && (
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleSelection(payment.id)}
              />
            )}
        </Table.Td>
        <Table.Td>{payment.studentNumber}</Table.Td>
        <Table.Td>
          <Text size="sm" fw={500}>
            {payment.studentName}
          </Text>
          <Text size="xs" c="dimmed">
            {payment.studentEmail}
          </Text>
        </Table.Td>
        <Table.Td>{payment.bookingType}</Table.Td>
        <Table.Td fw={700}>{formatCurrency(payment.amount)}</Table.Td>
        <Table.Td>{new Date(payment.date).toLocaleDateString()}</Table.Td>
        <Table.Td>
          <Badge color={getStatusColor(payment.status)} variant="light">
            {payment.status.replace(/_/g, " ")}
          </Badge>
        </Table.Td>
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <Group gap={0} justify="flex-end">
            <Menu shadow="md" width={200} withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEye size={14} />}
                  onClick={() => onSelect(payment)}
                >
                  {t("view_details")}
                </Menu.Item>
                {payment.status === BookingOpsStatus.PENDING_ACCOUNTING && (
                  <>
                    <Menu.Item
                      leftSection={<IconCheck size={14} />}
                      color="green"
                      onClick={() => onAccept?.(payment)}
                    >
                      {t("accept")}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconX size={14} />}
                      color="red"
                      onClick={() => onReject?.(payment)}
                    >
                      {t("reject")}
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table striped highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 40 }}>
            {onToggleSelectAll && (
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleSelectAll}
              />
            )}
          </Table.Th>
          <Table.Th>
            {t("student_number", { defaultValue: "Student Number" })}
          </Table.Th>
          <Table.Th>{t("student")}</Table.Th>
          <Table.Th>{t("booking")}</Table.Th>
          <Table.Th>{t("amount")}</Table.Th>
          <Table.Th>{t("date")}</Table.Th>
          <Table.Th>{t("status")}</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
