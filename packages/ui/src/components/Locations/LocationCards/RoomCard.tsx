import {
  Card,
  Box,
  Checkbox,
  Menu,
  ActionIcon,
  Group,
  Text,
  Badge,
  Progress,
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
  capacity: number;
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
  capacity,
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
      padding="md"
      radius="md"
      onClick={onClick}
      style={{ cursor: "pointer", position: "relative" }}
    >
      <Box
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 2,
        }}
      >
        <Checkbox
          checked={selected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </Box>

      <Box
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          zIndex: 2,
        }}
      >
        <Menu shadow="md" width={150} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="transparent"
              color="gray"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical size={16} />
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
      </Box>

      <Box pt="sm">
        <Group justify="center" mb="xs">
          <Group gap="xs">
            <IconDoor size={18} color="gray" />
            <Text fw={600}>{name}</Text>
          </Group>
          {genderLock && (
            <Badge
              color={genderLock === "male" ? "blue" : "pink"}
              variant="light"
            >
              {genderLock}
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed" mb={4} ta="center">
          {t("occupancy_label")}: {occupancy} / {capacity}
        </Text>
        <Progress
          value={(occupancy / capacity) * 100}
          color="blue"
          size="md"
          radius="xl"
        />
      </Box>
    </Card>
  );
}
