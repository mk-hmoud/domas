import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Loader,
  Overlay,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@domas/ui';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBed,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCoin,
  IconFilter,
  IconHome,
  IconInfoCircle,
  IconLayoutGrid,
  IconMapPin,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import {
  BedWithOccupancy,
  PortalBuilding,
  PortalSemester,
  RoomTypeCatalogItem,
} from '@domas/ts-types';
import { portalBookings, portalSemesters } from '@domas/api-client';
import { useCurrentBooking } from '../hooks/useCurrentBooking';

// ─── Filters state type ───────────────────────────────────────────────────────

interface Filters {
  buildingId: number | null;
  capacity: number | null;
}

// ─── Step 0: Semester picker ──────────────────────────────────────────────────

function SemesterStep({
  semesters,
  selected,
  onSelect,
}: {
  semesters: PortalSemester[];
  selected: PortalSemester | null;
  onSelect: (s: PortalSemester) => void;
}) {
  const { t } = useTranslation();

  if (semesters.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        {t('portal.no_semesters_description')}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('portal.select_semester_hint')}
      </Text>
      {semesters.map((s) => {
        const isSelected = selected?.id === s.id;

        const daysUntilDeadline = s.bookingEndDate
          ? Math.ceil((new Date(s.bookingEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7;

        return (
          <Paper
            key={s.id}
            radius="lg"
            withBorder
            style={{
              cursor: 'pointer',
              borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
              borderWidth: isSelected ? 2 : 1,
              transition: 'border-color 0.15s ease',
            }}
            onClick={() => onSelect(s)}
          >
            <Group wrap="nowrap" gap={0}>
              <Box
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  background: isSelected
                    ? 'var(--mantine-color-blue-5)'
                    : 'var(--mantine-color-default-border)',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}
              />

              <Box p="lg" style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box style={{ flex: 1 }}>
                    <Group gap="sm" mb={10} wrap="nowrap">
                      <ThemeIcon
                        size={38}
                        radius="md"
                        variant="light"
                        color="blue"
                        style={{ flexShrink: 0 }}
                      >
                        <IconCalendar size={18} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={700} size="md" lh={1.2}>
                          {s.displayName}
                        </Text>
                        <Text size="xs" c="dimmed" tt="capitalize">
                          {s.type.replace(/_/g, ' ')} semester
                        </Text>
                      </Box>
                    </Group>

                    <Group gap="xl" wrap="wrap">
                      <Group gap={5}>
                        <IconClock size={13} color="var(--mantine-color-dimmed)" />
                        <Text size="xs" c="dimmed">
                          {new Date(s.startDate).toLocaleDateString()} –{' '}
                          {new Date(s.endDate).toLocaleDateString()}
                        </Text>
                      </Group>
                      <Group gap={5}>
                        <IconCoin size={13} color="var(--mantine-color-dimmed)" />
                        <Text size="xs" c="dimmed">
                          {t('portal.deposit_label')}:{' '}
                          {s.depositAmountTry > 0
                            ? `₺${s.depositAmountTry.toLocaleString()}`
                            : `${s.depositAmountForeign} ${s.foreignCurrencyCode}`}
                        </Text>
                      </Group>
                    </Group>
                  </Box>

                  <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
                    {isUrgent && daysUntilDeadline !== null && (
                      <Badge color="red" variant="light" size="sm">
                        {daysUntilDeadline <= 0 ? 'Deadline passed' : `${daysUntilDeadline}d left`}
                      </Badge>
                    )}
                    {s.bookingEndDate && !isUrgent && (
                      <Badge color="orange" variant="light" size="sm">
                        {t('portal.apply_by')} {new Date(s.bookingEndDate).toLocaleDateString()}
                      </Badge>
                    )}
                    {isSelected ? (
                      <ThemeIcon size={30} radius="xl" variant="filled" color="blue">
                        <IconCheck size={16} />
                      </ThemeIcon>
                    ) : (
                      <Box
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: '2px solid var(--mantine-color-default-border)',
                        }}
                      />
                    )}
                  </Stack>
                </Group>
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}

// ─── Step 1: Filters ──────────────────────────────────────────────────────────

function FiltersStep({
  buildings,
  capacities,
  filters,
  onChange,
}: {
  buildings: PortalBuilding[];
  capacities: number[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const { t } = useTranslation();
  const showBuildingCards = buildings.length > 0 && buildings.length <= 6;

  const buildingData = buildings.map((b) => ({
    value: String(b.id),
    label: `${b.name} (${b.availableBedCount} ${b.availableBedCount === 1 ? 'bed' : 'beds'})`,
  }));

  const activeFilterCount =
    (filters.buildingId != null ? 1 : 0) + (filters.capacity != null ? 1 : 0);

  return (
    <Stack gap="xl">
      {/* Building */}
      <Box>
        <Group gap={6} mb="sm">
          <ThemeIcon size={22} radius="sm" variant="light" color="blue">
            <IconBuilding size={13} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            {t('portal.filter_building', { defaultValue: 'Building preference' })}
          </Text>
          {filters.buildingId != null && (
            <Badge size="xs" color="blue" variant="light">
              Active
            </Badge>
          )}
        </Group>

        {buildings.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('portal.no_buildings', {
              defaultValue: 'No building information is available for this semester.',
            })}
          </Text>
        ) : showBuildingCards ? (
          <SimpleGrid cols={{ base: 2, xs: 3 } as any} spacing="sm">
            {buildings.map((b) => {
              const isSelected = filters.buildingId === b.id;
              const isEmpty = b.availableBedCount === 0;
              return (
                <Paper
                  key={b.id}
                  withBorder
                  radius="lg"
                  p="md"
                  style={{
                    cursor: isEmpty ? 'not-allowed' : 'pointer',
                    borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: isEmpty && !isSelected ? 0.5 : 1,
                    transition: 'border-color 0.15s ease',
                    textAlign: 'center',
                  }}
                  onClick={() =>
                    !isEmpty && onChange({ ...filters, buildingId: isSelected ? null : b.id })
                  }
                >
                  <Stack align="center" gap={6}>
                    <ThemeIcon
                      size={36}
                      radius="md"
                      variant="light"
                      color={isEmpty ? 'gray' : 'blue'}
                    >
                      <IconBuilding size={18} />
                    </ThemeIcon>
                    <Text size="xs" fw={600} lineClamp={1}>
                      {b.name}
                    </Text>
                    <Badge size="xs" color={isEmpty ? 'red' : 'teal'} variant="light">
                      {b.availableBedCount} {b.availableBedCount === 1 ? 'bed' : 'beds'}
                    </Badge>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        ) : (
          <Select
            placeholder={t('portal.filter_building_any', { defaultValue: 'Any building' })}
            clearable
            data={buildingData}
            value={filters.buildingId != null ? String(filters.buildingId) : null}
            onChange={(v) =>
              onChange({ ...filters, buildingId: v != null ? parseInt(v, 10) : null })
            }
            radius="md"
            leftSection={<IconBuilding size={14} />}
          />
        )}
      </Box>

      {/* Capacity */}
      <Box>
        <Group gap={6} mb="sm">
          <ThemeIcon size={22} radius="sm" variant="light" color="blue">
            <IconUsers size={13} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            {t('portal.filter_capacity', { defaultValue: 'Beds per room' })}
          </Text>
          {filters.capacity != null && (
            <Badge size="xs" color="blue" variant="light">
              Active
            </Badge>
          )}
        </Group>

        {capacities.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('portal.no_capacities', {
              defaultValue: 'Room size information is not available for this semester.',
            })}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 3, xs: 6 } as any} spacing="sm">
            {capacities.map((value) => {
              const isSelected = filters.capacity === value;
              return (
                <Paper
                  key={value}
                  withBorder
                  radius="lg"
                  p="sm"
                  style={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                    borderWidth: isSelected ? 2 : 1,
                    transition: 'border-color 0.15s ease',
                  }}
                  onClick={() =>
                    onChange({ ...filters, capacity: filters.capacity === value ? null : value })
                  }
                >
                  <Text fw={800} size="lg" c={isSelected ? 'blue' : undefined} lh={1.1}>
                    {value}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {value === 1 ? 'person' : 'people'}
                  </Text>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {activeFilterCount > 0 && (
        <Group>
          <Button
            variant="subtle"
            size="xs"
            color="gray"
            leftSection={<IconX size={12} />}
            onClick={() => onChange({ buildingId: null, capacity: null })}
          >
            {t('portal.clear_filters', { defaultValue: 'Clear all filters' })}
          </Button>
        </Group>
      )}
    </Stack>
  );
}

// ─── Step 2: Room Type Catalog ────────────────────────────────────────────────

function RoomCatalogStep({
  semesterId,
  filters,
  selected,
  onSelect,
}: {
  semesterId: number;
  filters: Filters;
  selected: RoomTypeCatalogItem | null;
  onSelect: (rt: RoomTypeCatalogItem | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const [catalog, setCatalog] = useState<RoomTypeCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    portalSemesters
      .getRoomCatalog(semesterId, { buildingId: filters.buildingId, capacity: filters.capacity })
      .then(setCatalog)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [semesterId, filters.buildingId, filters.capacity]);

  if (loading) {
    return (
      <SimpleGrid cols={{ base: 1, xs: 2 } as any} spacing="md">
        <Skeleton height={260} radius="lg" />
        <Skeleton height={260} radius="lg" />
        <Skeleton height={260} radius="lg" />
        <Skeleton height={260} radius="lg" />
      </SimpleGrid>
    );
  }

  if (catalog.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        {t('portal.no_room_types_catalog', {
          defaultValue:
            'No room type information is available for your current filters. Click Next to browse all available beds directly.',
        })}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('portal.catalog_hint', {
          defaultValue:
            'Select a room type to pre-filter beds. You can also skip and browse all beds.',
        })}
      </Text>

      <SimpleGrid cols={{ base: 1, xs: 2 } as any} spacing="md">
        {catalog.map((rt) => {
          const isSelected = selected?.id === rt.id;
          const heroUrl = rt.galleryUrls[0];
          const isSoldOut = rt.availableBedCount === 0;

          return (
            <Paper
              key={rt.id}
              radius="xl"
              withBorder
              style={{
                cursor: isSoldOut && !isSelected ? 'not-allowed' : 'pointer',
                overflow: 'hidden',
                borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                borderWidth: isSelected ? 2 : 1,
                opacity: isSoldOut && !isSelected ? 0.65 : 1,
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => !isSoldOut && onSelect(isSelected ? null : rt)}
            >
              {/* Hero image */}
              <Box style={{ position: 'relative', height: 170 }}>
                {heroUrl ? (
                  <>
                    <img
                      src={heroUrl}
                      alt={isTr && rt.nameTr ? rt.nameTr : rt.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <Overlay
                      gradient="linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)"
                      zIndex={1}
                    />
                  </>
                ) : (
                  <Box
                    style={{
                      height: '100%',
                      background:
                        'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconBed size={52} color="var(--mantine-color-dimmed)" />
                  </Box>
                )}

                {/* Name + price overlay */}
                <Box style={{ position: 'absolute', bottom: 12, left: 14, right: 14, zIndex: 2 }}>
                  <Group justify="space-between" align="flex-end" wrap="nowrap">
                    <Text fw={700} c="white" size="md" lh={1.2}>
                      {isTr && rt.nameTr ? rt.nameTr : rt.name}
                    </Text>
                    <Box ta="right" style={{ flexShrink: 0 }}>
                      <Text size="xs" c="white" style={{ opacity: 0.75 }} lh={1}>
                        from
                      </Text>
                      <Text fw={700} c="white" size="xl" lh={1.1}>
                        ₺{Number(rt.priceTry).toLocaleString()}
                      </Text>
                    </Box>
                  </Group>
                </Box>

                {/* Capacity badge */}
                <Box style={{ position: 'absolute', top: 10, left: 10, zIndex: 3 }}>
                  <Badge
                    size="sm"
                    variant="filled"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                    leftSection={<IconUsers size={10} />}
                  >
                    {rt.capacity === 1
                      ? t('portal.single_room', { defaultValue: 'Single' })
                      : rt.capacity === 2
                        ? t('portal.double_room', { defaultValue: 'Double' })
                        : t('portal.n_bed_room', { defaultValue: '{{n}}-bed', n: rt.capacity })}
                  </Badge>
                </Box>

                {/* Selected / sold-out badge */}
                <Box style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
                  {isSelected ? (
                    <ThemeIcon size={30} radius="xl" variant="filled" color="blue">
                      <IconCheck size={15} />
                    </ThemeIcon>
                  ) : isSoldOut ? (
                    <Badge color="red" variant="filled" size="sm">
                      Sold out
                    </Badge>
                  ) : null}
                </Box>
              </Box>

              {/* Card body */}
              <Box p="md">
                {(isTr && rt.descriptionTr ? rt.descriptionTr : rt.description) && (
                  <Text size="xs" c="dimmed" lineClamp={2} mb={10}>
                    {isTr && rt.descriptionTr ? rt.descriptionTr : rt.description}
                  </Text>
                )}

                {rt.amenities.length > 0 && (
                  <Group gap={4} mb={10} wrap="wrap">
                    {rt.amenities.slice(0, 4).map((a) => (
                      <Badge key={a} size="xs" variant="light" color="gray">
                        {a}
                      </Badge>
                    ))}
                    {rt.amenities.length > 4 && (
                      <Badge size="xs" variant="outline" color="gray">
                        +{rt.amenities.length - 4}
                      </Badge>
                    )}
                  </Group>
                )}

                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Box
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: isSoldOut
                          ? 'var(--mantine-color-red-5)'
                          : 'var(--mantine-color-teal-5)',
                        flexShrink: 0,
                      }}
                    />
                    <Text size="xs" fw={500} c={isSoldOut ? 'red' : 'teal'}>
                      {isSoldOut ? 'No beds available' : `${rt.availableBedCount} available`}
                    </Text>
                  </Group>
                  {rt.priceForeign != null && (
                    <Text size="xs" c="dimmed">
                      / {Number(rt.priceForeign).toLocaleString()} foreign
                    </Text>
                  )}
                </Group>
              </Box>
            </Paper>
          );
        })}
      </SimpleGrid>

      {!selected && catalog.length > 0 && (
        <Text size="xs" c="dimmed" ta="center">
          {t('portal.catalog_no_selection_hint', {
            defaultValue: 'No preference? Click Next to browse all available beds.',
          })}
        </Text>
      )}
    </Stack>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

// ─── Step 3: Bed picker ───────────────────────────────────────────────────────

function BedStep({
  semesterId,
  roomTypeId,
  roomTypeName,
  buildingName,
  selected,
  onSelect,
}: {
  semesterId: number;
  roomTypeId: number | null;
  roomTypeName: string | null;
  buildingName: string | null;
  selected: BedWithOccupancy | null;
  onSelect: (b: BedWithOccupancy) => void;
}) {
  const { t } = useTranslation();
  const [beds, setBeds] = useState<BedWithOccupancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setExpandedRooms(new Set());
    portalSemesters
      .getAllBeds(semesterId, roomTypeId)
      .then(setBeds)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [semesterId, roomTypeId]);

  useEffect(() => {
    if (selected) setExpandedRooms((prev) => new Set([...prev, selected.roomId]));
  }, [selected?.roomId]);

  const visibleBeds = useMemo(() => {
    if (!buildingName) return beds;
    return beds.filter((b) => b.locationPath.split(' > ').includes(buildingName));
  }, [beds, buildingName]);

  const rooms = useMemo(() => {
    const map = new Map<
      number,
      {
        roomId: number;
        roomName: string;
        locationPath: string;
        beds: BedWithOccupancy[];
        availableCount: number;
      }
    >();
    visibleBeds.forEach((bed) => {
      const entry = map.get(bed.roomId);
      if (entry) {
        entry.beds.push(bed);
        if (!bed.isTaken) entry.availableCount++;
      } else {
        const segments = bed.locationPath.split(' > ');
        const contextPath = segments.slice(1, -1).join(' › ');
        map.set(bed.roomId, {
          roomId: bed.roomId,
          roomName: bed.roomName,
          locationPath: contextPath,
          beds: [bed],
          availableCount: bed.isTaken ? 0 : 1,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.roomName.localeCompare(b.roomName));
  }, [visibleBeds]);

  const toggleRoom = (roomId: number) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Stack gap="sm">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={72} radius="lg" />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconX size={16} />} color="red" radius="md">
        {t('portal.beds_load_error')}
      </Alert>
    );
  }

  if (rooms.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
        {t('portal.no_beds_for_semester')}
      </Alert>
    );
  }

  const totalAvailable = rooms.reduce((s, r) => s + r.availableCount, 0);
  const totalBeds = rooms.reduce((s, r) => s + r.beds.length, 0);

  return (
    <Stack gap="md">
      {/* Summary bar */}
      <Paper radius="lg" p="sm" withBorder>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="md" wrap="wrap">
            <Group gap={5}>
              <Box
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-teal-5)',
                }}
              />
              <Text size="sm" fw={600} c="teal">
                {totalAvailable} beds free
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} · {totalBeds} total beds
            </Text>
          </Group>
          {roomTypeName && (
            <Badge
              size="sm"
              variant="light"
              color="blue"
              leftSection={<IconLayoutGrid size={10} />}
            >
              {roomTypeName}
            </Badge>
          )}
        </Group>
      </Paper>

      {rooms.map((room) => {
        const isExpanded = expandedRooms.has(room.roomId);
        const hasSelected = room.beds.some((b) => b.id === selected?.id);
        const isFull = room.availableCount === 0;
        const occupancyPct = Math.round(
          ((room.beds.length - room.availableCount) / room.beds.length) * 100,
        );

        return (
          <Paper
            key={room.roomId}
            radius="lg"
            withBorder
            style={{
              overflow: 'hidden',
              borderColor: hasSelected ? 'var(--mantine-color-blue-5)' : undefined,
              borderWidth: hasSelected ? 2 : 1,
              transition: 'border-color 0.15s ease',
            }}
          >
            <Group
              px="md"
              py="sm"
              justify="space-between"
              wrap="nowrap"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleRoom(room.roomId)}
            >
              <Box style={{ minWidth: 0, flex: 1 }}>
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon
                    size={34}
                    radius="md"
                    variant="light"
                    color={hasSelected ? 'blue' : isFull ? 'gray' : 'teal'}
                    style={{ flexShrink: 0 }}
                  >
                    <IconHome size={16} />
                  </ThemeIcon>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={700} lineClamp={1}>
                      {room.roomName}
                    </Text>
                    {room.locationPath && (
                      <Group gap={4} wrap="nowrap">
                        <IconMapPin
                          size={11}
                          color="var(--mantine-color-dimmed)"
                          style={{ flexShrink: 0 }}
                        />
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {room.locationPath}
                        </Text>
                      </Group>
                    )}
                  </Box>
                </Group>
              </Box>

              <Group gap={10} wrap="nowrap" style={{ flexShrink: 0 }}>
                <Box style={{ width: 60 }} visibleFrom="xs">
                  <Text size="xs" c="dimmed" ta="right" mb={3}>
                    {room.availableCount}/{room.beds.length}
                  </Text>
                  <Progress
                    value={occupancyPct}
                    size="xs"
                    radius="xl"
                    color={isFull ? 'red' : occupancyPct > 60 ? 'orange' : 'teal'}
                  />
                </Box>
                <Badge
                  size="sm"
                  variant={isFull ? 'filled' : 'light'}
                  color={isFull ? 'red' : 'teal'}
                >
                  {isFull
                    ? t('portal.room_full', { defaultValue: 'Full' })
                    : t('portal.n_beds_free', {
                        defaultValue: '{{n}} free',
                        n: room.availableCount,
                      })}
                </Badge>
                <ActionIcon variant="subtle" color={hasSelected ? 'blue' : 'gray'} size="sm">
                  {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </ActionIcon>
              </Group>
            </Group>

            <Collapse in={isExpanded}>
              <Divider />
              <SimpleGrid cols={Math.min(room.beds.length, 4) as any} p="md" spacing="sm">
                {room.beds.map((bed) => {
                  const isBedSelected = selected?.id === bed.id;

                  if (bed.isTaken) {
                    return (
                      <Tooltip
                        key={bed.id}
                        label={
                          <Stack gap={2}>
                            {bed.occupantNationality && (
                              <Text size="xs">
                                {toFlagEmoji(bed.occupantNationality)} {bed.occupantNationality}
                              </Text>
                            )}
                            {bed.occupantDepartment && (
                              <Text size="xs">{bed.occupantDepartment}</Text>
                            )}
                          </Stack>
                        }
                        disabled={!bed.occupantNationality && !bed.occupantDepartment}
                        withinPortal
                      >
                        <Paper
                          radius="md"
                          p="sm"
                          style={{
                            background:
                              'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
                            border: '1px solid var(--mantine-color-default-border)',
                            cursor: 'default',
                            textAlign: 'center',
                          }}
                        >
                          <Stack gap={4} align="center">
                            <IconBed size={22} color="var(--mantine-color-dimmed)" />
                            <Text size="xs" fw={600} c="dimmed">
                              {bed.label}
                            </Text>
                            {bed.occupantNationality && (
                              <Text size="lg" lh={1}>
                                {toFlagEmoji(bed.occupantNationality)}
                              </Text>
                            )}
                            {bed.occupantDepartment && (
                              <Text size="xs" c="dimmed" lineClamp={2} ta="center">
                                {bed.occupantDepartment}
                              </Text>
                            )}
                          </Stack>
                        </Paper>
                      </Tooltip>
                    );
                  }

                  return (
                    <Paper
                      key={bed.id}
                      radius="md"
                      p="sm"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        borderColor: isBedSelected ? 'var(--mantine-color-blue-5)' : undefined,
                        borderWidth: isBedSelected ? 2 : 1,
                        background: isBedSelected ? 'var(--mantine-color-blue-light)' : undefined,
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => onSelect(bed)}
                    >
                      <Stack gap={4} align="center">
                        <ThemeIcon
                          size={26}
                          radius="md"
                          variant={isBedSelected ? 'filled' : 'light'}
                          color={isBedSelected ? 'blue' : 'teal'}
                        >
                          <IconBed size={14} />
                        </ThemeIcon>
                        <Text size="xs" fw={700} c={isBedSelected ? 'blue' : undefined}>
                          {bed.label}
                        </Text>
                        {isBedSelected && (
                          <Badge size="xs" color="blue" variant="light">
                            Selected
                          </Badge>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            </Collapse>
          </Paper>
        );
      })}
    </Stack>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function ReviewStep({
  semester,
  bed,
  roomType,
}: {
  semester: PortalSemester;
  bed: BedWithOccupancy;
  roomType: RoomTypeCatalogItem | null;
}) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <Stack gap="md">
      <Paper radius="xl" withBorder style={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box
          p="lg"
          style={{
            background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
            borderBottom: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box>
              <Group gap="sm" mb={10} wrap="nowrap">
                <ThemeIcon
                  size={40}
                  radius="xl"
                  variant="light"
                  color="blue"
                  style={{ flexShrink: 0 }}
                >
                  <IconBed size={20} />
                </ThemeIcon>
                <Box>
                  <Text fw={700} size="lg" lh={1.2}>
                    {bed.roomName}
                  </Text>
                  <Group gap={4}>
                    <IconMapPin
                      size={12}
                      color="var(--mantine-color-dimmed)"
                      style={{ flexShrink: 0 }}
                    />
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {bed.locationPath}
                    </Text>
                  </Group>
                </Box>
              </Group>

              <Group gap="sm" wrap="wrap">
                <Badge variant="light" color="blue" leftSection={<IconBed size={11} />}>
                  {t('portal.bed_label', { label: bed.label })}
                </Badge>
                {roomType && (
                  <Badge variant="light" color="blue" leftSection={<IconLayoutGrid size={11} />}>
                    {isTr && roomType.nameTr ? roomType.nameTr : roomType.name}
                  </Badge>
                )}
              </Group>
            </Box>

            <Box ta="right" style={{ flexShrink: 0 }}>
              <Text size="xs" c="dimmed">
                Semester price
              </Text>
              <Text fw={700} size="xl" lh={1.1}>
                ₺{Number(bed.priceTry).toLocaleString()}
              </Text>
              {bed.priceForeign != null && (
                <Text size="xs" c="dimmed">
                  / {Number(bed.priceForeign).toLocaleString()} {semester.foreignCurrencyCode}
                </Text>
              )}
            </Box>
          </Group>
        </Box>

        {/* Receipt rows */}
        <Stack gap={0}>
          <Group
            justify="space-between"
            px="lg"
            py="md"
            style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
          >
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon
                size={30}
                radius="md"
                variant="light"
                color="blue"
                style={{ flexShrink: 0 }}
              >
                <IconCalendar size={15} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">
                  {t('portal.step_semester_label')}
                </Text>
                <Text size="sm" fw={600}>
                  {semester.displayName}
                </Text>
              </Box>
            </Group>
            <Text size="xs" c="dimmed" ta="right">
              {new Date(semester.startDate).toLocaleDateString()} –{' '}
              {new Date(semester.endDate).toLocaleDateString()}
            </Text>
          </Group>

          <Group
            justify="space-between"
            px="lg"
            py="md"
            style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
          >
            <Text size="sm" c="dimmed">
              {t('portal.accommodation_price_label', { defaultValue: 'Accommodation price' })}
            </Text>
            <Text size="sm" fw={700}>
              ₺{Number(bed.priceTry).toLocaleString()}
            </Text>
          </Group>

          <Group
            justify="space-between"
            px="lg"
            py="md"
            style={
              semester.paymentDeadlineDate
                ? { borderBottom: '1px solid var(--mantine-color-default-border)' }
                : undefined
            }
          >
            <Text size="sm" c="dimmed">
              {t('portal.deposit_due_label')}
            </Text>
            <Text size="sm" fw={600}>
              {semester.depositAmountTry > 0
                ? `₺${semester.depositAmountTry.toLocaleString()}`
                : `${semester.depositAmountForeign} ${semester.foreignCurrencyCode}`}
            </Text>
          </Group>

          {semester.paymentDeadlineDate && (
            <Group justify="space-between" px="lg" py="sm">
              <Group gap={6}>
                <IconClock size={14} color="var(--mantine-color-orange-6)" />
                <Text size="sm" c="orange" fw={500}>
                  {t('portal.payment_deadline_label')}
                </Text>
              </Group>
              <Text size="sm" fw={700} c="orange">
                {new Date(semester.paymentDeadlineDate).toLocaleDateString()}
              </Text>
            </Group>
          )}
        </Stack>
      </Paper>

      <Alert icon={<IconInfoCircle size={14} />} color="blue" radius="lg" variant="light">
        {t('portal.submit_notice')}
      </Alert>
    </Stack>
  );
}

// ─── Desktop step sidebar ─────────────────────────────────────────────────────

const STEP_ICONS = [IconCalendar, IconFilter, IconLayoutGrid, IconBed, IconCheck];

function DesktopStepsSidebar({ activeStep }: { activeStep: number }) {
  const { t } = useTranslation();
  const STEPS = [
    { label: t('portal.step_semester_label'), description: t('portal.step_semester_desc') },
    {
      label: t('portal.step_filters_label', { defaultValue: 'Preferences' }),
      description: t('portal.step_filters_desc', { defaultValue: 'Building & room size' }),
    },
    {
      label: t('portal.step_catalog_label', { defaultValue: 'Room Type' }),
      description: t('portal.step_catalog_desc', { defaultValue: 'Choose a room style' }),
    },
    { label: t('portal.step_bed_label'), description: t('portal.step_bed_desc') },
    { label: t('portal.step_confirm_label'), description: t('portal.step_confirm_desc') },
  ];

  return (
    <Paper radius="xl" p="lg" withBorder style={{ height: '100%' }}>
      <Group gap="sm" mb="xl">
        <ThemeIcon size={34} radius="md" variant="light" color="blue">
          <IconHome size={17} />
        </ThemeIcon>
        <Box>
          <Text fw={700} size="sm" lh={1.2}>
            {t('portal.application_steps')}
          </Text>
          <Text size="xs" c="dimmed">
            Step {activeStep + 1} of {STEPS.length}
          </Text>
        </Box>
      </Group>

      <Box mb="xl">
        <Progress
          value={(activeStep / (STEPS.length - 1)) * 100}
          size="sm"
          radius="xl"
          color="blue"
        />
      </Box>

      <Stack gap={0}>
        {STEPS.map((s, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          const isLast = i === STEPS.length - 1;
          const StepIcon = STEP_ICONS[i];

          return (
            <Box key={s.label}>
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ThemeIcon
                    size={34}
                    radius="xl"
                    variant={isDone ? 'filled' : isActive ? 'filled' : 'light'}
                    color={isDone ? 'blue' : isActive ? 'blue' : 'gray'}
                  >
                    {isDone ? <IconCheck size={16} /> : <StepIcon size={15} />}
                  </ThemeIcon>

                  {!isLast && (
                    <Box
                      style={{
                        width: 2,
                        height: 28,
                        background: isDone
                          ? 'var(--mantine-color-blue-4)'
                          : 'var(--mantine-color-gray-3)',
                        margin: '4px 0',
                        borderRadius: 2,
                        transition: 'background 0.2s ease',
                      }}
                    />
                  )}
                </Box>

                <Box style={{ paddingBottom: isLast ? 0 : 4, paddingTop: 4, flex: 1, minWidth: 0 }}>
                  <Text
                    size="sm"
                    fw={isActive ? 700 : isDone ? 500 : 400}
                    c={!isActive && !isDone ? 'dimmed' : undefined}
                    lh={1.3}
                  >
                    {s.label}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.3}>
                    {s.description}
                  </Text>
                </Box>
              </Group>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STEP_LABELS_ICONS = [
  { label: 'portal.step_semester_label', Icon: IconCalendar },
  { label: 'portal.step_filters_label', Icon: IconFilter, defaultValue: 'Filters' },
  { label: 'portal.step_catalog_label', Icon: IconLayoutGrid, defaultValue: 'Type' },
  { label: 'portal.step_bed_label', Icon: IconBed },
  { label: 'portal.step_confirm_label', Icon: IconCheck },
];

export function ApplyPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const { booking } = useCurrentBooking();

  const [step, setStep] = useState(0);
  const [semesters, setSemesters] = useState<PortalSemester[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<PortalSemester | null>(null);
  const [buildings, setBuildings] = useState<PortalBuilding[]>([]);
  const [availableCapacities, setAvailableCapacities] = useState<number[]>([]);
  const [filters, setFilters] = useState<Filters>({ buildingId: null, capacity: null });
  const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeCatalogItem | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedWithOccupancy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    portalSemesters
      .getBookable()
      .then((data) => {
        setSemesters(data);
        if (data.length === 1) setSelectedSemester(data[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSemesters(false));
  }, []);

  useEffect(() => {
    if (!selectedSemester) {
      setBuildings([]);
      setAvailableCapacities([]);
      return;
    }
    portalSemesters
      .getBuildings(selectedSemester.id)
      .then(setBuildings)
      .catch(() => {});
    portalSemesters
      .getRoomCatalog(selectedSemester.id)
      .then((catalog) => {
        const caps = [...new Set(catalog.map((rt) => rt.capacity))].sort((a, b) => a - b);
        setAvailableCapacities(caps);
      })
      .catch(() => {});
  }, [selectedSemester?.id]);

  const hasActiveBooking = booking !== null;

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step === 0) {
      navigate('/dashboard');
      return;
    }
    if (step === 3) setSelectedBed(null);
    if (step === 2) setSelectedRoomType(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!selectedSemester || !selectedBed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await portalBookings.create({ semesterId: selectedSemester.id, bedId: selectedBed.id });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('portal.submit_error');
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance =
    step === 0
      ? selectedSemester !== null
      : step === 1
        ? true
        : step === 2
          ? true
          : step === 3
            ? selectedBed !== null
            : false;

  const stepContent = isLoadingSemesters ? (
    <Stack gap="sm">
      <Skeleton height={100} radius="lg" />
      <Skeleton height={100} radius="lg" />
    </Stack>
  ) : step === 0 ? (
    <SemesterStep
      semesters={semesters}
      selected={selectedSemester}
      onSelect={(s) => {
        setSelectedSemester(s);
        setFilters({ buildingId: null, capacity: null });
        setSelectedRoomType(null);
        setSelectedBed(null);
      }}
    />
  ) : step === 1 && selectedSemester ? (
    <FiltersStep
      buildings={buildings}
      capacities={availableCapacities}
      filters={filters}
      onChange={(f) => {
        setFilters(f);
        setSelectedRoomType(null);
        setSelectedBed(null);
      }}
    />
  ) : step === 2 && selectedSemester ? (
    <RoomCatalogStep
      semesterId={selectedSemester.id}
      filters={filters}
      selected={selectedRoomType}
      onSelect={(rt) => {
        setSelectedRoomType(rt);
        setSelectedBed(null);
      }}
    />
  ) : step === 3 && selectedSemester ? (
    <BedStep
      semesterId={selectedSemester.id}
      roomTypeId={selectedRoomType?.id ?? null}
      roomTypeName={(isTr ? selectedRoomType?.nameTr : undefined) ?? selectedRoomType?.name ?? null}
      buildingName={
        filters.buildingId != null
          ? (buildings.find((b) => b.id === filters.buildingId)?.name ?? null)
          : null
      }
      selected={selectedBed}
      onSelect={setSelectedBed}
    />
  ) : step === 4 && selectedSemester && selectedBed ? (
    <ReviewStep semester={selectedSemester} bed={selectedBed} roomType={selectedRoomType} />
  ) : null;

  const navButtons = (
    <Group justify="space-between">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={handleBack}
        disabled={isSubmitting}
        radius="xl"
      >
        {step === 0 ? t('cancel') : t('back')}
      </Button>
      {step < 4 ? (
        <Button
          rightSection={<IconArrowRight size={16} />}
          onClick={handleNext}
          disabled={!canAdvance}
          radius="xl"
          variant="filled"
          color="blue"
        >
          {step === 2 && !selectedRoomType
            ? t('portal.skip_to_beds', { defaultValue: 'Browse all beds' })
            : t('next')}
        </Button>
      ) : (
        <Button
          leftSection={isSubmitting ? <Loader size={14} color="white" /> : <IconCheck size={16} />}
          onClick={handleSubmit}
          disabled={isSubmitting || hasActiveBooking}
          radius="xl"
          variant="filled"
          color="blue"
        >
          {isSubmitting ? t('portal.submitting') : t('portal.submit_application')}
        </Button>
      )}
    </Group>
  );

  return (
    <Stack gap="lg">
      {/* Page header */}
      <Box>
        <Text size="xs" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
          {t('portal.apply_page_label', { defaultValue: 'Student Housing' })}
        </Text>
        <Title order={2} fw={700} lh={1.2}>
          {t('portal.apply_title')}
        </Title>
        <Text size="sm" c="dimmed" mt={2}>
          {t('portal.apply_subtitle')}
        </Text>
      </Box>

      {hasActiveBooking && (
        <Alert icon={<IconInfoCircle size={16} />} color="orange" radius="lg" variant="light">
          {t('portal.already_has_booking_part1')}{' '}
          <Text
            component="span"
            size="sm"
            c="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/booking')}
          >
            {t('portal.nav_my_room')}
          </Text>{' '}
          {t('portal.already_has_booking_part2')}
        </Alert>
      )}

      {/* Desktop layout */}
      <Box visibleFrom="sm">
        <Group align="flex-start" gap="lg" wrap="nowrap">
          <Box style={{ width: 230, flexShrink: 0 }}>
            <DesktopStepsSidebar activeStep={step} />
          </Box>

          <Box style={{ flex: 1, minWidth: 0 }}>
            <Stack gap="md">
              <Card radius="xl" p="xl" withBorder style={{ minHeight: 320 }}>
                {stepContent}
              </Card>

              {submitError && (
                <Alert
                  icon={<IconX size={16} />}
                  color="red"
                  radius="lg"
                  onClose={() => setSubmitError(null)}
                  withCloseButton
                >
                  {submitError}
                </Alert>
              )}

              {navButtons}
            </Stack>
          </Box>
        </Group>
      </Box>

      {/* Mobile layout */}
      <Box hiddenFrom="sm">
        <Stack gap="md">
          <Stepper active={step} size="xs" radius="xl">
            {STEP_LABELS_ICONS.map(({ label, Icon, defaultValue }) => (
              <Stepper.Step
                key={label}
                label={t(label, defaultValue ? { defaultValue } : undefined)}
                icon={<Icon size={14} />}
              />
            ))}
          </Stepper>

          <Card radius="xl" p="md" withBorder>
            {stepContent}
          </Card>

          {submitError && (
            <Alert
              icon={<IconX size={16} />}
              color="red"
              radius="lg"
              onClose={() => setSubmitError(null)}
              withCloseButton
            >
              {submitError}
            </Alert>
          )}

          {navButtons}
        </Stack>
      </Box>
    </Stack>
  );
}
