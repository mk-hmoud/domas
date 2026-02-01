import { useState, useEffect } from "react";
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
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconFlag,
  IconBuildingBank,
  IconCurrencyDollar,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import {
  LocationType,
  UpdateLocationDto,
  CreateLocationDto,
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
} from "@domas/ui";
import { LocationsProvider, useLocations } from "../context/LocationsContext";
import { useTranslation } from "react-i18next";
import { locations } from "@domas/api-client";
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
    loading,
    selectNode,
    deleteLocation,
    refreshTree,
  } = useLocations();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [bulkEditModalOpened, setBulkEditModalOpened] = useState(false);
  const [viewSelectionDrawerOpened, setViewSelectionDrawerOpened] =
    useState(false);
  const [parentForCreation, setParentForCreation] = useState<{
    id: number | null;
    type?: LocationType;
  }>({ id: null });
  const [locationToEdit, setLocationToEdit] = useState<LocationNode | null>(
    null,
  );

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

  // Shared Selection State (Tree + Children)
  const { selectedIds, toggleSelection, setSelectedIds, clearSelection } =
    useLocationSelection([]);

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
    // Find the node to check its type
    const findNode = (nodes: LocationNode[]): LocationNode | undefined => {
      for (const node of nodes) {
        if (String(node.id) === String(id)) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const node = findNode(treeData);
    if (node?.type === LocationType.UNIVERSITY) return;

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

  const handleEditChild = (child: LocationNode) => {
    setLocationToEdit(child);
    setParentForCreation({ id: null });
    setCreateModalOpened(true);
  };

  const confirmDeleteLocation = (node: LocationNode) => {
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
      },
    });
  };

  const handleDeleteChild = (child: LocationNode) => {
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

      // Refresh the tree after any modification
      await refreshTree();
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

  const handleShowSelection = () => {
    setViewSelectionDrawerOpened(true);
  };

  // Helper to find selected nodes for display
  const getSelectedNodes = () => {
    const found: LocationNode[] = [];
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
    return found;
  };

  const selectedNodesList = viewSelectionDrawerOpened ? getSelectedNodes() : [];

  if (loading && treeData.length === 0) {
    return (
      <Center h="100%">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title mb="lg">
        {t("locations_management", { defaultValue: "Locations Management" })}
      </Title>
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
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setCreateBedModalOpened(true)}
                  >
                    {t("create_bed", { defaultValue: "Create Bed" })}
                  </Button>
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
              </>
            )}
          </LocationDetail>
        ) : (
          <Center h="100%">
            <Text c="dimmed">{t("select_location_prompt")}</Text>
          </Center>
        )}
      </LocationsManager>

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

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onEdit={handleBulkEdit}
        onClear={clearSelection}
        onShowSelection={handleShowSelection}
      />

      <BulkEditLocationModal
        opened={bulkEditModalOpened}
        onClose={() => setBulkEditModalOpened(false)}
        onSubmit={handleSubmitBulkEdit}
        count={selectedIds.length}
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
