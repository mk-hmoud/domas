import { Table, Group, Badge, ActionIcon } from "@mantine/core";
import { IconTrash, IconPencil } from "@tabler/icons-react";
import { User, UserRole } from "@domas/ts-types";

interface UsersTableProps {
  data: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UsersTable({ data, onEdit, onDelete }: UsersTableProps) {
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
          {user.role}
        </Badge>
      </Table.Td>
      <Table.Td>{user.isActive ? "Active" : "Inactive"}</Table.Td>
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
          <Table.Th>Email</Table.Th>
          <Table.Th>Role</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Created At</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
