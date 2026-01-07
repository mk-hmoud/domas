import { useState } from "react";
import {
  Button,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Text,
  Progress,
  Paper,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconPlus,
  IconDoor,
  IconBuildingSkyscraper,
  IconBuilding,
  IconLayoutDashboard,
  IconStairs,
  IconBed,
  IconSchool,
  IconTrash,
} from "@tabler/icons-react";
import { LocationType } from "@domas/ts-types";
import {
  LocationsManager,
  LocationTree,
  LocationDetail,
  CreateLocationModal,
  ConfirmDeleteModal,
  LocationNode,
} from "@domas/ui";
import { LocationsProvider, useLocations } from "../context/LocationsContext";

function LocationIcon({ type }: { type: LocationType }) {
  switch (type) {
    case LocationType.UNIVERSITY:
      return <IconSchool size={16} />;
    case LocationType.CAMPUS:
      return <IconBuildingSkyscraper size={16} />;
    case LocationType.BUILDING:
      return <IconBuilding size={16} />;
    case LocationType.BLOCK:
      return <IconLayoutDashboard size={16} />;
    case LocationType.FLOOR:
      return <IconStairs size={16} />;
    case LocationType.ROOM:
      return <IconBed size={16} />;
    default:
      return null;
  }
}

// Helper to find path to node
function findPath(
  nodes: LocationNode[],
  targetId: string | number,
): LocationNode[] | null {
  for (const node of nodes) {
    if (String(node.id) === String(targetId)) return [node];
    if (node.children) {
      const path = findPath(node.children, targetId);
      if (path) return [node, ...path];
    }
  }
  return null;
}

function LocationsContent() {
  const {
    treeData,
    selectedNode,
    children,
    loading,
    selectNode,
    createLocation,
    deleteLocation,
  } = useLocations();

  // ... existing state ...
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [parentForCreation, setParentForCreation] = useState<{
    id: number | null;
    type?: LocationType;
  }>({ id: null });
  const [nodeToDelete, setNodeToDelete] = useState<LocationNode | null>(null);

  // Calculate breadcrumbs
  const breadcrumbs = selectedNode
    ? findPath(treeData, selectedNode.id)?.map((n) => ({
        label: n.name,
        onClick: () => selectNode(n),
      }))
    : [];

  const handleOpenCreateRoot = () => {
    setParentForCreation({ id: null });
    setCreateModalOpened(true);
  };

  const handleOpenCreateChild = () => {
    if (selectedNode) {
      setParentForCreation({
        id: Number(selectedNode.id),
        type: selectedNode.type,
      });
      setCreateModalOpened(true);
    }
  };

  const handleAddChildToSelected = () => {
    if (selectedNode) {
      setParentForCreation({
        id: Number(selectedNode.id),
        type: selectedNode.type,
      });
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

  if (loading && treeData.length === 0) {
    return (
      <Center h="100%">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <>
      <LocationsManager
        sidebar={
          <LocationTree
            data={treeData}
            selectedId={selectedNode?.id}
            onSelect={selectNode}
            onAddRoot={handleOpenCreateRoot}
            onAddChildToSelected={handleAddChildToSelected}
            onDeleteSelected={handleDeleteSelected}
          />
        }
      >
        {selectedNode ? (
          <LocationDetail
            title={selectedNode.name}
            breadcrumbs={breadcrumbs}
            actions={
              <>
                <Button variant="default">Edit</Button>
                <Button
                  variant="default"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleDeleteSelected}
                >
                  Delete
                </Button>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleOpenCreateChild}
                >
                  Add Child
                </Button>
              </>
            }
          >
            {selectedNode.type === LocationType.FLOOR ? (
              <>
                <Text c="dimmed" mb="md">
                  Rooms on this floor
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  {children.map((room) => (
                    <Card key={room.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <IconDoor size={18} color="gray" />
                          <Text fw={600}>{room.name}</Text>
                        </Group>
                        <Badge
                          color={room.genderLock === "male" ? "blue" : "pink"}
                          variant="light"
                        >
                          {room.genderLock}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mb={4}>
                        Occupancy: 0 / {room.capacity}
                      </Text>
                      <Progress value={0} color="blue" size="md" radius="xl" />
                    </Card>
                  ))}
                </SimpleGrid>
              </>
            ) : (
              <SimpleGrid cols={1}>
                {children.length > 0 ? (
                  children.map((child) => (
                    <Paper
                      key={child.id}
                      withBorder
                      p="md"
                      onClick={() => selectNode(child as any)}
                      style={{ cursor: "pointer" }}
                    >
                      <Group>
                        <LocationIcon type={child.type} />
                        <Text>{child.name}</Text>
                        <Badge ml="auto" variant="dot">
                          Active
                        </Badge>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No sub-locations found. Add one to get started.
                  </Text>
                )}
              </SimpleGrid>
            )}
          </LocationDetail>
        ) : (
          <Center h="100%">
            <Text c="dimmed">Select a location to view details</Text>
          </Center>
        )}
      </LocationsManager>

      <CreateLocationModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={createLocation}
        parentId={parentForCreation.id}
        parentType={parentForCreation.type}
      />

      <ConfirmDeleteModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Location"
        message={`Are you sure you want to delete "${nodeToDelete?.name}"? All its children will also be deleted.`}
      />
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
