import {
  Card,
  Box,
  Menu,
  ActionIcon,
  Group,
  Text,
  Badge,
  ThemeIcon,
  Checkbox,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconBed,
  IconCalendarPlus,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface BedCardProps {
  id: number;
  label: string;
  status: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBook?: () => void;
  selected?: boolean;
  onSelect?: () => void;
}

export function BedCard({
  label,
  status,
  onClick,
  onEdit,
  onDelete,
  onBook,
  selected,
  onSelect,
}: BedCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      withBorder
      padding="md"
      radius="md"
      onClick={onClick}
      style={{
        cursor: "pointer",
        position: "relative",
        borderColor: selected ? "var(--mantine-color-blue-filled)" : undefined,
        backgroundColor: selected
          ? "var(--mantine-color-blue-light)"
          : "transparent",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: 5,
          left: 5,
          zIndex: 2,
        }}
      >
        <Checkbox
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
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
        <Menu shadow="md" width={150}>
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
            {onBook && status === "available" && (
              <Menu.Item
                leftSection={<IconCalendarPlus size={14} />}
                color="green"
                onClick={(e) => {
                  e.stopPropagation();
                  onBook();
                }}
              >
                {t("create_booking")}
              </Menu.Item>
            )}
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

      <Group justify="center" mb="md" mt="xs">
        <ThemeIcon
          variant="light"
          size={48}
          radius="md"
          color={
            status === "available"
              ? "green"
              : status === "maintenance"
                ? "orange"
                : "blue"
          }
        >
          <IconBed size={24} />
        </ThemeIcon>
      </Group>
      <Text fw={700} ta="center" size="lg">
        {label}
      </Text>
      <Badge
        fullWidth
        mt="sm"
        variant="light"
        color={
          status === "available"
            ? "green"
            : status === "maintenance"
              ? "orange"
              : "blue"
        }
      >
        {t(`bed_status.${status}`)}
      </Badge>
    </Card>
  );
}
