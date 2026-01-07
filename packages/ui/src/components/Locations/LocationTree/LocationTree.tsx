import {
  NavLink,
  ScrollArea,
  Group,
  Text,
  Button,
  Paper,
  ActionIcon,
  rem,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { LocationType } from "@domas/ts-types";
import {
  IconBuildingSkyscraper,
  IconBuilding,
  IconLayoutDashboard,
  IconStairs,
  IconBed,
  IconSchool,
} from "@tabler/icons-react";

export interface LocationNode {
  id: number | string;
  name: string;
  type: LocationType;
  children?: LocationNode[];
  [key: string]: any;
}

export interface LocationTreeProps {
  data: LocationNode[];
  selectedId?: number | string;
  onSelect: (node: LocationNode) => void;
  onAddRoot?: () => void;
  onAddChildToSelected?: () => void;
  onDeleteSelected?: () => void;
}

function LocationIcon({ type }: { type: LocationType }) {
  const iconProps = { style: { width: rem(16), height: rem(16) } };
  switch (type) {
    case LocationType.UNIVERSITY:
      return <IconSchool {...iconProps} />;
    case LocationType.CAMPUS:
      return <IconBuildingSkyscraper {...iconProps} />;
    case LocationType.BUILDING:
      return <IconBuilding {...iconProps} />;
    case LocationType.BLOCK:
      return <IconLayoutDashboard {...iconProps} />;
    case LocationType.FLOOR:
      return <IconStairs {...iconProps} />;
    case LocationType.ROOM:
      return <IconBed {...iconProps} />;
    default:
      return null;
  }
}

function TreeItem({
  node,
  selectedId,
  onSelect,
}: {
  node: LocationNode;
  selectedId?: number | string;
  onSelect: (n: LocationNode) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <NavLink
      key={node.id}
      label={node.name}
      leftSection={<LocationIcon type={node.type} />}
      active={String(node.id) === String(selectedId)}
      onClick={() => onSelect(node)}
      defaultOpened
    >
      {hasChildren &&
        node.children!.map((child) => (
          <TreeItem
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </NavLink>
  );
}

export function LocationTree({
  data,
  selectedId,
  onSelect,
  onAddRoot,
  onAddChildToSelected,
  onDeleteSelected,
}: LocationTreeProps) {
  return (
    <Paper
      withBorder
      h="100%"
      radius="md"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group justify="space-between">
          <Text fw={700}>Locations</Text>
          <Group gap={4}>
            {onAddChildToSelected && selectedId && (
              <ActionIcon
                variant="light"
                onClick={onAddChildToSelected}
                title="Add Child"
              >
                <IconPlus style={{ width: rem(16), height: rem(16) }} />
              </ActionIcon>
            )}
            {onDeleteSelected && selectedId && (
              <ActionIcon
                variant="light"
                color="red"
                onClick={onDeleteSelected}
                title="Delete Selected"
              >
                <IconTrash style={{ width: rem(16), height: rem(16) }} />
              </ActionIcon>
            )}
            {onAddRoot && (
              <Button size="xs" variant="light" onClick={onAddRoot}>
                Add Root
              </Button>
            )}
          </Group>
        </Group>
      </div>
      <ScrollArea style={{ flex: 1 }}>
        {data.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </ScrollArea>
    </Paper>
  );
}
