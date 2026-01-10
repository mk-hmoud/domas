import { Table, Group, Badge, ActionIcon } from "@mantine/core";
import { IconTrash, IconPencil } from "@tabler/icons-react";
import { User, UserRole } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface UsersTableProps {
  data: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UsersTable({ data, onEdit, onDelete }: UsersTableProps) {
  const { t } = useTranslation();

  const rows = data.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>
        <Badge
          color={
            user.role === UserRole.ADMIN
              ? "blue"
              : user.role === UserRole.DORM_MANAGER ||
                  user.role === UserRole.DORM_STAFF
                ? "green"
                : user.role === UserRole.ACCOUNTING_STAFF
                  ? "orange"
                  : "gray"
          }
        >
          {t(`roles.${user.role}`)}
        </Badge>
      </Table.Td>
      <Table.Td>{user.isActive ? t("active") : t("inactive")}</Table.Td>
      <Table.Td>{new Date(user.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onEdit?.(user)}
          >
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onDelete?.(user)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("email")}</Table.Th>
          <Table.Th>{t("role")}</Table.Th>
          <Table.Th>{t("status")}</Table.Th>
          <Table.Th>{t("created_at")}</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
