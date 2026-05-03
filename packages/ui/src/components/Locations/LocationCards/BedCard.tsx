import {
  Card,
  Menu,
  ActionIcon,
  Group,
  Text,
  Badge,
  ThemeIcon,
  Checkbox,
  Box,
  rem,
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

function getStatusColor(status: string) {
  if (status === "available") return "green";
  if (status === "maintenance") return "orange";
  return "blue";
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
  const color = getStatusColor(status);

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
          : `var(--mantine-color-${color}-filled)`,
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
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <ThemeIcon variant="light" size={28} radius="sm" color={color}>
            <IconBed size={14} />
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
              {label}
            </Text>
            <Badge size="xs" variant="light" color={color} mt={2}>
              {t(`bed_status.${status}`)}
            </Badge>
          </Box>
        </Group>

        <Menu shadow="md" width={160} position="bottom-end">
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
      </Group>
    </Card>
  );
}
