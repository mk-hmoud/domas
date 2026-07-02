import { memo, useMemo, useRef } from "react";
import {
  Table,
  Badge,
  Group,
  Text,
  Tooltip,
  Progress,
  Stack,
  Checkbox,
  Button,
  TextInput,
  Select,
  UnstyledButton,
  ActionIcon,
  Pill,
} from "@mantine/core";
import {
  IconHierarchy,
  IconMail,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconX,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import {
  Location,
  GenderType,
  Bed,
  BedStatus,
  LocationType,
  RoomType,
} from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { LocationIcon } from "../LocationIcon";
import { EmptyState } from "../../EmptyState";
import classes from "../../Table/table.module.css";

interface LocationRegistryTableProps {
  mode: "locations" | "beds";
  data: (Location | Bed | any)[];
  filters: any;
  totalCount: number;
  onFilterChange: (key: string, value: any) => void;
  onBatchFilterChange: (updates: Record<string, any>) => void;
  onClearFilters: () => void;
  onOpenDetail: (item: any) => void;
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onEmailResidents?: (locationId: number) => void;
  selectedIds: (number | string)[];
  onToggleSelection: (id: number | string) => void;
  onToggleSelectAll: () => void;
  onSelectAllMatching?: () => void;
  allMatchingSelected?: boolean;
  roomTypes?: RoomType[];
}

interface TableHandlers {
  onFilterChange: (key: string, value: any) => void;
  onBatchFilterChange: (updates: Record<string, any>) => void;
  onClearFilters: () => void;
  onOpenDetail: (item: any) => void;
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onEmailResidents?: (locationId: number) => void;
  onToggleSelection: (id: number | string) => void;
  onToggleSelectAll: () => void;
  onSelectAllMatching?: () => void;
}

function globalId(item: any): string {
  return item.type === "bed" ? `bed-${item.id}` : `loc-${item.id}`;
}

function getGenderColor(gender?: string) {
  if (gender === "male") return "blue";
  if (gender === "female") return "pink";
  return "gray";
}

function getBedStatusColor(status?: string) {
  if (status === "available") return "green";
  if (status === "occupied") return "blue";
  if (status === "maintenance") return "orange";
  return "gray";
}

const filterRowStyle: React.CSSProperties = {
  background:
    "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-7))",
};

const thFilterStyle: React.CSSProperties = {
  padding: "6px 8px",
  fontWeight: "normal",
  textTransform: "none",
  letterSpacing: 0,
};

// ── Memoized row — only re-renders when isSelected or item reference changes ──

const RegistryRow = memo(
  function RegistryRow({
    item,
    isSelected,
    mode,
    handlersRef,
  }: {
    item: any;
    isSelected: boolean;
    mode: "locations" | "beds";
    handlersRef: React.MutableRefObject<TableHandlers>;
  }) {
    const { t, i18n } = useTranslation();
    const isTr = i18n.language === "tr";
    const gId = globalId(item);
    const isBed = item.type === "bed";
    const total = item.totalBeds || 0;
    const occupied = item.occupiedBeds || 0;
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

    return (
      <Table.Tr
        style={{ cursor: "pointer" }}
        bg={isSelected ? "var(--mantine-color-blue-light)" : undefined}
        onClick={() => handlersRef.current.onOpenDetail(item)}
      >
        <Table.Td onClick={(e) => e.stopPropagation()} style={{ width: 40 }}>
          <Checkbox
            size="xs"
            checked={isSelected}
            onChange={() => handlersRef.current.onToggleSelection(gId)}
          />
        </Table.Td>

        <Table.Td>
          <Group gap="xs" wrap="nowrap">
            <LocationIcon type={item.type as any} />
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {isBed
                  ? `${item.locationName} — ${item.label}`
                  : isTr && item.nameTr
                    ? item.nameTr
                    : item.name}
              </Text>
              {item.locationPath && (
                <Text size="xs" c="dimmed" truncate>
                  {item.locationPath}
                </Text>
              )}
            </Stack>
          </Group>
        </Table.Td>

        {mode === "locations" && (
          <Table.Td style={{ width: 100 }}>
            <Badge size="xs" variant="light" color="gray">
              {t(`location_type.${item.type}`, item.type) as string}
            </Badge>
          </Table.Td>
        )}

        <Table.Td style={{ width: 90 }}>
          {item.genderLock ? (
            <Badge
              size="xs"
              color={getGenderColor(item.genderLock)}
              variant="dot"
            >
              {t(`gender.${item.genderLock}`, item.genderLock) as string}
            </Badge>
          ) : (
            <Text size="xs" c="dimmed">
              —
            </Text>
          )}
        </Table.Td>

        {mode === "locations" && (
          <Table.Td style={{ width: 140 }}>
            {item.roomTypeName ? (
              <Text size="xs" c="teal" fw={500} truncate>
                {isTr && item.roomTypeNameTr
                  ? item.roomTypeNameTr
                  : item.roomTypeName}
              </Text>
            ) : (
              <Text size="xs" c="dimmed">
                —
              </Text>
            )}
          </Table.Td>
        )}

        <Table.Td style={{ width: 130 }}>
          <Group gap={4} wrap="wrap">
            {item.isTrOnly && (
              <Badge size="xs" variant="dot" color="red">
                TR
              </Badge>
            )}
            {item.isForeignerOnly && (
              <Badge size="xs" variant="dot" color="grape">
                INT
              </Badge>
            )}
            {item.isGuestZone && (
              <Badge size="xs" variant="dot" color="orange">
                {t("is_guest_zone_label", "Guest")}
              </Badge>
            )}
            {item.isRectorate && (
              <Badge size="xs" variant="dot" color="violet">
                {t("rectorate", "Rect")}
              </Badge>
            )}
            {!item.isTrOnly &&
              !item.isForeignerOnly &&
              !item.isGuestZone &&
              !item.isRectorate && (
                <Text size="xs" c="dimmed">
                  —
                </Text>
              )}
          </Group>
        </Table.Td>

        <Table.Td style={{ width: 150 }}>
          {isBed ? (
            <Stack gap={2}>
              <Badge
                size="xs"
                color={getBedStatusColor(item.status)}
                variant="light"
              >
                {t(`bed_status.${item.status}`, item.status || "—") as string}
              </Badge>
              {item.residentName && (
                <Text size="xs" c="dimmed" truncate style={{ maxWidth: 130 }}>
                  {item.residentName}
                </Text>
              )}
            </Stack>
          ) : total > 0 ? (
            <Stack gap={4}>
              <Group justify="space-between" gap={4}>
                <Text size="xs" c="dimmed">
                  {occupied}/{total}
                </Text>
                <Text
                  size="xs"
                  fw={700}
                  c={
                    occupancyRate === 100
                      ? "red"
                      : occupancyRate > 80
                        ? "orange"
                        : "blue"
                  }
                >
                  {Math.round(occupancyRate)}%
                </Text>
              </Group>
              <Progress
                value={occupancyRate}
                size="xs"
                color={
                  occupancyRate === 100
                    ? "red"
                    : occupancyRate > 80
                      ? "orange"
                      : "blue"
                }
                radius="xl"
              />
            </Stack>
          ) : (
            <Text size="xs" c="dimmed">
              —
            </Text>
          )}
        </Table.Td>

        <Table.Td onClick={(e) => e.stopPropagation()} style={{ width: 140 }}>
          <Group gap={4} justify="flex-end" wrap="nowrap">
            {!isBed && handlersRef.current.onEmailResidents && (
              <Tooltip label={t("email_residents", "Email Residents")}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="blue"
                  onClick={() =>
                    handlersRef.current.onEmailResidents!(item.id as number)
                  }
                >
                  <IconMail size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={t("locate_in_structure", "Locate in Structure")}>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="gray"
                onClick={() => handlersRef.current.onView(item)}
              >
                <IconHierarchy size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("edit", "Edit")}>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="blue"
                onClick={() => handlersRef.current.onEdit(item)}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("delete", "Delete")}>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="red"
                onClick={() => handlersRef.current.onDelete(item)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.item === next.item &&
    prev.mode === next.mode,
);

// ── Main component ─────────────────────────────────────────────────────────────

function LocationRegistryTableInner({
  mode,
  data,
  filters,
  totalCount,
  onFilterChange,
  onBatchFilterChange,
  onClearFilters,
  onOpenDetail,
  onView,
  onEdit,
  onDelete,
  onEmailResidents,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  onSelectAllMatching,
  allMatchingSelected,
  roomTypes = [],
}: LocationRegistryTableProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  // Always-current handlers — rows read from this ref so they never hold stale closures
  const handlersRef = useRef<TableHandlers>({
    onFilterChange,
    onBatchFilterChange,
    onClearFilters,
    onOpenDetail,
    onView,
    onEdit,
    onDelete,
    onEmailResidents,
    onToggleSelection,
    onToggleSelectAll,
    onSelectAllMatching,
  });
  handlersRef.current = {
    onFilterChange,
    onBatchFilterChange,
    onClearFilters,
    onOpenDetail,
    onView,
    onEdit,
    onDelete,
    onEmailResidents,
    onToggleSelection,
    onToggleSelectAll,
    onSelectAllMatching,
  };

  // O(1) selection lookup instead of O(n) array.includes per row
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allSelected =
    data.length > 0 && data.every((item) => selectedSet.has(globalId(item)));
  const someSelected =
    data.some((item) => selectedSet.has(globalId(item))) && !allSelected;

  const colCount = mode === "locations" ? 8 : 7;

  const handleSort = (field: string) => {
    if (filters.orderBy === field) {
      if (filters.orderDir !== "desc") {
        onBatchFilterChange({ orderBy: field, orderDir: "desc" });
      } else {
        onBatchFilterChange({ orderBy: undefined, orderDir: undefined });
      }
    } else {
      onBatchFilterChange({ orderBy: field, orderDir: "asc" });
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.orderBy !== field)
      return <IconSelector size={12} opacity={0.35} />;
    if (filters.orderDir === "desc") return <IconChevronDown size={12} />;
    return <IconChevronUp size={12} />;
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <UnstyledButton
      onClick={() => handleSort(field)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
      }}
    >
      <span>{children}</span>
      <SortIcon field={field} />
    </UnstyledButton>
  );

  const toggleFlag = (key: string) => {
    onFilterChange(key, filters[key] ? undefined : true);
  };

  const FlagToggle = ({
    filterKey,
    label,
    color,
  }: {
    filterKey: string;
    label: string;
    color: string;
  }) => (
    <Badge
      size="xs"
      variant={filters[filterKey] ? "filled" : "outline"}
      color={color}
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={() => toggleFlag(filterKey)}
    >
      {label}
    </Badge>
  );

  const activeChips: { prefix: string; label: string; key: string }[] = [
    filters.q && {
      key: "q",
      prefix: t("search", "Search"),
      label: `"${filters.q}"`,
    },
    filters.type && {
      key: "type",
      prefix: t("type", "Type"),
      label: t(`location_type.${filters.type}`, filters.type) as string,
    },
    filters.genderLock && {
      key: "genderLock",
      prefix: t("gender_lock", "Gender"),
      label: t(`gender.${filters.genderLock}`, filters.genderLock) as string,
    },
    filters.roomTypeId && {
      key: "roomTypeId",
      prefix: t("room_type", "Room Type"),
      label:
        (isTr
          ? roomTypes.find((rt) => rt.id === Number(filters.roomTypeId))?.nameTr
          : undefined) ||
        roomTypes.find((rt) => rt.id === Number(filters.roomTypeId))?.name ||
        `#${filters.roomTypeId}`,
    },
    filters.isTrOnly && {
      key: "isTrOnly",
      prefix: t("flags", "Flag"),
      label: "TR Only",
    },
    filters.isForeignerOnly && {
      key: "isForeignerOnly",
      prefix: t("flags", "Flag"),
      label: "INT Only",
    },
    filters.isGuestZone && {
      key: "isGuestZone",
      prefix: t("flags", "Flag"),
      label: t("is_guest_zone_label", "Guest Zone"),
    },
    filters.isRectorate !== undefined && {
      key: "isRectorate",
      prefix: t("flags", "Flag"),
      label: filters.isRectorate
        ? t("rectorate", "Rectorate")
        : t("dorm", "Dorm"),
    },
    filters.onlyVacant && {
      key: "onlyVacant",
      prefix: t("availability", "Availability"),
      label: t("only_vacant", "Vacant Only"),
    },
    filters.status && {
      key: "status",
      prefix: t("status", "Status"),
      label: t(`bed_status.${filters.status}`, filters.status) as string,
    },
  ].filter(Boolean) as { prefix: string; label: string; key: string }[];

  const roomTypeOptions = roomTypes.map((rt) => ({
    value: String(rt.id),
    label: (isTr && rt.nameTr ? rt.nameTr : rt.name) + ` (${rt.capacity})`,
  }));

  const genderOptions = [
    { value: GenderType.MALE, label: t("male", "Male") },
    { value: GenderType.FEMALE, label: t("female", "Female") },
  ];

  const typeOptions = [
    LocationType.CAMPUS,
    LocationType.BUILDING,
    LocationType.BLOCK,
    LocationType.FLOOR,
    LocationType.ROOM,
  ].map((v) => ({ value: v, label: t(`location_type.${v}`, v) }));

  const statusOptions = Object.values(BedStatus).map((s) => ({
    value: s,
    label: t(`bed_status.${s}`, s),
  }));

  return (
    <>
      {activeChips.length > 0 && (
        <Group gap="xs" mb="xs" wrap="wrap" align="center">
          <Text size="xs" c="dimmed" fw={500}>
            {t("filters", "Filters")}:
          </Text>
          {activeChips.map((chip) => (
            <Pill
              key={chip.key}
              withRemoveButton
              onRemove={() => onFilterChange(chip.key, undefined)}
              size="sm"
            >
              <Text component="span" size="xs" c="dimmed">
                {chip.prefix}:{" "}
              </Text>
              <Text component="span" size="xs" fw={500}>
                {chip.label}
              </Text>
            </Pill>
          ))}
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconX size={10} />}
            onClick={onClearFilters}
          >
            {t("clear_all", "Clear all")}
          </Button>
        </Group>
      )}

      <Table.ScrollContainer minWidth={860} type="native">
        <Table stickyHeader highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr className={classes.thead}>
              <Table.Th className={classes.th} style={{ width: 40 }}>
                <Checkbox
                  size="xs"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleSelectAll}
                />
              </Table.Th>
              <Table.Th className={classes.th}>
                <SortableHeader field="name">{t("name")}</SortableHeader>
              </Table.Th>
              {mode === "locations" && (
                <Table.Th className={classes.th} style={{ width: 100 }}>
                  {t("type", "Type")}
                </Table.Th>
              )}
              <Table.Th className={classes.th} style={{ width: 90 }}>
                {t("gender_lock", "Gender")}
              </Table.Th>
              {mode === "locations" && (
                <Table.Th className={classes.th} style={{ width: 140 }}>
                  {t("room_type", "Room Type")}
                </Table.Th>
              )}
              <Table.Th className={classes.th} style={{ width: 130 }}>
                {t("flags", "Flags")}
              </Table.Th>
              <Table.Th className={classes.th} style={{ width: 150 }}>
                <SortableHeader field="occupancy">
                  {mode === "locations"
                    ? t("occupancy", "Occupancy")
                    : t("status", "Status")}
                </SortableHeader>
              </Table.Th>
              <Table.Th className={classes.th} style={{ width: 120 }} />
            </Table.Tr>

            <Table.Tr style={filterRowStyle}>
              <Table.Th style={thFilterStyle} />
              <Table.Th style={thFilterStyle}>
                <TextInput
                  size="xs"
                  placeholder={t("search_placeholder", "Search…")}
                  value={filters.q || ""}
                  onChange={(e) =>
                    onFilterChange("q", e.currentTarget.value || undefined)
                  }
                  styles={{ input: { minWidth: 120 } }}
                />
              </Table.Th>
              {mode === "locations" && (
                <Table.Th style={thFilterStyle}>
                  <Select
                    size="xs"
                    placeholder={t("all", "All")}
                    data={typeOptions}
                    value={filters.type || null}
                    onChange={(v) => onFilterChange("type", v || undefined)}
                    clearable
                    styles={{ input: { minWidth: 90 } }}
                  />
                </Table.Th>
              )}
              <Table.Th style={thFilterStyle}>
                <Select
                  size="xs"
                  placeholder={t("all", "All")}
                  data={genderOptions}
                  value={filters.genderLock || null}
                  onChange={(v) => onFilterChange("genderLock", v || undefined)}
                  clearable
                  styles={{ input: { minWidth: 80 } }}
                />
              </Table.Th>
              {mode === "locations" && (
                <Table.Th style={thFilterStyle}>
                  <Select
                    size="xs"
                    placeholder={t("all", "All")}
                    data={roomTypeOptions}
                    value={
                      filters.roomTypeId ? String(filters.roomTypeId) : null
                    }
                    onChange={(v) =>
                      onFilterChange("roomTypeId", v ? Number(v) : undefined)
                    }
                    clearable
                    styles={{ input: { minWidth: 120 } }}
                  />
                </Table.Th>
              )}
              <Table.Th style={thFilterStyle}>
                <Group gap={4} wrap="wrap">
                  <FlagToggle filterKey="isTrOnly" label="TR" color="red" />
                  <FlagToggle
                    filterKey="isForeignerOnly"
                    label="INT"
                    color="grape"
                  />
                  <FlagToggle
                    filterKey="isGuestZone"
                    label={t("is_guest_zone_label", "Guest")}
                    color="orange"
                  />
                  <FlagToggle
                    filterKey="isRectorate"
                    label={t("rectorate", "Rect")}
                    color="violet"
                  />
                </Group>
              </Table.Th>
              <Table.Th style={thFilterStyle}>
                {mode === "locations" ? (
                  <Checkbox
                    size="xs"
                    label={t("only_vacant", "Vacant")}
                    checked={filters.onlyVacant === true}
                    onChange={(e) =>
                      onFilterChange(
                        "onlyVacant",
                        e.currentTarget.checked || undefined,
                      )
                    }
                  />
                ) : (
                  <Select
                    size="xs"
                    placeholder={t("all", "All")}
                    data={statusOptions}
                    value={filters.status || null}
                    onChange={(v) => onFilterChange("status", v || undefined)}
                    clearable
                    styles={{ input: { minWidth: 100 } }}
                  />
                )}
              </Table.Th>
              <Table.Th style={thFilterStyle} />
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {allSelected && data.length > 0 && totalCount > data.length && (
              <Table.Tr>
                <Table.Td
                  colSpan={colCount}
                  style={{
                    textAlign: "center",
                    background:
                      "light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-6))",
                    padding: "8px 12px",
                  }}
                >
                  {allMatchingSelected ? (
                    <Group justify="center" gap="xs">
                      <Text size="sm">
                        {t("all_matching_selected", {
                          count: totalCount,
                          defaultValue: `All ${totalCount} results are selected.`,
                        })}
                      </Text>
                      {onSelectAllMatching && (
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          onClick={onSelectAllMatching}
                        >
                          {t("clear_selection", "Clear selection")}
                        </Button>
                      )}
                    </Group>
                  ) : (
                    <Group justify="center" gap="xs">
                      <Text size="sm">
                        {t("page_selected", {
                          count: data.length,
                          defaultValue: `All ${data.length} on this page are selected.`,
                        })}
                      </Text>
                      {onSelectAllMatching && (
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          onClick={onSelectAllMatching}
                        >
                          {t("select_all_matching", {
                            count: totalCount,
                            defaultValue: `Select all ${totalCount} results`,
                          })}
                        </Button>
                      )}
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            )}

            {data.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={colCount} style={{ padding: 0 }}>
                  <EmptyState
                    title={t("no_records_found", "No records found")}
                  />
                </Table.Td>
              </Table.Tr>
            ) : (
              data.map((item) => (
                <RegistryRow
                  key={globalId(item)}
                  item={item}
                  isSelected={selectedSet.has(globalId(item))}
                  mode={mode}
                  handlersRef={handlersRef}
                />
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}

// Only re-render when table data, filters, or selection actually change.
// Callback prop reference changes (from parent re-renders) are ignored since
// all handlers are accessed through handlersRef at call time.
export const LocationRegistryTable = memo(
  LocationRegistryTableInner,
  (prev, next) =>
    prev.data === next.data &&
    prev.filters === next.filters &&
    prev.totalCount === next.totalCount &&
    prev.selectedIds === next.selectedIds &&
    prev.allMatchingSelected === next.allMatchingSelected &&
    prev.roomTypes === next.roomTypes &&
    prev.mode === next.mode,
);
