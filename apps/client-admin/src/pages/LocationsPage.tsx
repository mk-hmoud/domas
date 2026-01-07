import { useState } from 'react';
import {
  Grid,
  Paper,
  Title,
  ScrollArea,
  NavLink,
  Group,
  Text,
  Breadcrumbs,
  Button,
  Anchor,
  Badge,
  SimpleGrid,
  Card,
  Progress,
} from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconBuilding,
  IconLayoutDashboard,
  IconStairs,
  IconBed,
  IconPlus,
  IconDoor,
} from '@tabler/icons-react';
import { LocationType } from '@domas/ts-types';

// --- MOCK DATA ---
const MOCK_TREE = [
  {
    id: 1,
    name: 'Main Campus',
    type: LocationType.CAMPUS,
    children: [
      {
        id: 11,
        name: 'Engineering Dorms',
        type: LocationType.BUILDING,
        children: [
          {
            id: 111,
            name: 'Block A',
            type: LocationType.BLOCK,
            children: [
              { id: 1111, name: 'Floor 1', type: LocationType.FLOOR, children: [] },
              { id: 1112, name: 'Floor 2', type: LocationType.FLOOR, children: [] },
            ],
          },
        ],
      },
      {
        id: 12,
        name: 'Medical Dorms',
        type: LocationType.BUILDING,
        children: [],
      },
    ],
  },
];

// Mock rooms for when a Floor is selected
const MOCK_ROOMS = Array.from({ length: 12 }).map((_, i) => ({
  id: 2000 + i,
  name: `Room ${101 + i}`,
  type: LocationType.ROOM,
  capacity: 4,
  occupied: Math.floor(Math.random() * 5),
  gender: i % 2 === 0 ? 'Male' : 'Female',
}));

// --- COMPONENTS ---

function LocationIcon({ type }: { type: LocationType }) {
  switch (type) {
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

function LocationTreeItem({ node, selectedId, onSelect }: any) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <NavLink
      key={node.id}
      label={node.name}
      leftSection={<LocationIcon type={node.type} />}
      active={node.id === selectedId}
      onClick={() => onSelect(node)}
      defaultOpened
    >
      {hasChildren &&
        node.children.map((child: any) => (
          <LocationTreeItem
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </NavLink>
  );
}

export function LocationsPage() {
  const [selectedNode, setSelectedNode] = useState<any>(MOCK_TREE[0]);

  return (
    <Grid h="calc(100vh - 100px)">
      {' '}
      {/* Adjust height for header */}
      {/* LEFT SIDEBAR: TREE */}
      <Grid.Col span={3} style={{ height: '100%' }}>
        <Paper
          withBorder
          h="100%"
          radius="md"
          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Group justify="space-between">
              <Text fw={700}>Locations</Text>
              <Button size="xs" variant="light">
                <IconPlus size={14} />
              </Button>
            </Group>
          </div>
          <ScrollArea style={{ flex: 1 }}>
            {MOCK_TREE.map((node) => (
              <LocationTreeItem
                key={node.id}
                node={node}
                selectedId={selectedNode?.id}
                onSelect={setSelectedNode}
              />
            ))}
          </ScrollArea>
        </Paper>
      </Grid.Col>
      {/* RIGHT PANEL: DETAILS */}
      <Grid.Col span={9} style={{ height: '100%' }}>
        <Paper
          withBorder
          h="100%"
          p="md"
          radius="md"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* HEADER */}
          <Group justify="space-between" mb="md">
            <div>
              <Breadcrumbs mb="xs">
                <Anchor size="sm">Main Campus</Anchor>
                <Anchor size="sm">Engineering Dorms</Anchor>
                <Text size="sm" c="dimmed">
                  {selectedNode.name}
                </Text>
              </Breadcrumbs>
              <Title order={2}>{selectedNode.name}</Title>
            </div>
            <Group>
              <Button variant="default">Edit</Button>
              <Button leftSection={<IconPlus size={16} />}>Add Child</Button>
            </Group>
          </Group>

          {/* CONTENT AREA */}
          <ScrollArea style={{ flex: 1 }}>
            {selectedNode.type === LocationType.FLOOR ? (
              /* ROOM GRID VIEW */
              <>
                <Text c="dimmed" mb="md">
                  Rooms on this floor
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                  {MOCK_ROOMS.map((room) => (
                    <Card key={room.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <IconDoor size={18} color="gray" />
                          <Text fw={600}>{room.name}</Text>
                        </Group>
                        <Badge color={room.gender === 'Male' ? 'blue' : 'pink'} variant="light">
                          {room.gender}
                        </Badge>
                      </Group>

                      <Text size="xs" c="dimmed" mb={4}>
                        Occupancy: {room.occupied} / {room.capacity}
                      </Text>
                      <Progress
                        value={(room.occupied / room.capacity) * 100}
                        color={room.occupied >= room.capacity ? 'red' : 'blue'}
                        size="md"
                        radius="xl"
                      />
                    </Card>
                  ))}
                </SimpleGrid>
              </>
            ) : (
              /* SUB-LOCATION LIST VIEW (e.g. Buildings inside a Campus) */
              <SimpleGrid cols={1}>
                {selectedNode.children && selectedNode.children.length > 0 ? (
                  selectedNode.children.map((child: any) => (
                    <Paper
                      key={child.id}
                      withBorder
                      p="md"
                      onClick={() => setSelectedNode(child)}
                      style={{ cursor: 'pointer' }}
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
          </ScrollArea>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}
