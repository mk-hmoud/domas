import {
  Card,
  Checkbox,
  Menu,
  ActionIcon,
  Group,
  Text,
  Badge,
  ThemeIcon,
  Box,
  rem,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconDoor,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface RoomCardProps {
  id: number;
  name: string;
  genderLock?: string;
  occupancy?: number;
  selected: boolean;
  onClick: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoomCard({
  name,
  genderLock,
  occupancy = 0,
  selected,
  onClick,
  onSelect,
  onEdit,
  onDelete,
}: RoomCardProps) {
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
          : "var(--mantine-color-indigo-filled)",
        backgroundColor: selected
          ? "light-dark(var(--mantine-color-blue-light), var(--mantine-color-dark-5))"
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
          <ThemeIcon variant="light" size={28} radius="sm" color="indigo">
            <IconDoor size={14} />
          </ThemeIcon>
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6} wrap="nowrap">
              <Text fw={600} size="sm">
                {name}
              </Text>
              {genderLock && (
                <Badge
                  size="xs"
                  variant="light"
                  color={genderLock === "male" ? "blue" : "pink"}
                  style={{ flexShrink: 0 }}
                >
                  {genderLock}
                </Badge>
              )}
            </Group>
            {occupancy > 0 && (
              <Text size="xs" c="dimmed" mt={2}>
                {occupancy} {t("occupied", { defaultValue: "occupied" })}
              </Text>
            )}
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
