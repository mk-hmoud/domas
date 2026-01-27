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
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconFlag,
  IconBuildingBank,
  IconCurrencyDollar,
  IconUser,
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
  ConfirmDeleteModal,
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
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [parentForCreation, setParentForCreation] = useState<{
    id: number | null;
    type?: LocationType;
  }>({ id: null });
  const [nodeToDelete, setNodeToDelete] = useState<LocationNode | null>(null);
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

  const {
    selectedIds: selectedChildIds,
    toggleSelection: toggleChildSelection,
    toggleSelectAll,
    clearSelection: clearChildSelection,
  } = useLocationSelection(children.map((c) => Number(c.id)));

  // Calculate breadcrumbs
  const breadcrumbs = selectedNode
    ? findLocationPath(treeData, selectedNode.id)?.map((n) => ({
        label: n.name,
        onClick: () => selectNode(n),
      }))
    : [];

  useEffect(() => {
    clearChildSelection();
  }, [selectedNode]);

  const handleBulkDelete = async () => {
    if (
      !confirm(
        t("delete_confirm_count", {
          count: selectedChildIds.length,
          defaultValue: `Delete ${selectedChildIds.length} items?`,
        }),
      )
    )
      return;

    try {
      await locations.deleteMany({ ids: selectedChildIds });
      notifications.show({
        title: t("success"),
        message: t("delete_success"),
        color: "green",
      });
      await refreshTree();
      clearChildSelection();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("delete_error"),
        color: "red",
      });
    }
  };

  const handleBulkEdit = () => {
    setBulkEditModalOpened(true);
  };

  const handleSubmitBulkEdit = async (values: UpdateLocationDto) => {
    try {
      await locations.updateMany({ ids: selectedChildIds, data: values });
      notifications.show({
        title: t("success"),
        message: t("locations_updated", "Locations updated successfully"),
        color: "green",
      });
      await refreshTree();
      clearChildSelection();
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

  const handleDeleteChild = (child: LocationNode) => {
    setNodeToDelete(child);
    setDeleteModalOpened(true);
  };

  const handleEditLocation = () => {
    if (selectedNode) {
      setLocationToEdit(selectedNode);
      setParentForCreation({ id: null }); // Not creating child
      setCreateModalOpened(true);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNode) {
      setNodeToDelete(selectedNode);
      setDeleteModalOpened(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (nodeToDelete) {
      await deleteLocation(Number(nodeToDelete.id));
      setDeleteModalOpened(false);
      setNodeToDelete(null);
    }
  };

  const handleSubmitLocation = async (
    values: CreateLocationDto | UpdateLocationDto | CreateLocationDto[],
  ) => {
    try {
      if (Array.isArray(values)) {
        // Bulk create mode
        await locations.createMany({ locations: values });
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
        // Single create mode: Use direct API or context method
        await locations.create(values as CreateLocationDto);
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
                {roomBeds.length === 0 && (
                  <Text c="dimmed" ta="center" py="md">
                    No beds found
                  </Text>
                )}
              </SimpleGrid>
            ) : (
              <>
                {children.length > 0 && (
                  <Group mb="md">
                    <Checkbox
                      checked={
                        selectedChildIds.length > 0 &&
                        selectedChildIds.length === children.length
                      }
                      indeterminate={
                        selectedChildIds.length > 0 &&
                        selectedChildIds.length < children.length
                      }
                      onChange={toggleSelectAll}
                      label={t("select_all", { defaultValue: "Select All" })}
                    />
                  </Group>
                )}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  {children.length > 0 ? (
                    children.map((child) =>
                      selectedNode.type === LocationType.FLOOR ? (
                        <RoomCard
                          key={child.id}
                          id={Number(child.id)}
                          name={child.name}
                          genderLock={child.genderLock || undefined}
                          capacity={child.capacity}
                          selected={selectedChildIds.includes(Number(child.id))}
                          onClick={() => selectNode(child as any)}
                          onSelect={() =>
                            toggleChildSelection(Number(child.id))
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
                          selected={selectedChildIds.includes(Number(child.id))}
                          onClick={() => selectNode(child as any)}
                          onSelect={() =>
                            toggleChildSelection(Number(child.id))
                          }
                          onEdit={() => handleEditChild(child as any)}
                          onDelete={() => handleDeleteChild(child as any)}
                        />
                      ),
                    )
                  ) : (
                    <Text c="dimmed" ta="center" py="xl">
                      {t("no_sub_locations")}
                    </Text>
                  )}
                </SimpleGrid>
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

      <ConfirmDeleteModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleConfirmDelete}
        title={t("delete_location_title")}
        message={t("delete_location_message", { name: nodeToDelete?.name })}
      />

      <BulkActionsBar
        selectedCount={selectedChildIds.length}
        onDelete={handleBulkDelete}
        onEdit={handleBulkEdit}
        onClear={clearChildSelection}
      />

      <BulkEditLocationModal
        opened={bulkEditModalOpened}
        onClose={() => setBulkEditModalOpened(false)}
        onSubmit={handleSubmitBulkEdit}
        count={selectedChildIds.length}
      />
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
