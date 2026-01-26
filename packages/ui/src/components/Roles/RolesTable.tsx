import { Group, Badge, ActionIcon, Tooltip } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { Role } from "@domas/ts-types";
import { GenericTable, Column } from "../Table/GenericTable";
import { useTranslation } from "react-i18next";

interface RolesTableProps {
  data: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  loading?: boolean;
}

export function RolesTable({
  data,
  onEdit,
  onDelete,
  loading,
}: RolesTableProps) {
  const { t } = useTranslation();

  const columns: Column<Role>[] = [
    {
      header: t("name"),
      accessorKey: "name",
      cell: (role) => (
        <Group gap="xs">
          <Badge color={role.isSystemRole ? "blue" : "teal"} variant="light">
            {role.name}
          </Badge>
          {role.isSystemRole && (
            <Badge variant="outline" size="xs" color="gray">
              {t("system")}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      header: t("description"),
      accessorKey: "description",
      cell: (role) => role.description || "-",
    },
    {
      header: t("permissions"),
      cell: (role) => (
        <Badge variant="outline" color="gray">
          {role.permissions?.length || 0}
        </Badge>
      ),
      align: "center",
      width: 120,
    },
  ];

  const actions = (role: Role) => (
    <Group gap={4} justify="flex-end">
      <Tooltip label={t("edit")}>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(role);
          }}
        >
          <IconPencil size={16} />
        </ActionIcon>
      </Tooltip>

      {!role.isSystemRole && (
        <Tooltip label={t("delete")}>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(role);
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      loading={loading}
      actions={actions}
      rowKey={(role) => role.id}
      emptyMessage={t("no_roles_found")}
    />
  );
}
