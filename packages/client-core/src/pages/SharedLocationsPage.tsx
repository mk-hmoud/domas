import { useState, useEffect, useMemo, ReactNode } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Button,
  SimpleGrid,
  Group,
  Badge,
  Text,
  Paper,
  Loader,
  Center,
  Checkbox,
  Box,
  Stack,
  Drawer,
  ActionIcon,
  Tooltip,
  Divider,
  SegmentedControl,
  Pagination,
  LoadingOverlay,
  Tabs,
  Menu,
  ScrollArea,
  Progress,
  ThemeIcon,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconFlag,
  IconBuildingBank,
  IconCurrencyDollar,
  IconUser,
  IconX,
  IconHierarchy,
  IconTable,
  IconAlertTriangle,
  IconDotsVertical,
  IconEdit,
} from "@tabler/icons-react";
import {
  LocationType,
  UpdateLocationDto,
  CreateLocationDto,
  InventoryAssignment,
  InventoryCatalogItem,
  CreateInventoryAssignmentDto,
  InventoryScope,
  FindAllLocationsDto,
  ApplyInventoryTemplateDto,
  InventoryTemplate,
  Student,
  Semester,
  CreateBookingDto,
  CreateStudentDto,
  RoomType,
  LocationFlagContext,
} from "@domas/ts-types";
import {
  LocationsManager,
  LocationTree,
  LocationDetail,
  CreateLocationModal,
  CreateBedModal,
  LocationNode,
  BulkActionsBar,
  BulkEditLocationModal,
  GenericLocationCard,
  RoomCard,
  BedCard,
  LocationIcon,
  InventoryAssignmentList,
  AssignInventoryModal,
  LocationRegistryTable,
  RegistryItemDrawer,
  ApplyTemplateModal,
  CreateBookingModal,
  ComposeEmailModal,
  EmptyState,
  LabelValue,
  FlagCascadeConfirmModal,
  FlagChange,
} from "@domas/ui";
import { LocationsProvider, useLocations } from "../context/LocationsContext";
import { useTranslation } from "react-i18next";
import {
  locations,
  inventory,
  beds,
  students,
  semesters,
  bookings,
  roomTypes as roomTypesApi,
} from "@domas/api-client";
import { useLocationSelection } from "../hooks/useLocationSelection";
import { useBedManagement } from "../hooks/useBedManagement";
import { useCountries, useDepartments } from "../hooks/useLookups";
import { findLocationPath } from "../utils/location-utils";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

interface BedStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  totalRooms: number;
  roomsWithoutType: number;
  maleRooms: number;
  femaleRooms: number;
  noLockRooms: number;
}

function collectBedStats(node: any): BedStats {
  if (node.type === LocationType.BED) {
    return {
      totalBeds: 1,
      occupiedBeds: node.status === "occupied" ? 1 : 0,
      availableBeds: node.status === "available" ? 1 : 0,
      maintenanceBeds: node.status === "maintenance" ? 1 : 0,
      totalRooms: 0,
      roomsWithoutType: 0,
      maleRooms: 0,
      femaleRooms: 0,
      noLockRooms: 0,
    };
  }
  const isRoom = node.type === LocationType.ROOM;
  const stats: BedStats = {
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    maintenanceBeds: 0,
    totalRooms: isRoom ? 1 : 0,
    roomsWithoutType: isRoom && !node.roomTypeId ? 1 : 0,
    maleRooms: isRoom && node.genderLock === "male" ? 1 : 0,
    femaleRooms: isRoom && node.genderLock === "female" ? 1 : 0,
    noLockRooms: isRoom && !node.genderLock ? 1 : 0,
  };
  for (const child of node.children ?? []) {
    const sub = collectBedStats(child);
    stats.totalBeds += sub.totalBeds;
    stats.occupiedBeds += sub.occupiedBeds;
    stats.availableBeds += sub.availableBeds;
    stats.maintenanceBeds += sub.maintenanceBeds;
    stats.totalRooms += sub.totalRooms;
    stats.roomsWithoutType += sub.roomsWithoutType;
    stats.maleRooms += sub.maleRooms;
    stats.femaleRooms += sub.femaleRooms;
    stats.noLockRooms += sub.noLockRooms;
  }
  return stats;
}

