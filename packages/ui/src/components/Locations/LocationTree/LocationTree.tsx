import { useState, useMemo, useEffect, useRef, ReactNode } from "react";
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
import { EmptyState } from "../../EmptyState/EmptyState";
import {
  IconSearch,
  IconChevronRight,
  IconListCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./locationTree.module.css";

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
  selectedIds?: (number | string)[];
  onToggleSelection?: (id: number | string) => void;
  onSelectBranch?: (ids: (number | string)[]) => void;
  onDeselectBranch?: (ids: (number | string)[]) => void;
  expandedIds?: Set<string | number>;
  treeHeaderActions?: ReactNode;
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
  onDeselectBranch?: (ids: (number | string)[]) => void;
  expandedIds?: Set<string | number>;
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

function getNodeFontWeight(type: LocationType): number | undefined {
  if (type === LocationType.UNIVERSITY || type === LocationType.CAMPUS)
    return 600;
  if (type === LocationType.BUILDING) return 500;
  return undefined;
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
  onDeselectBranch,
  expandedIds,
}: TreeItemProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const displayName = isTr && node.nameTr ? node.nameTr : node.name;
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const childCount = node.children ? node.children.length : 0;
  const hasChildren = childCount > 0;
  const isSelected = String(node.id) === String(selectedId);

  const globalId =
    typeof node.id === "string" && node.id.startsWith("bed-")
      ? node.id
      : `loc-${node.id}`;

  const isChecked = selectedIds?.includes(globalId);

  // Auto-expand when this node is an ancestor of the selected node
  useEffect(() => {
    if (expandedIds?.has(globalId)) {
      setOpened(true);
    }
  }, [expandedIds]);

  // Scroll into view when selected, after expansion animations settle
  useEffect(() => {
    if (isSelected) {
      const timeout = setTimeout(() => {
        buttonRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isSelected]);

  useEffect(() => {
    if (forceExpand) setOpened(true);
  }, [forceExpand]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpened((o) => !o);
  };

  const handleCheckboxChange = () => {
    if (onToggleSelection) onToggleSelection(globalId);
  };

  const handleBranchSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = getAllDescendantIds(node);
    const allSelected = ids.every((id) => selectedIds?.includes(id));
    if (allSelected && onDeselectBranch) {
      onDeselectBranch(ids);
    } else if (onSelectBranch) {
      onSelectBranch(ids);
    }
  };

  const branchIds = getAllDescendantIds(node);
  const allBranchSelected =
    branchIds.length > 0 && branchIds.every((id) => selectedIds?.includes(id));

  const getStatusColor = (status?: string) => {
    if (status === "available") return "var(--mantine-color-green-filled)";
    if (status === "occupied") return "var(--mantine-color-blue-filled)";
    if (status === "maintenance") return "var(--mantine-color-orange-filled)";
    return "transparent";
  };

  return (
    <>
      <UnstyledButton
        ref={buttonRef}
        onClick={() => onSelect(node)}
        className={`${classes.item} ${isSelected ? classes.itemSelected : ""}`}
        style={{
          padding: `${rem(8)} ${rem(12)}`,
          paddingLeft: `calc(${rem(14)} + ${rem(level * 16)})`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Group wrap="nowrap" gap={6}>
          <Box
            className={hasChildren ? classes.chevronBox : undefined}
            style={
              !hasChildren
                ? { width: rem(20), height: rem(20), flexShrink: 0 }
                : undefined
            }
            onClick={hasChildren ? handleToggle : undefined}
          >
            {hasChildren && (
              <IconChevronRight
                className={`${classes.chevron} ${opened ? classes.chevronOpen : ""}`}
              />
            )}
          </Box>

          {onToggleSelection && node.type !== LocationType.UNIVERSITY && (
            <Group gap={4} style={{ flexShrink: 0 }}>
              <Checkbox
                checked={isChecked}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                size="xs"
              />
              {hovered &&
                (onSelectBranch || onDeselectBranch) &&
                hasChildren && (
                  <Tooltip
                    label={
                      allBranchSelected
                        ? t("deselect_branch", {
                            defaultValue: "Deselect Branch",
                          })
                        : t("select_branch", { defaultValue: "Select Branch" })
                    }
                  >
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color={allBranchSelected ? "gray" : "blue"}
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
            fw={getNodeFontWeight(node.type)}
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "inherit",
            }}
          >
            {displayName}
          </Text>

          {node.type === LocationType.BED ? (
            <Box
              style={{
                width: rem(8),
                height: rem(8),
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor: getStatusColor(node.status),
              }}
            />
          ) : (
            childCount > 0 && (
              <Badge
                size="xs"
                variant="light"
                color="gray"
                circle
                style={{ flexShrink: 0 }}
              >
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
              onDeselectBranch={onDeselectBranch}
              expandedIds={expandedIds}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}

function filterTree(nodes: LocationNode[], query: string): LocationNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();
  const filtered: LocationNode[] = [];
  for (const node of nodes) {
    const children = node.children
      ? filterTree(node.children, query)
      : undefined;
    const matches =
      node.name.toLowerCase().includes(lowerQuery) ||
      (node.nameTr ?? "").toLowerCase().includes(lowerQuery);
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
  onDeselectBranch,
  expandedIds,
  treeHeaderActions,
}: LocationTreeProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  const filteredData = useMemo(
    () => filterTree(data, debouncedQuery),
    [data, debouncedQuery],
  );

  // Unwrap university nodes — render their children as top-level items
  const displayData = useMemo(
    () =>
      filteredData.flatMap((n) =>
        n.type === LocationType.UNIVERSITY ? (n.children ?? []) : [n],
      ),
    [filteredData],
  );

  const isFiltering = debouncedQuery.length > 0;

  return (
    <Paper
      withBorder
      h="100%"
      radius="md"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {treeHeaderActions && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--mantine-color-default-border)",
          }}
        >
          {treeHeaderActions}
        </div>
      )}
      <div
        style={{
          padding: "0.75rem",
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
          size="sm"
        />
      </div>
      <ScrollArea style={{ flex: 1 }}>
        <Box p="xs">
          {displayData.map((node) => (
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
              onDeselectBranch={onDeselectBranch}
              expandedIds={expandedIds}
            />
          ))}
          {displayData.length === 0 && (
            <EmptyState
              title={t("no_locations_found", {
                defaultValue: "No locations found",
              })}
            />
          )}
        </Box>
      </ScrollArea>
    </Paper>
  );
}
