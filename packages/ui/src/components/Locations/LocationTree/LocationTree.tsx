import { useState, useMemo, useEffect } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ScrollArea,
  Text,
  Paper,
  rem,
  TextInput,
  Badge,
  Collapse,
  UnstyledButton,
  Group,
  Box,
  Checkbox,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { LocationType } from "@domas/ts-types";
import { LocationIcon } from "../LocationIcon";
import {
  IconSearch,
  IconChevronRight,
  IconChevronDown,
  IconListCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

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
  // Bulk selection props
  selectedIds?: (number | string)[];
  onToggleSelection?: (id: number | string) => void;
  onSelectBranch?: (ids: (number | string)[]) => void;
}

interface TreeItemProps {
  node: LocationNode;
  selectedId?: number | string;
  onSelect: (n: LocationNode) => void;
  level: number;
  forceExpand?: boolean;
  selectedIds?: (number | string)[];
  onToggleSelection?: (id: number | string) => void;
  onSelectBranch?: (ids: (number | string)[]) => void;
}

function getAllDescendantIds(node: LocationNode): (number | string)[] {
  const globalId =
    typeof node.id === "string" && node.id.startsWith("bed-")
      ? node.id
      : `loc-${node.id}`;

  let ids: (string | number)[] = [globalId];
  if (node.children) {
    for (const child of node.children) {
      ids = [...ids, ...getAllDescendantIds(child)];
    }
  }
  return ids;
}

function TreeItem({
  node,
  selectedId,
  onSelect,
  level,
  forceExpand,
  selectedIds,
  onToggleSelection,
  onSelectBranch,
}: TreeItemProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);
  const childCount = node.children ? node.children.length : 0;
  const hasChildren = childCount > 0;
  // Handle string vs number ID comparison safely
  const isSelected = String(node.id) === String(selectedId);

  const globalId =
    typeof node.id === "string" && node.id.startsWith("bed-")
      ? node.id
      : `loc-${node.id}`;

  const isChecked = selectedIds?.includes(globalId);

  useEffect(() => {
    if (forceExpand) {
      setOpened(true);
    }
  }, [forceExpand]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpened((o) => !o);
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const handleCheckboxChange = () => {
    if (onToggleSelection) {
      onToggleSelection(globalId);
    }
  };

  const handleBranchSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectBranch) {
      const ids = getAllDescendantIds(node);
      onSelectBranch(ids);
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === "available") return "var(--mantine-color-green-filled)";
    if (status === "occupied") return "var(--mantine-color-blue-filled)";
    if (status === "maintenance") return "var(--mantine-color-orange-filled)";
    return "transparent";
  };

  return (
    <>
      <UnstyledButton
        onClick={handleSelect}
        style={{
          display: "block",
          width: "100%",
          padding: `${rem(6)} ${rem(12)}`,
          paddingLeft: `calc(${rem(12)} + ${rem(level * 16)})`,
          backgroundColor: isSelected
            ? "var(--mantine-color-blue-light)"
            : "transparent",
          color: isSelected
            ? "var(--mantine-color-blue-filled)"
            : "var(--mantine-color-text)",
          borderRadius: rem(4),
          marginBottom: rem(2),
          transition: "background-color 0.1s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          setHovered(true);
          if (!isSelected)
            e.currentTarget.style.backgroundColor =
              "var(--mantine-color-default-hover)";
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          if (!isSelected)
            e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Group wrap="nowrap" gap={6}>
          <Box
            style={{
              width: rem(20),
              height: rem(20),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: hasChildren ? "pointer" : "default",
              borderRadius: rem(4),
              transition: "background-color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (hasChildren)
                e.currentTarget.style.backgroundColor =
                  "var(--mantine-color-default-hover)";
            }}
            onMouseLeave={(e) => {
              if (hasChildren)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={hasChildren ? handleToggle : undefined}
          >
            {hasChildren &&
              (opened ? (
                <IconChevronDown style={{ width: rem(14) }} />
              ) : (
                <IconChevronRight style={{ width: rem(14) }} />
              ))}
          </Box>

          {onToggleSelection && node.type !== LocationType.UNIVERSITY && (
            <Group gap={4}>
              <Checkbox
                checked={isChecked}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
              />
              {/* Hover Action: Select Branch */}
              {hovered && onSelectBranch && hasChildren && (
                <Tooltip
                  label={t("select_branch", { defaultValue: "Select Branch" })}
                >
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="blue"
                    onClick={handleBranchSelection}
                  >
                    <IconListCheck size={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}

          <LocationIcon type={node.type} />

          <Text
            size="sm"
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.name}
          </Text>

          {node.type === LocationType.BED ? (
            <Box
              style={{
                width: rem(8),
                height: rem(8),
                borderRadius: "50%",
                backgroundColor: getStatusColor(node.status),
              }}
            />
          ) : (
            childCount > 0 && (
              <Badge size="xs" variant="light" color="gray" circle>
                {childCount}
              </Badge>
            )
          )}
        </Group>
      </UnstyledButton>

      {hasChildren && (
        <Collapse in={opened}>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
              forceExpand={forceExpand}
              selectedIds={selectedIds}
              onToggleSelection={onToggleSelection}
              onSelectBranch={onSelectBranch}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}

// Helper to filter tree
function filterTree(nodes: LocationNode[], query: string): LocationNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();

  const filtered: LocationNode[] = [];

  for (const node of nodes) {
    const children = node.children
      ? filterTree(node.children, query)
      : undefined;
    const matches = node.name.toLowerCase().includes(lowerQuery);

    if (matches || (children && children.length > 0)) {
      filtered.push({ ...node, children: children || [] });
    }
  }

  return filtered;
}

export function LocationTree({
  data,
  selectedId,
  onSelect,
  selectedIds,
  onToggleSelection,
  onSelectBranch,
}: LocationTreeProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  const filteredData = useMemo(
    () => filterTree(data, debouncedQuery),
    [data, debouncedQuery],
  );
  const isFiltering = debouncedQuery.length > 0;

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
        <TextInput
          placeholder={t("search_placeholder", { defaultValue: "Search..." })}
          leftSection={
            <IconSearch style={{ width: rem(16), height: rem(16) }} />
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </div>
      <ScrollArea style={{ flex: 1 }}>
        <Box p="xs">
          {filteredData.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              selectedId={selectedId}
              onSelect={onSelect}
              level={0}
              forceExpand={isFiltering}
              selectedIds={selectedIds}
              onToggleSelection={onToggleSelection}
              onSelectBranch={onSelectBranch}
            />
          ))}
          {filteredData.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="md">
              No locations found
            </Text>
          )}
        </Box>
      </ScrollArea>
    </Paper>
  );
}
