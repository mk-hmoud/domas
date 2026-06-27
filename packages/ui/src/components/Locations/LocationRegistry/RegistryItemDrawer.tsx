import {
  Drawer,
  Box,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  ThemeIcon,
  Progress,
  SimpleGrid,
  Paper,
  ActionIcon,
  Button,
  Divider,
  Tooltip,
} from "@mantine/core";
import {
  IconBed,
  IconUser,
  IconCircleCheck,
  IconEdit,
  IconTrash,
  IconCalendarPlus,
  IconHierarchy,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { LocationType, GenderType } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";
import { LocationIcon } from "../LocationIcon";

// ── Helpers ───────────────────────────────────────────────────────────────────

function itemTypeColor(type: string): string {
  switch (type) {
    case LocationType.CAMPUS:
      return "violet";
    case LocationType.BUILDING:
      return "blue";
    case LocationType.BLOCK:
      return "cyan";
    case LocationType.FLOOR:
      return "teal";
    case LocationType.ROOM:
      return "green";
    case "bed":
      return "indigo";
    default:
      return "gray";
  }
}

function occupancyColor(rate: number): string {
  if (rate >= 95) return "red";
  if (rate >= 80) return "orange";
  return "blue";
}

function bedStatusColor(status?: string): string {
  if (status === "occupied") return "indigo";
  if (status === "maintenance") return "orange";
  return "green";
}

function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <Text fw={800} size="xl" lh={1}>
            {value}
          </Text>
          <Text size="xs" c="dimmed" fw={500}>
            {label}
          </Text>
        </Stack>
        <ThemeIcon color={color} variant="light" size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface RegistryItemDrawerProps {
  item: any | null;
  opened: boolean;
  onClose: () => void;
  isTr?: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onBook?: (item: any) => void;
  onNavigate: (item: any) => void;
  onEmailResidents?: (locationId: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegistryItemDrawer({
  item,
  opened,
  onClose,
  isTr,
  onEdit,
  onDelete,
  onBook,
  onNavigate,
  onEmailResidents,
}: RegistryItemDrawerProps) {
  const { t } = useTranslation();

  if (!item) return null;

  const isBed = item.type === "bed";
  const color = itemTypeColor(item.type);
  const displayName = isBed
    ? `${item.locationName ? item.locationName + " — " : ""}${item.label}`
    : isTr && item.nameTr
      ? item.nameTr
      : item.name;

  const total = item.totalBeds ?? 0;
  const occupied = item.occupiedBeds ?? 0;
  const available = Math.max(0, total - occupied);
  const occupancy = total > 0 ? (occupied / total) * 100 : 0;
  const oColor = occupancyColor(occupancy);

  const hasOccupancy = !isBed && total > 0;

  const hasProperties =
    item.isTrOnly ||
    item.isForeignerOnly ||
    item.isGuestZone ||
    item.isRectorate ||
    item.roomTypeId ||
    item.studentYearLock ||
    (item.type === LocationType.ROOM && !item.roomTypeId);

  const canBook = (item.type === LocationType.ROOM || isBed) && !!onBook;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={500}
      withCloseButton={false}
      styles={{
        body: {
          padding: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Box
        p="xl"
        style={{
          background: `light-dark(var(--mantine-color-${color}-0), var(--mantine-color-dark-8))`,
          borderBottom:
            "1px solid light-dark(var(--mantine-color-default-border), var(--mantine-color-dark-5))",
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group
            gap="md"
            align="flex-start"
            wrap="nowrap"
            style={{ minWidth: 0, flex: 1 }}
          >
            <ThemeIcon
              size={52}
              radius="xl"
              color={color}
              variant="light"
              style={{ flexShrink: 0 }}
            >
              <LocationIcon
                type={isBed ? LocationType.BED : (item.type as LocationType)}
                size={26}
              />
            </ThemeIcon>
            <Stack gap={4} style={{ minWidth: 0 }}>
              {item.locationPath && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {item.locationPath}
                </Text>
              )}
              <Title order={4} lh={1.2}>
                {isBed
                  ? item.label
                  : isTr && item.nameTr
                    ? item.nameTr
                    : item.name}
              </Title>
              <Group gap="xs" wrap="wrap">
                <Badge color={color} variant="light" size="sm">
                  {isBed
                    ? t("bed", "Bed")
                    : t(`location_type.${item.type}`, item.type?.toUpperCase())}
                </Badge>
                {item.genderLock && (
                  <Badge
                    color={
                      item.genderLock === GenderType.MALE ? "blue" : "pink"
                    }
                    variant="dot"
                    size="sm"
                  >
                    {t(`gender.${item.genderLock}`, item.genderLock)}
                  </Badge>
                )}
                {item.roomTypeName && (
                  <Badge color="teal" variant="light" size="sm">
                    {isTr && item.roomTypeNameTr
                      ? item.roomTypeNameTr
                      : item.roomTypeName}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          {/* Header actions */}
          <Group gap="xs" style={{ flexShrink: 0 }}>
            <Tooltip label={t("edit")}>
              <ActionIcon
                variant="light"
                color={color}
                onClick={() => onEdit(item)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("delete")}>
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => onDelete(item)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
            <ActionIcon variant="subtle" color="gray" onClick={onClose}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* ── BED STATUS ─────────────────────────────────────────────────── */}
      {isBed && (
        <Box
          px="xl"
          py="md"
          style={{
            background:
              "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))",
            borderBottom:
              "1px solid light-dark(var(--mantine-color-default-border), var(--mantine-color-dark-5))",
            flexShrink: 0,
          }}
        >
          <Group gap="lg" align="center">
            <Badge
              size="xl"
              radius="sm"
              color={bedStatusColor(item.status)}
              variant="light"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              {t(`bed_status.${item.status}`, item.status || "—")}
            </Badge>
            {item.status === "occupied" && item.residentName && (
              <Group gap="xs">
                <ThemeIcon size="md" variant="light" color="indigo" radius="xl">
                  <IconUser size={14} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">
                    {t("resident", "Resident")}
                  </Text>
                  <Text fw={600} size="sm">
                    {item.residentName}
                  </Text>
                </Stack>
              </Group>
            )}
          </Group>
        </Box>
      )}

      {/* ── OCCUPANCY STATS (locations) ────────────────────────────────── */}
      {hasOccupancy && (
        <Box
          px="xl"
          py="md"
          style={{
            background:
              "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))",
            borderBottom:
              "1px solid light-dark(var(--mantine-color-default-border), var(--mantine-color-dark-5))",
            flexShrink: 0,
          }}
        >
          <SimpleGrid cols={3} spacing="xs" mb="sm">
            <StatCard
              value={total}
              label={t("total_beds", "Total")}
              color="blue"
              icon={<IconBed size={16} />}
            />
            <StatCard
              value={occupied}
              label={t("occupied", "Occupied")}
              color="indigo"
              icon={<IconUser size={16} />}
            />
            <StatCard
              value={available}
              label={t("available", "Available")}
              color="green"
              icon={<IconCircleCheck size={16} />}
            />
          </SimpleGrid>
          <Group gap="md" align="center">
            <Progress
              value={occupancy}
              style={{ flex: 1 }}
              size="md"
              radius="xl"
              color={oColor}
            />
            <Text size="sm" fw={700} c={oColor} w={50} ta="right">
              {Math.round(occupancy)}%
            </Text>
          </Group>
        </Box>
      )}

      {/* ── PROPERTIES ─────────────────────────────────────────────────── */}
      {hasProperties && (
        <Box
          px="xl"
          py="sm"
          style={{
            borderBottom:
              "1px solid light-dark(var(--mantine-color-default-border), var(--mantine-color-dark-5))",
            flexShrink: 0,
          }}
        >
          <Group gap="xs" wrap="wrap">
            {item.type === LocationType.ROOM && !item.roomTypeId && (
              <Badge color="yellow" variant="outline" size="sm">
                {t("no_room_type", "No room type")}
              </Badge>
            )}
            {item.isTrOnly && (
              <Badge color="red" variant="dot" size="sm">
                TR Only
              </Badge>
            )}
            {item.isForeignerOnly && (
              <Badge color="grape" variant="dot" size="sm">
                INT Only
              </Badge>
            )}
            {item.isGuestZone && (
              <Badge color="orange" variant="dot" size="sm">
                {t("is_guest_zone_label", "Guest Zone")}
              </Badge>
            )}
            {item.isRectorate && (
              <Badge color="violet" variant="dot" size="sm">
                {t("rectorate", "Rectorate")}
              </Badge>
            )}
            {item.studentYearLock && (
              <Badge color="indigo" variant="outline" size="sm">
                {item.studentYearLock === "new"
                  ? t("student_year_lock_new", "New students")
                  : t("student_year_lock_current", "Current students")}
              </Badge>
            )}
          </Group>
        </Box>
      )}

      {/* ── ACTIONS ────────────────────────────────────────────────────── */}
      <Box px="xl" py="md" style={{ flexShrink: 0 }}>
        <Stack gap="xs">
          {canBook && (
            <Button
              fullWidth
              leftSection={<IconCalendarPlus size={16} />}
              onClick={() => onBook!(item)}
            >
              {t("create_booking")}
            </Button>
          )}
          {!isBed && onEmailResidents && (
            <Button
              fullWidth
              variant="light"
              color="blue"
              leftSection={<IconMail size={16} />}
              onClick={() => onEmailResidents(item.id as number)}
            >
              {t("email_residents", "Email Residents")}
            </Button>
          )}
          <Divider />
          <Button
            fullWidth
            variant="default"
            leftSection={<IconHierarchy size={16} />}
            onClick={() => {
              onNavigate(item);
              onClose();
            }}
          >
            {t("locate_in_structure", "Locate in Structure")}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
