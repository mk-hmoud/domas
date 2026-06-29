import { useMemo, ReactNode } from "react";
import {
  Paper,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  ThemeIcon,
  Box,
  Progress,
  SimpleGrid,
  Tabs,
  ActionIcon,
  Button,
  Menu,
  ScrollArea,
  Checkbox,
  Anchor,
  Breadcrumbs,
} from "@mantine/core";
import {
  IconBed,
  IconUser,
  IconTool,
  IconCircleCheck,
  IconDotsVertical,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendarPlus,
  IconBox,
} from "@tabler/icons-react";
import { LocationType, GenderType, InventoryAssignment } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { LocationNode } from "../LocationTree/LocationTree";
import { LocationIcon } from "../LocationIcon";
import { GenericLocationCard } from "../LocationCards/GenericLocationCard";
import { RoomCard } from "../LocationCards/RoomCard";
import { BedCard } from "../LocationCards/BedCard";
import { InventoryAssignmentList } from "../../Inventory/InventoryAssignmentList";
import { EmptyState } from "../../EmptyState";

// ── Internal helpers ──────────────────────────────────────────────────────────

type NodeStats = {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  buildings: number;
  blocks: number;
  floors: number;
  rooms: number;
};

function computeStats(node: LocationNode): NodeStats {
  const s: NodeStats = {
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    maintenanceBeds: 0,
    buildings: 0,
    blocks: 0,
    floors: 0,
    rooms: 0,
  };
  const traverse = (n: LocationNode) => {
    switch (n.type) {
      case LocationType.BUILDING:
        s.buildings++;
        break;
      case LocationType.BLOCK:
        s.blocks++;
        break;
      case LocationType.FLOOR:
        s.floors++;
        break;
      case LocationType.ROOM:
        s.rooms++;
        break;
      case LocationType.BED:
        s.totalBeds++;
        if (n.status === "occupied") s.occupiedBeds++;
        else if (n.status === "maintenance") s.maintenanceBeds++;
        else s.availableBeds++;
        break;
    }
    n.children?.forEach(traverse);
  };
  node.children?.forEach(traverse);
  return s;
}

