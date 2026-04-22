import {
  Card,
  Box,
  Checkbox,
  Menu,
  ActionIcon,
  Group,
  Text,
  ThemeIcon,
  rem,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconBuilding,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";

interface GenericLocationCardProps {
  id: number;
  name: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GenericLocationCard({
  name,
  icon,
  selected,
  onClick,
  onSelect,
  onEdit,
  onDelete,
}: GenericLocationCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      withBorder
      padding="sm"
      radius="md"
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderLeftWidth: rem(3),
        borderLeftColor: selected
          ? "var(--mantine-color-blue-filled)"
          : "var(--mantine-color-violet-filled)",
        backgroundColor: selected
          ? "var(--mantine-color-blue-light)"
          : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group wrap="nowrap" gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Checkbox
            size="xs"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
          <ThemeIcon variant="light" size={28} radius="sm" color="violet">
            {icon || <IconBuilding size={14} />}
          </ThemeIcon>
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text
              fw={600}
              size="sm"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </Text>
          </Box>
        </Group>

        <Menu shadow="md" width={150} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              {t("edit")}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              {t("delete")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
