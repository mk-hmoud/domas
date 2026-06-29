import {
  Card,
  Checkbox,
  Menu,
  ActionIcon,
  Group,
  Text,
  Badge,
  ThemeIcon,
  rem,
  Stack,
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
  roomTypeName?: string;
  totalBeds?: number;
  occupiedBeds?: number;
  isTrOnly?: boolean;
  isGuestZone?: boolean;
  isRectorate?: boolean;
  isForeignerOnly?: boolean;
  studentYearLock?: string;
  selected: boolean;
  onClick: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoomCard({
  name,
  genderLock,
  roomTypeName,
  totalBeds,
  occupiedBeds = 0,
  isTrOnly,
  isGuestZone,
  isRectorate,
  isForeignerOnly,
  studentYearLock,
  selected,
  onClick,
  onSelect,
  onEdit,
  onDelete,
}: RoomCardProps) {
  const { t } = useTranslation();
  const hasFlags =
    isTrOnly ||
    isGuestZone ||
    isRectorate ||
    isForeignerOnly ||
    !!studentYearLock;

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
      <Group justify="space-between" wrap="nowrap" gap="xs" align="flex-start">
        <Group
          wrap="nowrap"
          gap="xs"
          style={{ flex: 1, minWidth: 0 }}
          align="flex-start"
        >
          <Checkbox
            size="xs"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            mt={2}
          />
          <ThemeIcon
            variant="light"
            size={28}
            radius="sm"
            color="indigo"
            style={{ flexShrink: 0 }}
          >
            <IconDoor size={14} />
          </ThemeIcon>
          <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6} wrap="wrap">
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

            {roomTypeName && (
              <Text size="xs" c="teal" fw={500}>
                {roomTypeName}
              </Text>
            )}

            {totalBeds !== undefined && (
              <Text size="xs" c="dimmed">
                {occupiedBeds}/{totalBeds}{" "}
                {t("occupied", { defaultValue: "occupied" })}
              </Text>
            )}

            {hasFlags && (
              <Group gap={4} wrap="wrap" mt={2}>
                {isTrOnly && (
                  <Badge size="xs" variant="dot" color="red">
                    TR
                  </Badge>
                )}
                {isForeignerOnly && (
                  <Badge size="xs" variant="dot" color="grape">
                    INT
                  </Badge>
                )}
                {isGuestZone && (
                  <Badge size="xs" variant="dot" color="orange">
                    {t("is_guest_zone_label", { defaultValue: "Guest" })}
                  </Badge>
                )}
                {isRectorate && (
                  <Badge size="xs" variant="dot" color="violet">
                    {t("rectorate", { defaultValue: "Rectorate" })}
                  </Badge>
                )}
                {studentYearLock && (
                  <Badge size="xs" variant="dot" color="indigo">
                    {studentYearLock === "new"
                      ? t("student_year_lock_new", { defaultValue: "New" })
                      : t("student_year_lock_current", {
                          defaultValue: "Current",
                        })}
                  </Badge>
                )}
              </Group>
            )}
          </Stack>
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
