import { Table, Badge, ActionIcon, Menu } from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
} from "@tabler/icons-react";
import { User } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface UsersTableProps {
  data: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onRowClick?: (user: User) => void;
}

export function UsersTable({
  data,
  onEdit,
  onDelete,
  onRowClick,
}: UsersTableProps) {
  const { t } = useTranslation();

  const rows = data.map((user) => (
    <Table.Tr
      key={user.id}
      onClick={() => onRowClick?.(user)}
      style={{ cursor: onRowClick ? "pointer" : "default" }}
    >
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>
        <Badge color={user.isActive ? "green" : "gray"}>
          {user.isActive ? t("active") : t("inactive")}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(user.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <Menu shadow="md" width={180} withinPortal position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {onRowClick && (
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => onRowClick(user)}
              >
                {t("view_details", { defaultValue: "View Details" })}
              </Menu.Item>
            )}
            {onEdit && (
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => onEdit(user)}
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
                  onClick={() => onDelete(user)}
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
          <Table.Th className={classes.th}>{t("email")}</Table.Th>
          <Table.Th className={classes.th}>{t("status")}</Table.Th>
          <Table.Th className={classes.th}>{t("created_at")}</Table.Th>
          <Table.Th className={classes.th} style={{ width: 48 }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={4} style={{ padding: 0 }}>
              <EmptyState
                title={t("no_users_found", { defaultValue: "No users found" })}
              />
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
