import { useState, useEffect, useMemo } from "react";
import {
  Button,
  SimpleGrid,
  Group,
  Badge,
  Text,
  Paper,
  Loader,
  Center,
  Title,
  Container,
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
  IconFiles,
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
} from "@domas/ui";
import { LocationsProvider, useLocations } from "../context/LocationsContext";
import { useTranslation } from "react-i18next";
import { locations, inventory, beds } from "@domas/api-client";
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

  // Calculate breadcrumbs
  const breadcrumbs = selectedNode
    ? findLocationPath(treeData, selectedNode.id)?.map((n) => ({
        label: n.name,
        onClick: () => selectNode(n),
      }))
    : [];

  useEffect(() => {
    // We clear child selection contextually when navigating,
    // but maybe user wants to keep global selection?
    // Based on requirements, they work together.
  }, [selectedNode]);

  const handleToggleSelection = (id: number | string) => {
    // Handle prefixed IDs from tree (e.g. "bed-123")
    const numericId =
      typeof id === "string" && id.startsWith("bed-")
        ? Number(id.replace("bed-", ""))
        : Number(id);

    if (!isNaN(numericId)) {
      toggleSelection(numericId);
    }
  };

  const handleSelectBranch = (ids: (number | string)[]) => {
    const numericIds = ids
      .map((id) =>
        typeof id === "string" && id.startsWith("bed-")
          ? Number(id.replace("bed-", ""))
          : Number(id),
      )
      .filter((id) => !isNaN(id));

    setSelectedIds((prev) => Array.from(new Set([...prev, ...numericIds])));
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
          await locations.deleteMany({ ids: selectedIds });
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
      await locations.updateMany({ ids: selectedIds, data: values });
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
    if (selectedNode) {
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
    const childIds = children.map((c) => Number(c.id));
    const allSelected = childIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !childIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...childIds])));
    }
  };

  const handleToggleSelectAllRegistry = () => {
    const allIds = registryData.map((l) => l.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
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
        if (createBedsCount && createBedsCount > 0) {
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
        if (createBedsCount && createBedsCount > 0) {
          // Use specialized endpoint for single room with beds
          await locations.createRoomWithBeds({
            ...(values as CreateLocationDto),
            bedCount: createBedsCount,
          });
        } else {
          await locations.create(values as CreateLocationDto);
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
  }, []);

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
        if (activeTab === "beds") {
          payload.bedIds = selectedIds;
        } else {
          payload.locationIds = selectedIds;
        }
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
        const numericId =
          typeof node.id === "string" && node.id.startsWith("bed-")
            ? Number(node.id.replace("bed-", ""))
            : Number(node.id);

        if (selectedIds.includes(numericId)) {
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
      if (
        selectedIds.includes(item.id) &&
        !found.find((f) => f.id === item.id)
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
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title>
          {t("locations_management", { defaultValue: "Locations Management" })}
        </Title>
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
      </Group>

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
                  {selectedNode.type !== LocationType.UNIVERSITY && (
                    <>
                      <Button variant="default" onClick={handleEditLocation}>
                        {t("edit")}
                      </Button>
                      <Button
                        variant="default"
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={handleDeleteSelected}
                      >
                        {t("delete")}
                      </Button>
                    </>
                  )}
                  {selectedNode.type === LocationType.ROOM ? (
                    <>
                      <Button
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setCreateBedModalOpened(true)}
                      >
                        {t("create_bed", { defaultValue: "Create Bed" })}
                      </Button>
                      <Button
                        variant="light"
                        color="blue"
                        leftSection={<IconFiles size={16} />}
                        onClick={() => {
                          setTemplateTargetType("location");
                          setApplyTemplateModalOpened(true);
                        }}
                      >
                        {t("apply_blueprint")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={handleOpenCreateChild}
                    >
                      {t("add_child")}
                    </Button>
                  )}
                </>
              }
            >
              <Paper p="md" mb="md" withBorder bg="var(--mantine-color-body)">
                <Group>
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
                  {selectedNode.basePrice > 0 && (
                    <Badge
                      variant="light"
                      color="green"
                      leftSection={<IconCurrencyDollar size={14} />}
                    >
                      {selectedNode.basePrice}
                    </Badge>
                  )}
                </Group>
              </Paper>

              {selectedNode.type === LocationType.BED ? (
                <Stack gap="md" p="md">
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t("bed_label", { defaultValue: "Label" })}
                    </Text>
                    <Text size="lg" fw={600}>
                      {selectedNode.name}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t("status", { defaultValue: "Status" })}
                    </Text>
                    <Badge
                      color={
                        selectedNode.status === "available"
                          ? "green"
                          : selectedNode.status === "maintenance"
                            ? "orange"
                            : "blue"
                      }
                    >
                      {t(`bed_status.${selectedNode.status}`)}
                    </Badge>
                  </Box>

                  {showInventory && (
                    <>
                      <Divider />
                      <InventoryAssignmentList
                        data={inventoryAssignments}
                        loading={inventoryLoading}
                        onAddClick={() => setAssignModalOpened(true)}
                        onRemove={handleDeleteAssignment}
                        onUpdateQuantity={handleUpdateAssignmentQuantity}
                      />
                    </>
                  )}
                </Stack>
              ) : selectedNode.type === LocationType.ROOM ? (
                <>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                    {roomBeds.map((bed) => (
                      <BedCard
                        key={bed.id}
                        id={bed.id}
                        label={bed.label}
                        status={bed.status}
                        onClick={() =>
                          selectNode({
                            children: [],
                            ...bed,
                            id: `bed-${bed.id}`,
                            name: bed.label,
                            type: LocationType.BED,
                          })
                        }
                        onEdit={() => {}}
                        onDelete={() => handleDeleteBed(bed)}
                      />
                    ))}
                  </SimpleGrid>
                  {roomBeds.length === 0 && (
                    <Text c="dimmed" ta="center" py="md">
                      No beds found
                    </Text>
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
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  {children.length > 0 && (
                    <Group mb="md">
                      <Checkbox
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
                        label={t("select_all", { defaultValue: "Select All" })}
                      />
                    </Group>
                  )}
                  {children.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                      {children.map((child) =>
                        selectedNode.type === LocationType.FLOOR ? (
                          <RoomCard
                            key={child.id}
                            id={Number(child.id)}
                            name={child.name}
                            genderLock={child.genderLock || undefined}
                            selected={selectedIds.includes(Number(child.id))}
                            onClick={() => selectNode(child as any)}
                            onSelect={() =>
                              handleToggleSelection(Number(child.id))
                            }
                            onEdit={() => handleEditChild(child as any)}
                            onDelete={() => handleDeleteChild(child as any)}
                          />
                        ) : (
                          <GenericLocationCard
                            key={child.id}
                            id={Number(child.id)}
                            name={child.name}
                            icon={<LocationIcon type={child.type} />}
                            selected={selectedIds.includes(Number(child.id))}
                            onClick={() => selectNode(child as any)}
                            onSelect={() =>
                              handleToggleSelection(Number(child.id))
                            }
                            onEdit={() => handleEditChild(child as any)}
                            onDelete={() => handleDeleteChild(child as any)}
                          />
                        ),
                      )}
                    </SimpleGrid>
                  ) : (
                    <Text c="dimmed" ta="center" py="xl">
                      {t("no_sub_locations")}
                    </Text>
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
                      />
                    </>
                  )}
                </>
              )}
            </LocationDetail>
          ) : (
            <Center h="100%">
              <Text c="dimmed">{t("select_location_prompt")}</Text>
            </Center>
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
                <Paper withBorder radius="md" style={{ position: "relative" }}>
                  <LoadingOverlay visible={registryLoading} />
                  <LocationRegistryTable
                    data={registryData}
                    onView={(loc) => {
                      setActiveView("structure");
                      selectNode(loc as any);
                    }}
                    onEdit={handleEditChild}
                    onDelete={confirmDeleteLocation}
                    onApplyTemplate={handleOpenApplyTemplate}
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
                <Paper withBorder radius="md" style={{ position: "relative" }}>
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
                    onEdit={(bed) => {
                      setBedToEdit(bed);
                      setEditBedModalOpened(true);
                    }}
                    onDelete={(bed) => {
                      modals.openConfirmModal({
                        title: t("delete_bed"),
                        children: (
                          <Text size="sm">{t("confirm_delete_message")}</Text>
                        ),
                        labels: { confirm: t("confirm"), cancel: t("cancel") },
                        confirmProps: { color: "red" },
                        onConfirm: async () => {
                          await beds.remove(bed.id);
                          fetchRegistryData();
                        },
                      });
                    }}
                    onApplyTemplate={handleOpenApplyTemplate}
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

      <Drawer
        opened={viewSelectionDrawerOpened}
        onClose={() => setViewSelectionDrawerOpened(false)}
        title={`${t("selected_items", { defaultValue: "Selected Items" })} (${selectedIds.length})`}
        position="right"
      >
        <Stack gap="xs">
          {selectedNodesList.map((node) => (
            <Paper key={node.id} withBorder p="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <LocationIcon type={node.type} />
                  <Text size="sm" fw={500}>
                    {node.name}
                  </Text>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => handleToggleSelection(node.id)}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
          {selectedNodesList.length === 0 && (
            <Text c="dimmed" ta="center">
              {t("no_selection", { defaultValue: "No items selected" })}
            </Text>
          )}
        </Stack>
      </Drawer>
    </Container>
  );
}

export function SharedLocationsPage() {
  return (
    <LocationsProvider>
      <LocationsContent />
    </LocationsProvider>
  );
}