function ColumnPanel({
  title,
  flex = 1,
  headerRight,
  hideHeader,
  loading,
  children,
}: {
  title?: string;
  flex?: number;
  headerRight?: ReactNode;
  hideHeader?: boolean;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <Paper
      withBorder
      style={{
        flex,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {!hideHeader && (
        <Box
          px="sm"
          style={{
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--mantine-color-default-border)",
            flexShrink: 0,
          }}
        >
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {title}
          </Text>
          {headerRight}
        </Box>
      )}
      <ScrollArea style={{ flex: 1 }}>
        <Box p="sm">
          {loading ? (
            <Center p="lg">
              <Loader size="sm" />
            </Center>
          ) : (
            children
          )}
        </Box>
      </ScrollArea>
    </Paper>
  );
}

function OccupancyPanel({
  stats,
  t,
}: {
  stats: BedStats | null;
  t: (key: string, opts?: any) => string;
}) {
  if (!stats) return null;
  const occupancyPct =
    stats.totalBeds > 0
      ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100)
      : 0;

  return (
    <Stack gap="sm">
      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed">
          {t("total_rooms")}
        </Text>
        <Text size="xs" fw={600}>
          {stats.totalRooms}
        </Text>
      </Group>
      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed">
          {t("total_beds")}
        </Text>
        <Text size="xs" fw={600}>
          {stats.totalBeds}
        </Text>
      </Group>

      <Divider />

      <Box>
        <Group gap="xs" justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">
            {t("occupancy")}
          </Text>
          <Text size="xs" fw={700}>
            {occupancyPct}%
          </Text>
        </Group>
        <Progress
          value={occupancyPct}
          color={
            occupancyPct > 80 ? "red" : occupancyPct > 50 ? "yellow" : "green"
          }
          size="sm"
          radius="xs"
        />
      </Box>

      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed">
          {t("bed_status.occupied")}
        </Text>
        <Badge size="xs" variant="light" color="blue">
          {stats.occupiedBeds}
        </Badge>
      </Group>
      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed">
          {t("bed_status.available")}
        </Text>
        <Badge size="xs" variant="light" color="green">
          {stats.availableBeds}
        </Badge>
      </Group>
      <Group gap="xs" justify="space-between">
        <Text size="xs" c="dimmed">
          {t("bed_status.maintenance")}
        </Text>
        <Badge size="xs" variant="light" color="orange">
          {stats.maintenanceBeds}
        </Badge>
      </Group>

      {stats.roomsWithoutType > 0 && (
        <>
          <Divider />
          <Group gap="xs" justify="space-between">
            <Text size="xs" c="dimmed">
              {t("rooms_without_type")}
            </Text>
            <Badge size="xs" variant="light" color="yellow">
              {stats.roomsWithoutType}
            </Badge>
          </Group>
        </>
      )}

      {stats.totalRooms > 0 && (
        <>
          <Divider />
          <Text size="xs" c="dimmed" fw={600}>
            {t("gender_lock")}
          </Text>
          {stats.maleRooms > 0 && (
            <Group gap="xs" justify="space-between">
              <Text size="xs">{t("male")}</Text>
              <Badge size="xs" variant="light" color="blue">
                {stats.maleRooms}
              </Badge>
            </Group>
          )}
          {stats.femaleRooms > 0 && (
            <Group gap="xs" justify="space-between">
              <Text size="xs">{t("female")}</Text>
              <Badge size="xs" variant="light" color="pink">
                {stats.femaleRooms}
              </Badge>
            </Group>
          )}
          {stats.noLockRooms > 0 && (
            <Group gap="xs" justify="space-between">
              <Text size="xs">{t("no_gender_restriction")}</Text>
              <Badge size="xs" variant="light" color="gray">
                {stats.noLockRooms}
              </Badge>
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}

function LocationsContent() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const localizedName = (node: { name: string; nameTr?: string }) =>
    isTr && node.nameTr ? node.nameTr : node.name;
  const { countries } = useCountries();
  const { departments } = useDepartments();
  const {
    treeData,
    selectedNode,
    children,
    loading: treeLoading,
    selectNode,
    deleteLocation,
    refreshTree,
  } = useLocations();

  // View State
  const [activeView, setActiveView] = useState<string>("structure");
  const [activeTab, setActiveTab] = useState<string | null>("locations");

  // Registry View State
  const [registryData, setRegistryData] = useState<any[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [emailLocationId, setEmailLocationId] = useState<number | null>(null);
  const [registryFilters, setRegistryFilters] = useState<FindAllLocationsDto>({
    page: 1,
    limit: 10,
  });
  const [totalRegistryItems, setTotalRegistryRegistryItems] = useState(0);

  const fetchRegistryData = async () => {
    setRegistryLoading(true);
    try {
      // Clean up filters to remove false booleans so they don't strictly filter on server
      const cleanFilters: any = { ...registryFilters };
      ["isTrOnly", "isGuestZone", "onlyVacant"].forEach((key) => {
        if (cleanFilters[key] === false) {
          delete cleanFilters[key];
        }
      });

      if (activeTab === "locations") {
        const result = await locations.findAll(cleanFilters);
        setRegistryData(
          result.data.filter(
            (item: any) => item.type !== LocationType.UNIVERSITY,
          ),
        );
        setTotalRegistryRegistryItems(result.total);
      } else {
        const result = await beds.findAll({
          ...cleanFilters,
          page: registryFilters.page,
          limit: registryFilters.limit,
        });
        setRegistryData(result.data);
        setTotalRegistryRegistryItems(result.total);
      }
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setRegistryLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "registry") {
      fetchRegistryData();
    }
    setAllMatchingSelected(false);
  }, [activeView, activeTab, registryFilters]);

  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [registryDetailItem, setRegistryDetailItem] = useState<any | null>(
    null,
  );
  const [registryDetailOpen, setRegistryDetailOpen] = useState(false);
  const [registryItemFlagContext, setRegistryItemFlagContext] =
    useState<LocationFlagContext | null>(null);

  // Flag cascade state
  const [editFlagContext, setEditFlagContext] =
    useState<LocationFlagContext | null>(null);
  const [cascadeModalOpened, setCascadeModalOpened] = useState(false);
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{
    id: number;
    values: UpdateLocationDto;
    flagChanges: FlagChange[];
    name: string;
  } | null>(null);

  const handleFilterChange = (key: string, value: any) => {
    setAllMatchingSelected(false);
    setRegistryFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleBatchFilterChange = (updates: Record<string, any>) => {
    setAllMatchingSelected(false);
    setRegistryFilters((prev) => ({
      ...prev,
      ...updates,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setAllMatchingSelected(false);
    setRegistryFilters({
      page: 1,
      limit: 10,
      q: undefined,
      type: undefined,
      genderLock: undefined,
      isTrOnly: undefined,
      isForeignerOnly: undefined,
      isGuestZone: undefined,
      isRectorate: undefined,
      onlyVacant: undefined,
      status: undefined,
      roomTypeId: undefined,
      orderBy: undefined,
      orderDir: undefined,
    });
  };

  const handleSelectAllMatching = () => {
    if (allMatchingSelected) {
      clearSelection();
      setAllMatchingSelected(false);
    } else {
      // Mark all matching as selected — the actual IDs are fetched page by page
      // so we flag it and use totalCount for bulk operations
      setAllMatchingSelected(true);
    }
  };

  const showInventory = useMemo(() => {
    return (
      selectedNode &&
      selectedNode.type !== LocationType.UNIVERSITY &&
      selectedNode.type !== LocationType.CAMPUS
    );
  }, [selectedNode]);

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [bulkEditModalOpened, setBulkEditModalOpened] = useState(false);
  const [viewSelectionDrawerOpened, setViewSelectionDrawerOpened] =
    useState(false);
  const [parentForCreation, setParentForCreation] = useState<{
    id: number | null;
    type?: LocationType;
  }>({ id: null });
  const [locationToEdit, setLocationToEdit] = useState<any | null>(null);
  const [editBedModalOpened, setEditBedModalOpened] = useState(false);
  const [roomTypesList, setRoomTypesList] = useState<RoomType[]>([]);
  const [bedToEdit, setBedToEdit] = useState<any | null>(null);

  // Inventory State
  const [inventoryAssignments, setInventoryAssignments] = useState<
    InventoryAssignment[]
  >([]);
  const [inventoryCatalog, setInventoryCatalog] = useState<
    InventoryCatalogItem[]
  >([]);
  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Template State
  const [templates, setTemplates] = useState<InventoryTemplate[]>([]);
  const [applyTemplateModalOpened, setApplyTemplateModalOpened] =
    useState(false);
  const [templateTargetType, setTemplateTargetType] = useState<
    "location" | "bed"
  >("location");

  // Booking State
  const [bookingModalOpened, setBookingModalOpened] = useState(false);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);

  // Residents State (for ROOM view dashboard panel)
  const [roomResidents, setRoomResidents] = useState<any[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);

  // Bed Management
  const {
    roomBeds,
    createBedModalOpened,
    setCreateBedModalOpened,
    createBed: handleCreateBed,
    deleteBed: handleDeleteBed,
  } = useBedManagement(
    selectedNode ? Number(selectedNode.id) : null,
    selectedNode?.type === LocationType.ROOM,
  );

  // Shared Selection State (Tree + Children + Registry)
  const { selectedIds, toggleSelection, setSelectedIds, clearSelection } =
    useLocationSelection([]);

  // Fetch Inventory for selected node
  const fetchInventory = async () => {
    if (!selectedNode) return;
    setInventoryLoading(true);
    try {
      let result: InventoryAssignment[] = [];
      if (selectedNode.type === LocationType.BED) {
        const bedId =
          typeof selectedNode.id === "string"
            ? Number(selectedNode.id.replace("bed-", ""))
            : Number(selectedNode.id);
        result = await inventory.findByBed(bedId);
      } else {
        result = await inventory.findByLocation(Number(selectedNode.id));
      }
      setInventoryAssignments(result);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const result = await inventory.findAllCatalog({ isActive: true });
      setInventoryCatalog(result);
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
    }
  };

  useEffect(() => {
    if (selectedNode && showInventory) {
      fetchInventory();
      fetchCatalog();
    }
  }, [selectedNode, showInventory]);

  const filteredCatalog = useMemo(() => {
    if (!selectedNode) return [];
    const isBed = selectedNode.type === LocationType.BED;
    return inventoryCatalog.filter((item) => {
      if (isBed)
        return (
          item.scope === InventoryScope.BED ||
          item.scope === InventoryScope.SHARED
        );
      return (
        item.scope === InventoryScope.ROOM ||
        item.scope === InventoryScope.SHARED
      );
    });
  }, [inventoryCatalog, selectedNode]);

  useEffect(() => {
    roomTypesApi
      .findAll()
      .then(setRoomTypesList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (createModalOpened && locationToEdit?.id) {
      locations
        .getFlagContext(Number(locationToEdit.id))
        .then(setEditFlagContext)
        .catch(() => {});
    } else if (!createModalOpened) {
      setEditFlagContext(null);
    }
  }, [createModalOpened, locationToEdit]);

  useEffect(() => {
    if (selectedNode?.type === LocationType.ROOM) {
      setResidentsLoading(true);
      locations
        .getResidents(Number(selectedNode.id))
        .then(setRoomResidents)
        .catch(() => {})
        .finally(() => setResidentsLoading(false));
    } else {
      setRoomResidents([]);
    }
  }, [selectedNode?.id, selectedNode?.type]);

  const nodeStats = useMemo(() => {
    if (
      !selectedNode ||
      selectedNode.type === LocationType.ROOM ||
      selectedNode.type === LocationType.BED
    )
      return null;
    return collectBedStats(selectedNode);
  }, [selectedNode]);

  // University node (used for "Add Campus" in the sidebar header, never rendered directly)
  const universityNode = useMemo(
    () => treeData.find((n) => n.type === LocationType.UNIVERSITY) ?? null,
    [treeData],
  );

  // Calculate breadcrumbs — skip university level
  const locationPath = selectedNode
    ? findLocationPath(treeData, selectedNode.id)
    : null;

  const breadcrumbs =
    locationPath
      ?.filter((n) => n.type !== LocationType.UNIVERSITY)
      .map((n) => ({
        label: localizedName(n),
        onClick: () => selectNode(n),
      })) ?? [];

  // IDs of ancestor nodes that must be expanded in the tree to reveal the selected node
  const expandedIds = useMemo(() => {
    if (!locationPath || locationPath.length <= 1)
      return new Set<string | number>();
    return new Set<string | number>(
      locationPath
        .slice(0, -1)
        .map((n) =>
          typeof n.id === "string" && n.id.startsWith("bed-")
            ? n.id
            : `loc-${n.id}`,
        ),
    );
  }, [locationPath]);

  useEffect(() => {
    // We clear child selection contextually when navigating,
    // but maybe user wants to keep global selection?
    // Based on requirements, they work together.
  }, [selectedNode]);

  const handleToggleSelection = (id: number | string) => {
    // Keep the ID exactly as it is (prefixed)
    toggleSelection(id);
  };

  const handleSelectBranch = (ids: (number | string)[]) => {
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectBranch = (ids: (number | string)[]) => {
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id as any)));
  };

  const handleBulkDelete = () => {
    modals.openConfirmModal({
      title: t("delete_confirm_count", { count: selectedIds.length }),
      children: (
        <Text size="sm">
          {t("delete_confirm_count", { count: selectedIds.length })}
        </Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const locationIds = selectedIds
            .filter((id) => typeof id === "string" && id.startsWith("loc-"))
            .map((id) => Number((id as string).replace("loc-", "")));

          const bedIds = selectedIds
            .filter((id) => typeof id === "string" && id.startsWith("bed-"))
            .map((id) => Number((id as string).replace("bed-", "")));

          const promises: Promise<any>[] = [];
          if (locationIds.length > 0)
            promises.push(locations.deleteMany({ ids: locationIds }));
          if (bedIds.length > 0)
            promises.push(beds.deleteMany({ ids: bedIds }));

          await Promise.all(promises);

          notifications.show({
            title: t("success"),
            message: t("location_delete_success"),
            color: "green",
          });
          await refreshTree();
          if (activeView === "registry") fetchRegistryData();
          clearSelection();
        } catch (error) {
          notifications.show({
            title: t("error"),
            message: t("location_delete_error"),
            color: "red",
          });
        }
      },
    });
  };

  const handleBulkEdit = () => {
    setBulkEditModalOpened(true);
  };

  const handleSubmitBulkEdit = async (values: UpdateLocationDto) => {
    try {
      const locationIds = selectedIds
        .filter((id) => typeof id === "string" && id.startsWith("loc-"))
        .map((id) => Number((id as string).replace("loc-", "")));

      const bedIds = selectedIds
        .filter((id) => typeof id === "string" && id.startsWith("bed-"))
        .map((id) => Number((id as string).replace("bed-", "")));

      const promises: Promise<any>[] = [];

      if (locationIds.length > 0) {
        promises.push(locations.updateMany({ ids: locationIds, data: values }));
      }

      if (bedIds.length > 0) {
        // Handle bed-specific updates from the shared DTO
        const bedPromises: Promise<any>[] = [];
        if (values.status)
          bedPromises.push(
            beds.updateStatusMany({
              ids: bedIds,
              status: values.status as any,
            }),
          );
        if (values.isTrOnly !== undefined)
          bedPromises.push(
            beds.updateTrOnlyMany({ ids: bedIds, isTrOnly: values.isTrOnly }),
          );
        if (values.isForeignerOnly !== undefined)
          bedPromises.push(
            beds.updateForeignerOnlyMany({
              ids: bedIds,
              isForeignerOnly: values.isForeignerOnly,
            }),
          );
        if (values.isRectorate !== undefined)
          bedPromises.push(
            beds.updateIsRectorateMany({
              ids: bedIds,
              isRectorate: values.isRectorate,
            }),
          );
        if (values.isGuestZone !== undefined)
          bedPromises.push(
            beds.updateGuestZoneMany({
              ids: bedIds,
              isGuestZone: values.isGuestZone,
            }),
          );

        if (bedPromises.length > 0) promises.push(Promise.all(bedPromises));
      }

      await Promise.all(promises);

      notifications.show({
        title: t("success"),
        message: t("locations_updated", "Locations updated successfully"),
        color: "green",
      });
      await refreshTree();
      if (activeView === "registry") fetchRegistryData();
      clearSelection();
      setBulkEditModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const handleOpenCreateChild = () => {
    if (selectedNode) {
      setLocationToEdit(null);
      setParentForCreation({
        id: Number(selectedNode.id),
        type: selectedNode.type,
      });
      setCreateModalOpened(true);
    }
  };

  const handleEditChild = (child: LocationNode | any) => {
    setLocationToEdit(child);
    setParentForCreation({ id: null });
    setCreateModalOpened(true);
  };

  const confirmDeleteLocation = (node: LocationNode | any) => {
    modals.openConfirmModal({
      title: t("delete_location_title"),
      children: (
        <Text size="sm">
          {t("delete_location_message", { name: localizedName(node) })}
        </Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await deleteLocation(Number(node.id));
        if (activeView === "registry") fetchRegistryData();
      },
    });
  };

  const handleDeleteChild = (child: LocationNode | any) => {
    confirmDeleteLocation(child);
  };

  const handleOpenDetail = (item: any) => {
    setRegistryDetailItem(item);
    setRegistryDetailOpen(true);
    setRegistryItemFlagContext(null);
    if (item.type !== "bed" && item.id) {
      locations
        .getFlagContext(Number(item.id))
        .then(setRegistryItemFlagContext)
        .catch(() => {});
    }
  };

  const handleRegistryBook = (item: any) => {
    setRegistryDetailOpen(false);
    if (item.type === "bed") {
      selectNode({
        ...item,
        id: `bed-${item.id}`,
        name: item.label,
        type: LocationType.BED,
        children: [],
      });
    } else {
      selectNode({ ...item, children: [] });
    }
    setBookingModalOpened(true);
  };

  const handleRegistryEdit = (item: any) => {
    if (item.type === "bed") {
      setBedToEdit(item);
      setEditBedModalOpened(true);
    } else {
      setLocationToEdit(item);
      setParentForCreation({ id: null });
      setCreateModalOpened(true);
    }
  };

  const handleRegistryDelete = (item: any) => {
    if (item.type === "bed") {
      modals.openConfirmModal({
        title: t("delete_confirm"),
        children: (
          <Text size="sm">
            {t("delete_location_message", { name: item.label || item.name })}
          </Text>
        ),
        labels: { confirm: t("confirm"), cancel: t("cancel") },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          try {
            await beds.deleteMany({ ids: [item.id] });
            notifications.show({
              title: t("success"),
              message: t("bed_deleted", "Bed deleted successfully"),
              color: "green",
            });
            fetchRegistryData();
            refreshTree();
          } catch (error) {
            notifications.show({
              title: t("error"),
              message: t("failed_to_delete"),
              color: "red",
            });
          }
        },
      });
    } else {
      confirmDeleteLocation(item);
    }
  };

  const handleEditLocation = () => {
    if (!selectedNode) return;
    if (selectedNode.type === LocationType.BED) {
      setBedToEdit(selectedNode);
      setEditBedModalOpened(true);
    } else {
      setLocationToEdit(selectedNode);
      setParentForCreation({ id: null });
      setCreateModalOpened(true);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNode) {
      confirmDeleteLocation(selectedNode);
    }
  };

  const handleToggleSelectAllChildren = () => {
    const childIds = children.map((c) =>
      c.type === LocationType.BED ? `bed-${c.id}` : `loc-${c.id}`,
    );
    const allSelected = childIds.every((id) =>
      (selectedIds as any[]).includes(id),
    );

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !childIds.includes(id as any)),
      );
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...childIds])));
    }
  };

  const handleToggleSelectAllBeds = () => {
    const allBedIds = roomBeds.map((b) => `bed-${b.id}`);
    const allSelected = allBedIds.every((id) =>
      (selectedIds as any[]).includes(id),
    );
    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !allBedIds.includes(id as string)),
      );
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allBedIds])));
    }
  };

  const handleToggleSelectAllRegistry = () => {
    const allIds = registryData.map((item) =>
      item.type === "bed" ? `bed-${item.id}` : `loc-${item.id}`,
    );
    const allSelected = allIds.every((id) =>
      (selectedIds as any[]).includes(id),
    );

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !allIds.includes(id as any)),
      );
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const FLAG_LABELS: Record<string, string> = {
    isTrOnly: "TR Only",
    isForeignerOnly: "INT Only",
    isGuestZone: "Guest Zone",
    isRectorate: "Rectorate",
    genderLock: "Gender Lock",
    studentYearLock: "Student Year Lock",
  };

  const FLAG_KEYS = [
    "isTrOnly",
    "isForeignerOnly",
    "isGuestZone",
    "isRectorate",
    "genderLock",
    "studentYearLock",
  ] as const;

  const applyLocationUpdate = async (
    id: number,
    values: UpdateLocationDto,
    cascade: boolean,
  ) => {
    const flagKeys = FLAG_KEYS;
    const nonFlagPayload: UpdateLocationDto = {};
    const flagPayload: Partial<Record<(typeof flagKeys)[number], any>> = {};

    for (const [k, v] of Object.entries(values)) {
      if (flagKeys.includes(k as any)) {
        (flagPayload as any)[k] = v;
      } else {
        (nonFlagPayload as any)[k] = v;
      }
    }

    if (Object.keys(nonFlagPayload).length > 0) {
      await locations.update(id, nonFlagPayload);
    }

    if (cascade) {
      const promises: Promise<any>[] = [];
      if ("isTrOnly" in flagPayload)
        promises.push(
          locations.updateTrOnly(id, {
            isTrOnly: flagPayload.isTrOnly,
            cascade: true,
          }),
        );
      if ("isForeignerOnly" in flagPayload)
        promises.push(
          locations.updateForeignerOnly(id, {
            isForeignerOnly: flagPayload.isForeignerOnly,
            cascade: true,
          }),
        );
      if ("isGuestZone" in flagPayload)
        promises.push(
          locations.updateGuestZone(id, {
            isGuestZone: flagPayload.isGuestZone,
            cascade: true,
          }),
        );
      if ("isRectorate" in flagPayload)
        promises.push(
          locations.updateIsRectorate(id, {
            isRectorate: flagPayload.isRectorate,
            cascade: true,
          }),
        );
      if ("genderLock" in flagPayload)
        promises.push(
          locations.updateGenderLock(id, {
            genderLock: flagPayload.genderLock,
            cascade: true,
          }),
        );
      if ("studentYearLock" in flagPayload)
        promises.push(
          locations.updateStudentYearLock(id, {
            studentYearLock: flagPayload.studentYearLock ?? null,
            cascade: true,
          }),
        );
      await Promise.all(promises);
    } else if (Object.keys(flagPayload).length > 0) {
      await locations.update(id, flagPayload as UpdateLocationDto);
    }
  };

  const handleCascadeConfirm = async (cascade: boolean) => {
    if (!pendingEdit) return;
    setCascadeLoading(true);
    try {
      await applyLocationUpdate(pendingEdit.id, pendingEdit.values, cascade);
      notifications.show({
        title: t("success"),
        message: t("location_updated", "Location updated successfully"),
        color: "green",
      });
      await refreshTree();
      if (activeView === "registry") fetchRegistryData();
    } catch {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    } finally {
      setCascadeLoading(false);
      setCascadeModalOpened(false);
      setPendingEdit(null);
    }
  };

  const handleSubmitLocation = async (
    values: CreateLocationDto | UpdateLocationDto | CreateLocationDto[],
  ) => {
    try {
      if (Array.isArray(values)) {
        // Bulk create mode — rooms always use the room-with-beds endpoint
        const isRoomBulk = values.every((v) => v.type === LocationType.ROOM);
        if (isRoomBulk) {
          await locations.createRoomsWithBedsMany({ rooms: values as any });
        } else {
          await locations.createMany({ locations: values });
        }

        notifications.show({
          title: t("success"),
          message: t("locations_created", "Locations created successfully"),
          color: "green",
        });
        await refreshTree();
        if (activeView === "registry") fetchRegistryData();
      } else if (locationToEdit) {
        // Update mode — check for flag changes and descendants
        const id = Number(locationToEdit.id);
        const old = locationToEdit;
        const flagChanges: FlagChange[] = [];

        for (const key of FLAG_KEYS) {
          const oldVal = old[key] ?? null;
          const newVal = (values as any)[key] ?? null;
          if (String(oldVal) !== String(newVal)) {
            flagChanges.push({
              label: FLAG_LABELS[key],
              from: oldVal,
              to: newVal,
            });
          }
        }

        const hasDescendants =
          editFlagContext &&
          editFlagContext.descendantCount.locations +
            editFlagContext.descendantCount.beds >
            0;

        if (flagChanges.length > 0 && hasDescendants) {
          // Store pending and show cascade dialog
          setPendingEdit({
            id,
            values: values as UpdateLocationDto,
            flagChanges,
            name:
              (isTr && (locationToEdit as any).nameTr
                ? (locationToEdit as any).nameTr
                : locationToEdit.name) ?? "",
          });
          setCascadeModalOpened(true);
          setCreateModalOpened(false);
          setLocationToEdit(null);
          return;
        }

        // No flag changes or no descendants — apply directly
        await applyLocationUpdate(id, values as UpdateLocationDto, false);
        notifications.show({
          title: t("success"),
          message: t("location_updated", "Location updated successfully"),
          color: "green",
        });
        await refreshTree();
        if (activeView === "registry") fetchRegistryData();
      } else {
        // Single create mode — rooms always use the room-with-beds endpoint
        const dto = values as CreateLocationDto;
        if (dto.type === LocationType.ROOM) {
          await locations.createRoomWithBeds(dto as any);
        } else {
          await locations.create(dto);
        }

        notifications.show({
          title: t("success"),
          message: t("location_created", "Location created successfully"),
          color: "green",
        });
        await refreshTree();
        if (activeView === "registry") fetchRegistryData();
      }
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }

    setCreateModalOpened(false);
    setLocationToEdit(null);
  };

  const fetchTemplates = async () => {
    try {
      const res = await inventory.findAllTemplates();
      setTemplates(res);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    try {
      const [studentsRes, semestersRes] = await Promise.all([
        students.findAll({ limit: 1000 }),
        semesters.findAll({ limit: 1000 }),
      ]);
      setStudentList(studentsRes.data);
      setAllSemesters(semestersRes.data);
    } catch (error) {
      console.error("Failed to fetch booking data:", error);
    }
  };

  const handleCreateBooking = async (values: CreateBookingDto) => {
    try {
      await bookings.create(values);
      notifications.show({
        title: t("success"),
        message: t("booking_created", "Booking created successfully"),
        color: "green",
      });
      setBookingModalOpened(false);
      // Refresh tree to reflect new occupancy if needed
      await refreshTree();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_create_booking", "Failed to create booking"),
        color: "red",
      });
    }
  };

  const handleCreateStudent = async (values: CreateStudentDto) => {
    try {
      await students.create(values);
      notifications.show({
        title: t("success"),
        message: t("student_created", "Student created successfully"),
        color: "green",
      });
      // Refresh student list
      const studentsRes = await students.findAll({ limit: 1000 });
      setStudentList(studentsRes.data);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_create_student", "Failed to create student"),
        color: "red",
      });
    }
  };

  const handleOpenApplyTemplate = (item: any) => {
    // If it's a single item from the table row
    if (item) {
      setTemplateTargetType(item.type === "bed" ? "bed" : "location");
      // Pre-set the selection to just this one item
      setSelectedIds([item.id]);
    } else {
      // For bulk, use the active tab
      setTemplateTargetType(activeTab === "beds" ? "bed" : "location");
    }
    setApplyTemplateModalOpened(true);
  };

  const handleApplyTemplate = async (values: ApplyInventoryTemplateDto) => {
    setInventoryLoading(true);
    try {
      // Determine targets based on current selection or single view
      let payload = { ...values };

      if (selectedIds.length > 0) {
        const locationIds = selectedIds
          .filter((id) => typeof id === "string" && id.startsWith("loc-"))
          .map((id) => Number((id as string).replace("loc-", "")));

        const bedIds = selectedIds
          .filter((id) => typeof id === "string" && id.startsWith("bed-"))
          .map((id) => Number((id as string).replace("bed-", "")));

        payload.locationIds = locationIds.length > 0 ? locationIds : undefined;
        payload.bedIds = bedIds.length > 0 ? bedIds : undefined;
      } else if (selectedNode) {
        if (selectedNode.type === LocationType.BED) {
          const bid =
            typeof selectedNode.id === "string"
              ? Number(selectedNode.id.replace("bed-", ""))
              : Number(selectedNode.id);
          payload.bedIds = [bid];
        } else {
          payload.locationIds = [Number(selectedNode.id)];
        }
      }

      await inventory.applyTemplate(payload);
      notifications.show({
        title: t("success"),
        message: t("template_applied_success", {
          defaultValue: "Blueprint applied successfully",
        }),
        color: "green",
      });
      if (selectedNode) fetchInventory();
      clearSelection();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_apply_template"),
        color: "red",
      });
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleShowSelection = () => {
    setViewSelectionDrawerOpened(true);
  };

  const handleApplyBlueprintForNode = () => {
    if (!selectedNode) return;
    setTemplateTargetType(
      selectedNode.type === LocationType.BED ? "bed" : "location",
    );
    setApplyTemplateModalOpened(true);
  };

  const handleUpdateBed = async (values: any) => {
    if (!bedToEdit) return;
    try {
      const bedId =
        typeof bedToEdit.id === "string" && bedToEdit.id.startsWith("bed-")
          ? Number(bedToEdit.id.replace("bed-", ""))
          : Number(bedToEdit.id);
      await beds.update(bedId, values);
      notifications.show({
        title: t("success"),
        message: t("bed_updated", "Bed updated successfully"),
        color: "green",
      });
      if (activeView === "registry") fetchRegistryData();
      await refreshTree();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const handleAssignItem = async (values: CreateInventoryAssignmentDto) => {
    setInventoryLoading(true);
    try {
      await inventory.createAssignment(values);
      notifications.show({
        title: t("success"),
        message: t("assignment_created"),
        color: "green",
      });
      fetchInventory();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleUpdateAssignmentQuantity = async (
    id: string,
    quantity: number,
  ) => {
    setInventoryLoading(true);
    try {
      await inventory.updateAssignment(id, { quantity });
      fetchInventory();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    setInventoryLoading(true);
    try {
      await inventory.deleteAssignment(id);
      notifications.show({
        title: t("success"),
        message: t("assignment_deleted"),
        color: "green",
      });
      fetchInventory();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_delete"),
        color: "red",
      });
    } finally {
      setInventoryLoading(false);
    }
  };

  // Helper to find selected nodes for display
  const getSelectedNodes = () => {
    const found: any[] = [];
    const findRecursively = (nodes: LocationNode[]) => {
      for (const node of nodes) {
        const globalId =
          typeof node.id === "string" && node.id.startsWith("bed-")
            ? node.id
            : `loc-${node.id}`;

        if (selectedIds.includes(globalId)) {
          found.push(node);
        }
        if (node.children) {
          findRecursively(node.children);
        }
      }
    };
    findRecursively(treeData);

    // Also check registry data for selected items not in the currently loaded tree structure
    // (though tree usually has everything, it might be collapsed)
    registryData.forEach((item) => {
      const globalId =
        item.type === "bed" ? `bed-${item.id}` : `loc-${item.id}`;
      if (
        selectedIds.includes(globalId) &&
        !found.find((f) => {
          const fGlobalId = f.type === "bed" ? `bed-${f.id}` : `loc-${f.id}`;
          return fGlobalId === globalId;
        })
      ) {
        found.push(item);
      }
    });

    return found;
  };

  const selectedNodesList = viewSelectionDrawerOpened ? getSelectedNodes() : [];

  if (treeLoading && treeData.length === 0) {
    return (
      <Center h="100%">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <>
      <PageHeader
        title={t("locations_management", {
          defaultValue: "Locations Management",
        })}
        actions={
          <SegmentedControl
            value={activeView}
            onChange={setActiveView}
            data={[
              {
                label: (
                  <Center>
                    <IconHierarchy size={16} />
                    <Box ml={10}>{t("structure", "Structure")}</Box>
                  </Center>
                ),
                value: "structure",
              },
              {
                label: (
                  <Center>
                    <IconTable size={16} />
                    <Box ml={10}>{t("registry", "Registry")}</Box>
                  </Center>
                ),
                value: "registry",
              },
            ]}
          />
        }
      />
      <PageShell size="xl">
        {activeView === "structure" ? (
          <LocationsManager
            sidebar={
              <LocationTree
                data={treeData}
                selectedId={selectedNode?.id}
                onSelect={selectNode}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onSelectBranch={handleSelectBranch}
                onDeselectBranch={handleDeselectBranch}
                expandedIds={expandedIds}
                treeHeaderActions={
                  universityNode ? (
                    <Group justify="space-between" align="center">
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        {t("campuses", { defaultValue: "Campuses" })}
                      </Text>
                      <Tooltip
                        label={t("add_campus", {
                          defaultValue: "Add Campus",
                        })}
                      >
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => {
                            setLocationToEdit(null);
                            setParentForCreation({
                              id: Number(universityNode.id),
                              type: LocationType.UNIVERSITY,
                            });
                            setCreateModalOpened(true);
                          }}
                        >
                          <IconPlus size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  ) : undefined
                }
              />
            }
          >
            {selectedNode ? (
              <LocationDetail
                title={localizedName(selectedNode)}
                type={selectedNode.type}
                breadcrumbs={breadcrumbs}
                noScroll={selectedNode.type !== LocationType.BED}
                actions={
                  <>
                    {(selectedNode.type === LocationType.ROOM ||
                      selectedNode.type === LocationType.BED) && (
                      <Button
                        variant="filled"
                        color="green"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setBookingModalOpened(true)}
                      >
                        {t("create_booking")}
                      </Button>
                    )}
                    {selectedNode.type === LocationType.ROOM &&
                      !selectedNode.roomTypeId && (
                        <Button
                          variant="light"
                          leftSection={<IconPlus size={16} />}
                          onClick={() => setCreateBedModalOpened(true)}
                        >
                          {t("create_bed", { defaultValue: "Create Bed" })}
                        </Button>
                      )}
                    {selectedNode.type !== LocationType.ROOM &&
                      selectedNode.type !== LocationType.BED && (
                        <Button
                          leftSection={<IconPlus size={16} />}
                          onClick={handleOpenCreateChild}
                        >
                          {t("add_child")}
                        </Button>
                      )}
                    {selectedNode.type !== LocationType.UNIVERSITY && (
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
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={handleEditLocation}
                          >
                            {t("edit")}
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={handleDeleteSelected}
                          >
                            {t("delete")}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </>
                }
              >
                {/* ── Badges ──────────────────────────────────────────── */}
                <Group mb="xs" gap="xs" style={{ flexShrink: 0 }}>
                  {selectedNode.isRectorate && (
                    <Badge
                      variant="light"
                      color="blue"
                      leftSection={<IconBuildingBank size={14} />}
                    >
                      {t("rectorate")}
                    </Badge>
                  )}
                  {selectedNode.isTrOnly && (
                    <Badge
                      variant="light"
                      color="red"
                      leftSection={<IconFlag size={14} />}
                    >
                      TR Only
                    </Badge>
                  )}
                  {selectedNode.isForeignerOnly && (
                    <Badge
                      variant="light"
                      color="grape"
                      leftSection={<IconFlag size={14} />}
                    >
                      INT Only
                    </Badge>
                  )}
                  {selectedNode.studentYearLock && (
                    <Badge
                      variant="light"
                      color="violet"
                      leftSection={<IconUser size={14} />}
                    >
                      {selectedNode.studentYearLock === "new"
                        ? t("student_year_lock_new", "New students")
                        : t("student_year_lock_current", "Current students")}
                    </Badge>
                  )}
                  {selectedNode.isGuestZone && (
                    <Badge
                      variant="light"
                      color="orange"
                      leftSection={<IconUser size={14} />}
                    >
                      Guest Zone
                    </Badge>
                  )}
                  {selectedNode.type === LocationType.ROOM &&
                    !selectedNode.roomTypeId && (
                      <Badge
                        variant="light"
                        color="yellow"
                        leftSection={<IconAlertTriangle size={14} />}
                      >
                        No room type
                      </Badge>
                    )}
                  {selectedNode.roomTypeId && (
                    <Badge
                      variant="light"
                      color="green"
                      leftSection={<IconCurrencyDollar size={14} />}
                    >
                      {(isTr && selectedNode.roomTypeNameTr
                        ? selectedNode.roomTypeNameTr
                        : selectedNode.roomTypeName) ??
                        `Type #${selectedNode.roomTypeId}`}
                    </Badge>
                  )}
                </Group>

                {/* ── BED: detail view (single-column, scrollable) ─────── */}
                {selectedNode.type === LocationType.BED ? (
                  <Stack gap="md" p="md">
                    <LabelValue label={t("label", { defaultValue: "Label" })}>
                      {selectedNode.name}
                    </LabelValue>
                    <LabelValue label={t("status", { defaultValue: "Status" })}>
                      <Badge
                        color={
                          selectedNode.status === "available"
                            ? "green"
                            : selectedNode.status === "maintenance"
                              ? "orange"
                              : "blue"
                        }
                        variant="light"
                      >
                        {t(`bed_status.${selectedNode.status}`)}
                      </Badge>
                    </LabelValue>
                    {showInventory && (
                      <>
                        <Divider my="md" />
                        <InventoryAssignmentList
                          data={inventoryAssignments}
                          loading={inventoryLoading}
                          onAddClick={() => setAssignModalOpened(true)}
                          onRemove={handleDeleteAssignment}
                          onUpdateQuantity={handleUpdateAssignmentQuantity}
                          onApplyTemplate={handleApplyBlueprintForNode}
                        />
                      </>
                    )}
                  </Stack>
                ) : selectedNode.type === LocationType.ROOM ? (
                  /* ── ROOM: [Beds | Residents] + Inventory strip ─────────── */
                  <Box
                    style={{
                      flex: 1,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <Box
                      style={{
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        gap: 12,
                      }}
                    >
                      {/* Main — Beds */}
                      <ColumnPanel
                        title={`${t("beds", { defaultValue: "Beds" })} (${roomBeds.length})`}
                        flex={2}
                        headerRight={
                          roomBeds.length > 0 ? (
                            <Checkbox
                              size="xs"
                              label={t("select_all", {
                                defaultValue: "Select All",
                              })}
                              checked={
                                roomBeds.length > 0 &&
                                roomBeds.every((b) =>
                                  selectedIds.includes(`bed-${b.id}`),
                                )
                              }
                              indeterminate={
                                roomBeds.some((b) =>
                                  selectedIds.includes(`bed-${b.id}`),
                                ) &&
                                !roomBeds.every((b) =>
                                  selectedIds.includes(`bed-${b.id}`),
                                )
                              }
                              onChange={handleToggleSelectAllBeds}
                            />
                          ) : undefined
                        }
                      >
                        {roomBeds.length > 0 ? (
                          <SimpleGrid cols={2} spacing="sm">
                            {roomBeds.map((bed) => {
                              const globalId = `bed-${bed.id}`;
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
                                  selected={selectedIds.includes(globalId)}
                                  onClick={() =>
                                    selectNode({
                                      children: [],
                                      ...bed,
                                      id: globalId,
                                      name: bed.label,
                                      type: LocationType.BED,
                                    })
                                  }
                                  onSelect={() =>
                                    handleToggleSelection(globalId)
                                  }
                                  onEdit={() => {
                                    setBedToEdit(bed);
                                    setEditBedModalOpened(true);
                                  }}
                                  onDelete={() => handleDeleteBed(bed)}
                                  onBook={() => {
                                    selectNode({
                                      children: [],
                                      ...bed,
                                      id: globalId,
                                      name: bed.label,
                                      type: LocationType.BED,
                                    });
                                    setBookingModalOpened(true);
                                  }}
                                />
                              );
                            })}
                          </SimpleGrid>
                        ) : (
                          <EmptyState
                            title={t("no_beds_found", {
                              defaultValue: "No beds found",
                            })}
                          />
                        )}
                      </ColumnPanel>

                      {/* Sidebar — Residents */}
                      <ColumnPanel
                        title={`${t("residents")} (${roomResidents.length})`}
                        flex={1}
                        loading={residentsLoading}
                      >
                        {roomResidents.length > 0 ? (
                          <Stack gap="xs">
                            {roomResidents.map((r) => (
                              <Paper
                                key={r.bookingId}
                                withBorder
                                p="xs"
                                radius="sm"
                              >
                                <Group gap="xs" wrap="nowrap">
                                  <ThemeIcon
                                    size="sm"
                                    variant="light"
                                    color="blue"
                                    radius="xl"
                                  >
                                    <IconUser size={12} />
                                  </ThemeIcon>
                                  <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="xs" fw={600} lineClamp={1}>
                                      {r.firstName} {r.lastName}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {r.studentNumber} · {r.bedLabel}
                                    </Text>
                                  </Box>
                                </Group>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <EmptyState title={t("no_residents")} />
                        )}
                      </ColumnPanel>
                    </Box>

                    {/* Inventory — full-width strip at bottom */}
                    {showInventory && (
                      <Paper
                        withBorder
                        radius="md"
                        px="sm"
                        py={4}
                        style={{ flexShrink: 0 }}
                      >
                        <InventoryAssignmentList
                          data={inventoryAssignments}
                          loading={inventoryLoading}
                          onAddClick={() => setAssignModalOpened(true)}
                          onRemove={handleDeleteAssignment}
                          onUpdateQuantity={handleUpdateAssignmentQuantity}
                          onApplyTemplate={handleApplyBlueprintForNode}
                        />
                      </Paper>
                    )}
                  </Box>
                ) : (
                  /* ── FLOOR/BUILDING/etc.: main (sub-locs) + sidebar (occupancy / inventory) ── */
                  (() => {
                    const childrenLabel =
                      selectedNode.type === LocationType.UNIVERSITY
                        ? children.every((c) => c.type === LocationType.CAMPUS)
                          ? t("campuses", { defaultValue: "Campuses" })
                          : t("locations", { defaultValue: "Locations" })
                        : selectedNode.type === LocationType.CAMPUS
                          ? children.every(
                              (c) => c.type === LocationType.BUILDING,
                            )
                            ? t("buildings", { defaultValue: "Buildings" })
                            : t("locations", { defaultValue: "Locations" })
                          : selectedNode.type === LocationType.BUILDING
                            ? t("floors", { defaultValue: "Floors" })
                            : selectedNode.type === LocationType.FLOOR
                              ? t("rooms", { defaultValue: "Rooms" })
                              : t("locations", { defaultValue: "Locations" });
                    return (
                      <Box
                        style={{
                          flex: 1,
                          minHeight: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <Box
                          style={{
                            flex: 1,
                            minHeight: 0,
                            display: "flex",
                            gap: 12,
                          }}
                        >
                          {/* Main — Sub-locations */}
                          <ColumnPanel
                            title={`${childrenLabel} (${children.length})`}
                            flex={2}
                            headerRight={
                              children.length > 0 ? (
                                <Checkbox
                                  size="xs"
                                  label={t("select_all", {
                                    defaultValue: "Select All",
                                  })}
                                  checked={
                                    children.length > 0 &&
                                    children.every((c) =>
                                      selectedIds.includes(`loc-${c.id}`),
                                    )
                                  }
                                  indeterminate={
                                    children.some((c) =>
                                      selectedIds.includes(`loc-${c.id}`),
                                    ) &&
                                    !children.every((c) =>
                                      selectedIds.includes(`loc-${c.id}`),
                                    )
                                  }
                                  onChange={handleToggleSelectAllChildren}
                                />
                              ) : undefined
                            }
                          >
                            {children.length > 0 ? (
                              <SimpleGrid cols={2} spacing="sm">
                                {children.map((child) => {
                                  const globalId =
                                    child.type === LocationType.BED
                                      ? `bed-${child.id}`
                                      : `loc-${child.id}`;
                                  if (child.type === LocationType.ROOM) {
                                    const childBeds = (
                                      (child as any).children || []
                                    ).filter(
                                      (b: any) => b.type === LocationType.BED,
                                    );
                                    const occupiedBeds = childBeds.filter(
                                      (b: any) => b.status === "occupied",
                                    ).length;
                                    return (
                                      <RoomCard
                                        key={child.id}
                                        id={Number(child.id)}
                                        name={localizedName(child)}
                                        genderLock={
                                          child.genderLock || undefined
                                        }
                                        roomTypeName={
                                          isTr && child.roomTypeNameTr
                                            ? child.roomTypeNameTr
                                            : child.roomTypeName || undefined
                                        }
                                        totalBeds={
                                          childBeds.length || undefined
                                        }
                                        occupiedBeds={occupiedBeds}
                                        isTrOnly={child.isTrOnly}
                                        isGuestZone={child.isGuestZone}
                                        isRectorate={child.isRectorate}
                                        isForeignerOnly={child.isForeignerOnly}
                                        studentYearLock={
                                          child.studentYearLock || undefined
                                        }
                                        selected={selectedIds.includes(
                                          globalId,
                                        )}
                                        onClick={() => selectNode(child as any)}
                                        onSelect={() =>
                                          handleToggleSelection(globalId)
                                        }
                                        onEdit={() =>
                                          handleEditChild(child as any)
                                        }
                                        onDelete={() =>
                                          handleDeleteChild(child as any)
                                        }
                                      />
                                    );
                                  }
                                  return (
                                    <GenericLocationCard
                                      key={child.id}
                                      id={Number(child.id)}
                                      name={localizedName(child)}
                                      icon={<LocationIcon type={child.type} />}
                                      childCount={
                                        (child as any).children?.length
                                      }
                                      selected={selectedIds.includes(globalId)}
                                      onClick={() => selectNode(child as any)}
                                      onSelect={() =>
                                        handleToggleSelection(globalId)
                                      }
                                      onEdit={() =>
                                        handleEditChild(child as any)
                                      }
                                      onDelete={() =>
                                        handleDeleteChild(child as any)
                                      }
                                    />
                                  );
                                })}
                              </SimpleGrid>
                            ) : (
                              <EmptyState title={t("no_sub_locations")} />
                            )}
                          </ColumnPanel>

                          {/* Sidebar — Occupancy */}
                          <ColumnPanel title={t("occupancy")} flex={1}>
                            <OccupancyPanel stats={nodeStats} t={t} />
                          </ColumnPanel>
                        </Box>

                        {/* Inventory — full-width strip at bottom */}
                        {showInventory && (
                          <Paper
                            withBorder
                            radius="md"
                            px="sm"
                            py={4}
                            style={{ flexShrink: 0 }}
                          >
                            <InventoryAssignmentList
                              data={inventoryAssignments}
                              loading={inventoryLoading}
                              onAddClick={() => setAssignModalOpened(true)}
                              onRemove={handleDeleteAssignment}
                              onUpdateQuantity={handleUpdateAssignmentQuantity}
                              onApplyTemplate={handleApplyBlueprintForNode}
                            />
                          </Paper>
                        )}
                      </Box>
                    );
                  })()
                )}
              </LocationDetail>
            ) : (
              <EmptyState
                title={t("select_location_prompt", {
                  defaultValue: "Select a location to view details",
                })}
              />
            )}
          </LocationsManager>
        ) : (
          <Stack gap="md">
            <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
              <Tabs.List>
                <Tabs.Tab
                  value="locations"
                  leftSection={<LocationIcon type={LocationType.CAMPUS} />}
                >
                  {t("locations", "Locations")}
                </Tabs.Tab>
                <Tabs.Tab
                  value="beds"
                  leftSection={<LocationIcon type={LocationType.BED} />}
                >
                  {t("beds", "Beds")}
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="locations" pt="md">
                <Paper withBorder radius="md" style={{ position: "relative" }}>
                  <LoadingOverlay visible={registryLoading} />
                  <LocationRegistryTable
                    mode="locations"
                    data={registryData}
                    filters={registryFilters}
                    totalCount={totalRegistryItems}
                    onFilterChange={handleFilterChange}
                    onBatchFilterChange={handleBatchFilterChange}
                    onClearFilters={handleClearFilters}
                    onOpenDetail={handleOpenDetail}
                    onView={(loc) => {
                      setActiveView("structure");
                      selectNode(loc as any);
                    }}
                    onEdit={handleRegistryEdit}
                    onDelete={handleRegistryDelete}
                    onEmailResidents={(locationId) =>
                      setEmailLocationId(locationId)
                    }
                    selectedIds={selectedIds}
                    onToggleSelection={handleToggleSelection}
                    onToggleSelectAll={handleToggleSelectAllRegistry}
                    onSelectAllMatching={handleSelectAllMatching}
                    allMatchingSelected={allMatchingSelected}
                    roomTypes={roomTypesList}
                  />
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="beds" pt="md">
                <Paper withBorder radius="md" style={{ position: "relative" }}>
                  <LoadingOverlay visible={registryLoading} />
                  <LocationRegistryTable
                    mode="beds"
                    data={registryData}
                    filters={registryFilters}
                    totalCount={totalRegistryItems}
                    onFilterChange={handleFilterChange}
                    onBatchFilterChange={handleBatchFilterChange}
                    onClearFilters={handleClearFilters}
                    onOpenDetail={handleOpenDetail}
                    onView={(bed) => {
                      setActiveView("structure");
                      selectNode({
                        ...bed,
                        id: `bed-${bed.id}`,
                        type: LocationType.BED,
                      } as any);
                    }}
                    onEdit={handleRegistryEdit}
                    onDelete={handleRegistryDelete}
                    selectedIds={selectedIds}
                    onToggleSelection={handleToggleSelection}
                    onToggleSelectAll={handleToggleSelectAllRegistry}
                    onSelectAllMatching={handleSelectAllMatching}
                    allMatchingSelected={allMatchingSelected}
                    roomTypes={roomTypesList}
                  />
                </Paper>
              </Tabs.Panel>
            </Tabs>

            <Group justify="flex-end">
              <Pagination
                total={Math.ceil(
                  totalRegistryItems / (registryFilters.limit || 10),
                )}
                value={registryFilters.page}
                onChange={(p) => handleFilterChange("page", p)}
              />
            </Group>
          </Stack>
        )}

        <CreateLocationModal
          opened={createModalOpened}
          onClose={() => {
            setCreateModalOpened(false);
            setLocationToEdit(null);
          }}
          onSubmit={handleSubmitLocation}
          parentId={parentForCreation.id}
          parentType={parentForCreation.type}
          initialValues={locationToEdit}
          roomTypes={roomTypesList}
          parentAncestorFlags={
            locationToEdit ? editFlagContext?.ancestorFlags : null
          }
        />

        <CreateBedModal
          opened={createBedModalOpened}
          onClose={() => setCreateBedModalOpened(false)}
          onSubmit={handleCreateBed}
          locationId={Number(selectedNode?.id)}
        />

        <CreateBedModal
          opened={editBedModalOpened}
          onClose={() => {
            setEditBedModalOpened(false);
            setBedToEdit(null);
          }}
          onSubmit={handleUpdateBed}
          locationId={bedToEdit?.locationId}
          initialValues={bedToEdit}
        />

        <AssignInventoryModal
          opened={assignModalOpened}
          onClose={() => setAssignModalOpened(false)}
          onSubmit={handleAssignItem}
          catalog={filteredCatalog}
          locationId={
            selectedNode?.type !== LocationType.BED
              ? Number(selectedNode?.id)
              : undefined
          }
          bedId={
            selectedNode?.type === LocationType.BED
              ? typeof selectedNode.id === "string"
                ? Number(selectedNode.id.replace("bed-", ""))
                : Number(selectedNode.id)
              : undefined
          }
          loading={inventoryLoading}
        />

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onDelete={handleBulkDelete}
          onEdit={handleBulkEdit}
          onApplyTemplate={() => handleOpenApplyTemplate(null)}
          onClear={clearSelection}
          onShowSelection={handleShowSelection}
        />

        <BulkEditLocationModal
          opened={bulkEditModalOpened}
          onClose={() => setBulkEditModalOpened(false)}
          onSubmit={handleSubmitBulkEdit}
          count={selectedIds.length}
        />

        <ApplyTemplateModal
          opened={applyTemplateModalOpened}
          onClose={() => setApplyTemplateModalOpened(false)}
          onSubmit={handleApplyTemplate}
          templates={templates}
          targetType={templateTargetType}
          count={selectedIds.length || 1}
          loading={inventoryLoading}
        />

        <CreateBookingModal
          opened={bookingModalOpened}
          onClose={() => setBookingModalOpened(false)}
          onSubmit={handleCreateBooking}
          onCreateStudent={handleCreateStudent}
          students={studentList.map((s) => ({
            value: s.id,
            label: `${s.firstName} ${s.lastName} (${s.studentNumber})`,
          }))}
          semesters={allSemesters}
          countries={countries}
          departments={departments}
          initialBedId={
            selectedNode?.type === LocationType.BED
              ? typeof selectedNode.id === "string"
                ? Number(selectedNode.id.replace("bed-", ""))
                : Number(selectedNode.id)
              : null
          }
          initialLocationId={
            selectedNode?.type !== LocationType.BED && selectedNode?.id
              ? typeof selectedNode.id === "string" &&
                selectedNode.id.startsWith("loc-")
                ? Number(selectedNode.id.replace("loc-", ""))
                : Number(selectedNode.id)
              : null
          }
        />

        <Drawer
          opened={viewSelectionDrawerOpened}
          onClose={() => setViewSelectionDrawerOpened(false)}
          title={`${t("selected_items", { defaultValue: "Selected Items" })} (${selectedIds.length})`}
          position="right"
        >
          <Stack gap="xs">
            {selectedNodesList.map((node) => {
              const globalId =
                node.type === LocationType.BED || node.type === "bed"
                  ? typeof node.id === "string" && node.id.startsWith("bed-")
                    ? node.id
                    : `bed-${node.id}`
                  : `loc-${node.id}`;

              return (
                <Paper key={globalId} withBorder p="xs">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <LocationIcon type={node.type} />
                      <Text size="sm" fw={500}>
                        {node.type === LocationType.BED || node.type === "bed"
                          ? `${node.locationName || ""} - ${node.label || node.name}`
                          : localizedName(node)}
                      </Text>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => handleToggleSelection(globalId)}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              );
            })}
            {selectedNodesList.length === 0 && (
              <EmptyState
                title={t("no_selection", { defaultValue: "No items selected" })}
              />
            )}
          </Stack>
        </Drawer>

        <RegistryItemDrawer
          item={registryDetailItem}
          opened={registryDetailOpen}
          onClose={() => {
            setRegistryDetailOpen(false);
            setRegistryItemFlagContext(null);
          }}
          isTr={isTr}
          flagContext={registryItemFlagContext}
          onEdit={(item) => {
            setRegistryDetailOpen(false);
            handleRegistryEdit(item);
          }}
          onDelete={(item) => {
            setRegistryDetailOpen(false);
            handleRegistryDelete(item);
          }}
          onBook={handleRegistryBook}
          onNavigate={(item) => {
            if (item.type === "bed") {
              setActiveView("structure");
              selectNode({
                ...item,
                id: `bed-${item.id}`,
                type: LocationType.BED,
                children: [],
              } as any);
            } else {
              setActiveView("structure");
              selectNode({ ...item, children: [] } as any);
            }
          }}
          onEmailResidents={(locationId) => {
            setRegistryDetailOpen(false);
            setEmailLocationId(locationId);
          }}
        />

        <FlagCascadeConfirmModal
          opened={cascadeModalOpened}
          onClose={() => {
            setCascadeModalOpened(false);
            setPendingEdit(null);
          }}
          onConfirmCascade={() => handleCascadeConfirm(true)}
          onConfirmSingleOnly={() => handleCascadeConfirm(false)}
          locationName={pendingEdit?.name ?? ""}
          flagChanges={pendingEdit?.flagChanges ?? []}
          descendantCount={
            editFlagContext?.descendantCount ?? { locations: 0, beds: 0 }
          }
          descendantPreview={editFlagContext?.descendantPreview ?? []}
          isTr={isTr}
          loading={cascadeLoading}
        />

        <ComposeEmailModal
          opened={emailLocationId !== null}
          onClose={() => setEmailLocationId(null)}
          resolveDto={{ scope: "location", locationId: emailLocationId ?? 0 }}
        />
      </PageShell>
    </>
  );
}

export function SharedLocationsPage() {
  return (
    <LocationsProvider>
      <LocationsContent />
    </LocationsProvider>
  );
}