function typeColor(type: LocationType): string {
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
    case LocationType.BED:
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

export interface LocationDetailPanelProps {
  node: LocationNode;
  isTr?: boolean;
  breadcrumbs: { label: string; onClick: () => void }[];
  locationChildren: LocationNode[];
  roomBeds: any[];
  selectedIds?: (number | string)[];
  showInventory?: boolean;
  inventoryAssignments?: InventoryAssignment[];
  inventoryLoading?: boolean;

  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onBook?: () => void;
  onCreateBed?: () => void;

  onEditChild?: (child: any) => void;
  onDeleteChild?: (child: any) => void;
  onSelectChild?: (child: any) => void;
  onToggleChildSelection?: (id: number | string) => void;
  onToggleSelectAllChildren?: () => void;

  onEditBed?: (bed: any) => void;
  onDeleteBed?: (bed: any) => void;
  onBookBed?: (bed: any) => void;
  onSelectBedNode?: (node: any) => void;
  onToggleBedSelection?: (id: string | number) => void;
  onToggleSelectAllBeds?: () => void;

  onAddInventory?: () => void;
  onRemoveInventory?: (id: string) => Promise<void>;
  onUpdateInventoryQuantity?: (id: string, qty: number) => Promise<void>;
  onApplyTemplate?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LocationDetailPanel({
  node,
  isTr,
  breadcrumbs,
  locationChildren,
  roomBeds,
  selectedIds = [],
  showInventory,
  inventoryAssignments = [],
  inventoryLoading,
  onEdit,
  onDelete,
  onAddChild,
  onBook,
  onCreateBed,
  onEditChild,
  onDeleteChild,
  onSelectChild,
  onToggleChildSelection,
  onToggleSelectAllChildren,
  onEditBed,
  onDeleteBed,
  onBookBed,
  onSelectBedNode,
  onToggleBedSelection,
  onToggleSelectAllBeds,
  onAddInventory,
  onRemoveInventory,
  onUpdateInventoryQuantity,
  onApplyTemplate,
}: LocationDetailPanelProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => computeStats(node), [node]);
  const color = typeColor(node.type);
  const displayName = isTr && node.nameTr ? node.nameTr : node.name;
  const occupancyRate =
    stats.totalBeds > 0 ? (stats.occupiedBeds / stats.totalBeds) * 100 : 0;
  const oColor = occupancyColor(occupancyRate);

  const crumbPath = breadcrumbs.slice(0, -1);

  const childrenTabLabel = (() => {
    if (node.type === LocationType.CAMPUS) return t("buildings", "Buildings");
    if (node.type === LocationType.BUILDING || node.type === LocationType.BLOCK)
      return locationChildren.every((c) => c.type === LocationType.FLOOR)
        ? t("floors", "Floors")
        : t("locations", "Locations");
    if (node.type === LocationType.FLOOR) return t("rooms", "Rooms");
    if (node.type === LocationType.ROOM) return t("beds", "Beds");
    return t("locations", "Locations");
  })();

  const childrenCount =
    node.type === LocationType.ROOM ? roomBeds.length : locationChildren.length;
  const defaultTab = node.type === LocationType.BED ? "inventory" : "children";

  const allChildrenSelected =
    node.type === LocationType.ROOM
      ? roomBeds.length > 0 &&
        roomBeds.every((b) => selectedIds.includes(`bed-${b.id}`))
      : locationChildren.length > 0 &&
        locationChildren.every((c) =>
          selectedIds.includes(
            c.type === LocationType.BED ? `bed-${c.id}` : `loc-${c.id}`,
          ),
        );

  const someChildrenSelected =
    node.type === LocationType.ROOM
      ? roomBeds.some((b) => selectedIds.includes(`bed-${b.id}`)) &&
        !allChildrenSelected
      : locationChildren.some((c) =>
          selectedIds.includes(
            c.type === LocationType.BED ? `bed-${c.id}` : `loc-${c.id}`,
          ),
        ) && !allChildrenSelected;

  const hasProperties =
    node.isTrOnly ||
    node.isForeignerOnly ||
    node.isGuestZone ||
    node.isRectorate ||
    node.roomTypeId ||
    node.studentYearLock ||
    (node.type === LocationType.ROOM && !node.roomTypeId);

  const subSummaryParts: string[] = [];
  if (stats.buildings > 0)
    subSummaryParts.push(`${stats.buildings} ${t("buildings", "buildings")}`);
  if (stats.blocks > 0)
    subSummaryParts.push(`${stats.blocks} ${t("blocks", "blocks")}`);
  if (stats.floors > 0)
    subSummaryParts.push(`${stats.floors} ${t("floors", "floors")}`);
  if (stats.rooms > 0)
    subSummaryParts.push(`${stats.rooms} ${t("rooms", "rooms")}`);
  if (stats.totalBeds > 0 && node.type !== LocationType.ROOM)
    subSummaryParts.push(`${stats.totalBeds} ${t("beds", "beds")}`);

  return (
    <Paper
      withBorder
      h="100%"
      radius="md"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
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
              size={56}
              radius="xl"
              color={color}
              variant="light"
              style={{ flexShrink: 0 }}
            >
              <LocationIcon type={node.type} size={28} />
            </ThemeIcon>
            <Stack gap={4} style={{ minWidth: 0 }}>
              {crumbPath.length > 0 && (
                <Breadcrumbs separator="›" fz="xs">
                  {crumbPath.map((b, i) => (
                    <Anchor
                      key={i}
                      size="xs"
                      c="dimmed"
                      onClick={b.onClick}
                      style={{ cursor: "pointer" }}
                    >
                      {b.label}
                    </Anchor>
                  ))}
                </Breadcrumbs>
              )}
              <Title order={3} lh={1.2}>
                {displayName}
              </Title>
              <Group gap="xs" wrap="wrap">
                <Badge color={color} variant="light" size="sm">
                  {t(`location_type.${node.type}`, node.type.toUpperCase())}
                </Badge>
                {node.genderLock && (
                  <Badge
                    color={
                      node.genderLock === GenderType.MALE ? "blue" : "pink"
                    }
                    variant="dot"
                    size="sm"
                  >
                    {t(`gender.${node.genderLock}`, node.genderLock)}
                  </Badge>
                )}
                {subSummaryParts.length > 0 && (
                  <Text size="xs" c="dimmed">
                    {subSummaryParts.join(" · ")}
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>

          {/* ── Actions ── */}
          <Group gap="xs" style={{ flexShrink: 0 }}>
            {(node.type === LocationType.ROOM ||
              node.type === LocationType.BED) &&
              onBook && (
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconCalendarPlus size={14} />}
                  onClick={onBook}
                >
                  {t("create_booking")}
                </Button>
              )}
            {node.type === LocationType.ROOM &&
              !node.roomTypeId &&
              onCreateBed && (
                <Button
                  size="sm"
                  variant="light"
                  color="teal"
                  leftSection={<IconPlus size={14} />}
                  onClick={onCreateBed}
                >
                  {t("create_bed", "Create Bed")}
                </Button>
              )}
            {node.type !== LocationType.ROOM &&
              node.type !== LocationType.BED &&
              onAddChild && (
                <Button
                  size="sm"
                  leftSection={<IconPlus size={14} />}
                  onClick={onAddChild}
                >
                  {t("add_child")}
                </Button>
              )}
            {node.type !== LocationType.UNIVERSITY && (
              <Menu shadow="md" position="bottom-end" width={160}>
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    aria-label="More actions"
                  >
                    <IconDotsVertical size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {onEdit && (
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={onEdit}
                    >
                      {t("edit")}
                    </Menu.Item>
                  )}
                  {onDelete && (
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={onDelete}
                    >
                      {t("delete")}
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </Box>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      {node.type !== LocationType.BED && stats.totalBeds > 0 && (
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
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mb="sm">
            <StatCard
              value={stats.totalBeds}
              label={t("total_beds", "Total Beds")}
              color="blue"
              icon={<IconBed size={16} />}
            />
            <StatCard
              value={stats.occupiedBeds}
              label={t("occupied", "Occupied")}
              color="indigo"
              icon={<IconUser size={16} />}
            />
            <StatCard
              value={stats.availableBeds}
              label={t("available", "Available")}
              color="green"
              icon={<IconCircleCheck size={16} />}
            />
            <StatCard
              value={stats.maintenanceBeds}
              label={t("maintenance", "Maintenance")}
              color="orange"
              icon={<IconTool size={16} />}
            />
          </SimpleGrid>
          <Group gap="md" align="center">
            <Progress
              value={occupancyRate}
              style={{ flex: 1 }}
              size="md"
              radius="xl"
              color={oColor}
            />
            <Text size="sm" fw={700} c={oColor} w={50} ta="right">
              {Math.round(occupancyRate)}%
            </Text>
          </Group>
          {(stats.rooms > 0 || stats.floors > 0) && (
            <Text size="xs" c="dimmed" mt={4}>
              {[
                stats.floors > 0 && `${stats.floors} ${t("floors", "floors")}`,
                stats.rooms > 0 && `${stats.rooms} ${t("rooms", "rooms")}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
        </Box>
      )}

      {/* ── BED STATUS ─────────────────────────────────────────────────── */}
      {node.type === LocationType.BED && (
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
              color={
                node.status === "occupied"
                  ? "indigo"
                  : node.status === "maintenance"
                    ? "orange"
                    : "green"
              }
              variant="light"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              {t(`bed_status.${node.status}`, node.status || "—")}
            </Badge>
            {node.status === "occupied" && node.residentName && (
              <Group gap="xs">
                <ThemeIcon size="md" variant="light" color="indigo" radius="xl">
                  <IconUser size={14} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">
                    {t("resident", "Resident")}
                  </Text>
                  <Text fw={600} size="sm">
                    {node.residentName}
                  </Text>
                </Stack>
              </Group>
            )}
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
            {node.roomTypeId && (
              <Badge color="teal" variant="light" size="sm">
                {isTr && node.roomTypeNameTr
                  ? node.roomTypeNameTr
                  : node.roomTypeName || `Type #${node.roomTypeId}`}
              </Badge>
            )}
            {node.type === LocationType.ROOM && !node.roomTypeId && (
              <Badge color="yellow" variant="outline" size="sm">
                {t("no_room_type", "No room type")}
              </Badge>
            )}
            {node.isTrOnly && (
              <Badge color="red" variant="dot" size="sm">
                TR Only
              </Badge>
            )}
            {node.isForeignerOnly && (
              <Badge color="grape" variant="dot" size="sm">
                INT Only
              </Badge>
            )}
            {node.isGuestZone && (
              <Badge color="orange" variant="dot" size="sm">
                {t("is_guest_zone_label", "Guest Zone")}
              </Badge>
            )}
            {node.isRectorate && (
              <Badge color="violet" variant="dot" size="sm">
                {t("rectorate", "Rectorate")}
              </Badge>
            )}
            {node.studentYearLock && (
              <Badge color="indigo" variant="outline" size="sm">
                {node.studentYearLock === "new"
                  ? t("student_year_lock_new", "New students")
                  : t("student_year_lock_current", "Current students")}
              </Badge>
            )}
          </Group>
        </Box>
      )}

      {/* ── CONTENT TABS ───────────────────────────────────────────────── */}
      <Tabs
        defaultValue={defaultTab}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Tabs.List px="xl" style={{ flexShrink: 0 }}>
          {node.type !== LocationType.BED && (
            <Tabs.Tab
              value="children"
              leftSection={<LocationIcon type={node.type} size={14} />}
            >
              {childrenTabLabel}
              {childrenCount > 0 && (
                <Badge size="xs" circle ml="xs" variant="light" color="gray">
                  {childrenCount}
                </Badge>
              )}
            </Tabs.Tab>
          )}
          {showInventory && (
            <Tabs.Tab value="inventory" leftSection={<IconBox size={14} />}>
              {t("inventory", "Inventory")}
              {inventoryAssignments.length > 0 && (
                <Badge size="xs" circle ml="xs" variant="light" color="gray">
                  {inventoryAssignments.length}
                </Badge>
              )}
            </Tabs.Tab>
          )}
        </Tabs.List>

        <ScrollArea style={{ flex: 1 }}>
          {/* ── Children / Beds panel ── */}
          {node.type !== LocationType.BED && (
            <Tabs.Panel value="children">
              <Box p="xl">
                {node.type === LocationType.ROOM ? (
                  <>
                    {roomBeds.length > 0 && (
                      <Group justify="flex-end" mb="sm">
                        <Checkbox
                          size="xs"
                          label={t("select_all", "Select All")}
                          checked={allChildrenSelected}
                          indeterminate={someChildrenSelected}
                          onChange={onToggleSelectAllBeds}
                        />
                      </Group>
                    )}
                    {roomBeds.length > 0 ? (
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                        {roomBeds.map((bed) => {
                          const gId = `bed-${bed.id}`;
                          return (
                            <BedCard
                              key={bed.id}
                              id={bed.id}
                              label={bed.label}
                              status={bed.status}
                              residentName={bed.residentName}
                              isTrOnly={bed.isTrOnly}
                              isGuestZone={bed.isGuestZone}
                              isRectorate={bed.isRectorate}
                              isForeignerOnly={bed.isForeignerOnly}
                              selected={selectedIds.includes(gId)}
                              onClick={() =>
                                onSelectBedNode?.({
                                  ...bed,
                                  id: gId,
                                  name: bed.label,
                                  type: LocationType.BED,
                                  children: [],
                                })
                              }
                              onSelect={() => onToggleBedSelection?.(gId)}
                              onEdit={() => onEditBed?.(bed)}
                              onDelete={() => onDeleteBed?.(bed)}
                              onBook={() => {
                                onSelectBedNode?.({
                                  ...bed,
                                  id: gId,
                                  name: bed.label,
                                  type: LocationType.BED,
                                  children: [],
                                });
                                onBookBed?.(bed);
                              }}
                            />
                          );
                        })}
                      </SimpleGrid>
                    ) : (
                      <EmptyState title={t("no_beds_found", "No beds found")} />
                    )}
                  </>
                ) : (
                  <>
                    {locationChildren.length > 0 && (
                      <Group justify="flex-end" mb="sm">
                        <Checkbox
                          size="xs"
                          label={t("select_all", "Select All")}
                          checked={allChildrenSelected}
                          indeterminate={someChildrenSelected}
                          onChange={onToggleSelectAllChildren}
                        />
                      </Group>
                    )}
                    {locationChildren.length > 0 ? (
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                        {locationChildren.map((child) => {
                          const gId =
                            child.type === LocationType.BED
                              ? `bed-${child.id}`
                              : `loc-${child.id}`;
                          if (child.type === LocationType.ROOM) {
                            const childBeds = (child.children || []).filter(
                              (b: any) => b.type === LocationType.BED,
                            );
                            const occupiedBeds = childBeds.filter(
                              (b: any) => b.status === "occupied",
                            ).length;
                            return (
                              <RoomCard
                                key={child.id}
                                id={Number(child.id)}
                                name={
                                  isTr && child.nameTr
                                    ? child.nameTr
                                    : child.name
                                }
                                genderLock={child.genderLock || undefined}
                                roomTypeName={
                                  isTr && child.roomTypeNameTr
                                    ? child.roomTypeNameTr
                                    : child.roomTypeName || undefined
                                }
                                totalBeds={childBeds.length || undefined}
                                occupiedBeds={occupiedBeds}
                                isTrOnly={child.isTrOnly}
                                isGuestZone={child.isGuestZone}
                                isRectorate={child.isRectorate}
                                isForeignerOnly={child.isForeignerOnly}
                                studentYearLock={
                                  child.studentYearLock || undefined
                                }
                                selected={selectedIds.includes(gId)}
                                onClick={() => onSelectChild?.(child)}
                                onSelect={() => onToggleChildSelection?.(gId)}
                                onEdit={() => onEditChild?.(child)}
                                onDelete={() => onDeleteChild?.(child)}
                              />
                            );
                          }
                          return (
                            <GenericLocationCard
                              key={child.id}
                              id={Number(child.id)}
                              name={
                                isTr && child.nameTr ? child.nameTr : child.name
                              }
                              icon={<LocationIcon type={child.type} />}
                              childCount={child.children?.length}
                              selected={selectedIds.includes(gId)}
                              onClick={() => onSelectChild?.(child)}
                              onSelect={() => onToggleChildSelection?.(gId)}
                              onEdit={() => onEditChild?.(child)}
                              onDelete={() => onDeleteChild?.(child)}
                            />
                          );
                        })}
                      </SimpleGrid>
                    ) : (
                      <EmptyState title={t("no_sub_locations")} />
                    )}
                  </>
                )}
              </Box>
            </Tabs.Panel>
          )}

          {/* ── Inventory panel ── */}
          {showInventory &&
            onAddInventory &&
            onRemoveInventory &&
            onUpdateInventoryQuantity && (
              <Tabs.Panel value="inventory">
                <Box p="xl">
                  <InventoryAssignmentList
                    data={inventoryAssignments}
                    loading={inventoryLoading}
                    onAddClick={onAddInventory}
                    onRemove={onRemoveInventory}
                    onUpdateQuantity={onUpdateInventoryQuantity}
                    onApplyTemplate={onApplyTemplate}
                  />
                </Box>
              </Tabs.Panel>
            )}
        </ScrollArea>
      </Tabs>
    </Paper>
  );
}
