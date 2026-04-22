import { useState, useEffect, useMemo } from "react";
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
  Divider,
  SegmentedControl,
  Pagination,
  LoadingOverlay,
  Tabs,
  Menu,
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
  LocationRegistryFilters,
  ApplyTemplateModal,
  CreateBookingModal,
  ComposeEmailModal,
  EmptyState,
  LabelValue,
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
import { findLocationPath } from "../utils/location-utils";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

function LocationsContent() {
  const { t } = useTranslation();
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
        setRegistryData(result.data);
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
  }, [activeView, activeTab, registryFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setRegistryFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleClearFilters = () => {
    setRegistryFilters({
      page: 1,
      limit: 10,
      q: "",
      type: undefined,
      genderLock: undefined,
      isTrOnly: undefined,
      isGuestZone: undefined,
      ownership: undefined,
      onlyVacant: undefined,
      status: undefined,
    });
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

  // Calculate breadcrumbs
  const locationPath = selectedNode
    ? findLocationPath(treeData, selectedNode.id)
    : null;

  const breadcrumbs =
    locationPath?.map((n) => ({
      label: n.name,
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
        if (values.ownership)
          bedPromises.push(
            beds.updateOwnershipMany({
              ids: bedIds,
              ownership: values.ownership,
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
          {t("delete_location_message", { name: node.name })}
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

  const handleSubmitLocation = async (
    values: CreateLocationDto | UpdateLocationDto | CreateLocationDto[],
    createBedsCount?: number,
  ) => {
    try {
      if (Array.isArray(values)) {
        // Bulk create mode
        const isRoomBulk = values.every((v) => v.type === LocationType.ROOM);
        if (createBedsCount && createBedsCount > 0 && isRoomBulk) {
          // Use specialized bulk endpoint for rooms with beds
          const roomsWithBeds = values.map((v) => ({
            ...v,
            bedCount: createBedsCount,
          }));
          await locations.createRoomsWithBedsMany({
            rooms: roomsWithBeds as any,
          });
        } else {
          await locations.createMany({ locations: values });
        }

        notifications.show({
          title: t("success"),
          message: t("locations_created", "Locations created successfully"),
          color: "green",
        });
      } else if (locationToEdit) {
        // Update mode
        await locations.update(Number(locationToEdit.id), values);
        notifications.show({
          title: t("success"),
          message: t("location_updated", "Location updated successfully"),
          color: "green",
        });
      } else {
        // Single create mode
        const dto = values as CreateLocationDto;
        if (
          createBedsCount &&
          createBedsCount > 0 &&
          dto.type === LocationType.ROOM
        ) {
          // Use specialized endpoint for single room with beds
          await locations.createRoomWithBeds({
            ...dto,
            bedCount: createBedsCount,
          });
        } else {
          await locations.create(dto);
        }

        notifications.show({
          title: t("success"),
          message: t("location_created", "Location created successfully"),
          color: "green",
        });
      }

      // Refresh data
      await refreshTree();
      if (activeView === "registry") fetchRegistryData();
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
      await beds.update(bedToEdit.id, values);
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
                expandedIds={expandedIds}
              />
            }
          >
            {selectedNode ? (
              <LocationDetail
                title={selectedNode.name}
                type={selectedNode.type}
                breadcrumbs={breadcrumbs}
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
                    {selectedNode.type === LocationType.ROOM && (
                      <Button
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setCreateBedModalOpened(true)}
                      >
                        {t("create_bed", { defaultValue: "Create Bed" })}
                      </Button>
                    )}
                    {selectedNode.type !== LocationType.ROOM &&
                      selectedNode.type !== LocationType.BED &&
                      selectedNode.type !== LocationType.UNIVERSITY && (
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
                <Group mb="md" gap="xs">
                  <Badge
                    variant="light"
                    color="blue"
                    leftSection={<IconBuildingBank size={14} />}
                  >
                    {t(`ownerships.${selectedNode.ownership}`, {
                      defaultValue: selectedNode.ownership,
                    })}
                  </Badge>
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
                      {selectedNode.roomTypeName ??
                        `Type #${selectedNode.roomTypeId}`}
                    </Badge>
                  )}
                </Group>

                {selectedNode.type === LocationType.BED ? (
                  <Stack gap="md" p="md">
                    <LabelValue
                      label={t("bed_label", { defaultValue: "Label" })}
                    >
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
                  <>
                    <Group justify="space-between" align="center" mb="sm">
                      <Text
                        size="xs"
                        c="dimmed"
                        fw={600}
                        tt="uppercase"
                        style={{ letterSpacing: "0.05em" }}
                      >
                        {t("beds", { defaultValue: "Beds" })} ({roomBeds.length}
                        )
                      </Text>
                      {roomBeds.length > 0 && (
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
                          onChange={() => {
                            const allBedIds = roomBeds.map(
                              (b) => `bed-${b.id}`,
                            );
                            const allSelected = allBedIds.every((id) =>
                              selectedIds.includes(id),
                            );
                            if (allSelected) {
                              setSelectedIds((prev) =>
                                prev.filter(
                                  (id) => !allBedIds.includes(id as string),
                                ),
                              );
                            } else {
                              setSelectedIds((prev) =>
                                Array.from(new Set([...prev, ...allBedIds])),
                              );
                            }
                          }}
                        />
                      )}
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                      {roomBeds.map((bed) => {
                        const globalId = `bed-${bed.id}`;
                        return (
                          <BedCard
                            key={bed.id}
                            id={bed.id}
                            label={bed.label}
                            status={bed.status}
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
                            onSelect={() => handleToggleSelection(globalId)}
                            onEdit={() => {}}
                            onDelete={() => handleDeleteBed(bed)}
                            onBook={() => {
                              // First select the node so the modal gets the right initialBedId
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
                    {roomBeds.length === 0 && (
                      <EmptyState
                        title={t("no_beds_found", {
                          defaultValue: "No beds found",
                        })}
                      />
                    )}

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
                  </>
                ) : (
                  <>
                    <Group justify="space-between" align="center" mb="sm">
                      <Text
                        size="xs"
                        c="dimmed"
                        fw={600}
                        tt="uppercase"
                        style={{ letterSpacing: "0.05em" }}
                      >
                        {selectedNode.type === LocationType.UNIVERSITY
                          ? t("campuses", { defaultValue: "Campuses" })
                          : selectedNode.type === LocationType.CAMPUS
                            ? t("buildings", { defaultValue: "Buildings" })
                            : selectedNode.type === LocationType.BUILDING
                              ? t("floors", { defaultValue: "Floors" })
                              : selectedNode.type === LocationType.FLOOR
                                ? t("rooms", { defaultValue: "Rooms" })
                                : t("locations", {
                                    defaultValue: "Locations",
                                  })}{" "}
                        ({children.length})
                      </Text>
                      {children.length > 0 && (
                        <Checkbox
                          size="xs"
                          label={t("select_all", {
                            defaultValue: "Select All",
                          })}
                          checked={
                            children.length > 0 &&
                            children.every((c) =>
                              selectedIds.includes(Number(c.id)),
                            )
                          }
                          indeterminate={
                            children.some((c) =>
                              selectedIds.includes(Number(c.id)),
                            ) &&
                            !children.every((c) =>
                              selectedIds.includes(Number(c.id)),
                            )
                          }
                          onChange={handleToggleSelectAllChildren}
                        />
                      )}
                    </Group>
                    {children.length > 0 ? (
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                        {children.map((child) => {
                          const globalId =
                            child.type === LocationType.BED
                              ? `bed-${child.id}`
                              : `loc-${child.id}`;
                          return selectedNode.type === LocationType.FLOOR ? (
                            <RoomCard
                              key={child.id}
                              id={Number(child.id)}
                              name={child.name}
                              genderLock={child.genderLock || undefined}
                              selected={selectedIds.includes(globalId)}
                              onClick={() => selectNode(child as any)}
                              onSelect={() => handleToggleSelection(globalId)}
                              onEdit={() => handleEditChild(child as any)}
                              onDelete={() => handleDeleteChild(child as any)}
                            />
                          ) : (
                            <GenericLocationCard
                              key={child.id}
                              id={Number(child.id)}
                              name={child.name}
                              icon={<LocationIcon type={child.type} />}
                              selected={selectedIds.includes(globalId)}
                              onClick={() => selectNode(child as any)}
                              onSelect={() => handleToggleSelection(globalId)}
                              onEdit={() => handleEditChild(child as any)}
                              onDelete={() => handleDeleteChild(child as any)}
                            />
                          );
                        })}
                      </SimpleGrid>
                    ) : (
                      <EmptyState title={t("no_sub_locations")} />
                    )}

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
                  </>
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
                <Stack gap="md">
                  <LocationRegistryFilters
                    filters={registryFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                  <Paper
                    withBorder
                    radius="md"
                    style={{ position: "relative" }}
                  >
                    <LoadingOverlay visible={registryLoading} />
                    <LocationRegistryTable
                      data={registryData}
                      onView={(loc) => {
                        setActiveView("structure");
                        selectNode(loc as any);
                      }}
                      onEmailResidents={(locationId) =>
                        setEmailLocationId(locationId)
                      }
                      selectedIds={selectedIds}
                      onToggleSelection={handleToggleSelection}
                      onToggleSelectAll={handleToggleSelectAllRegistry}
                    />
                  </Paper>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="beds" pt="md">
                <Stack gap="md">
                  <LocationRegistryFilters
                    filters={registryFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                  <Paper
                    withBorder
                    radius="md"
                    style={{ position: "relative" }}
                  >
                    <LoadingOverlay visible={registryLoading} />
                    <LocationRegistryTable
                      data={registryData}
                      onView={(bed) => {
                        setActiveView("structure");
                        // Convert virtual ID to bed- prefixed ID for the tree
                        const targetId = `bed-${bed.id}`;
                        selectNode({
                          ...bed,
                          id: targetId,
                          type: LocationType.BED,
                        } as any);
                      }}
                      selectedIds={selectedIds}
                      onToggleSelection={handleToggleSelection}
                      onToggleSelectAll={handleToggleSelectAllRegistry}
                    />
                  </Paper>
                </Stack>
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
                          : node.name}
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
