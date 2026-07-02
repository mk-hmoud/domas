import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Location, CreateLocationDto } from "@domas/ts-types";
import { locations, beds } from "@domas/api-client";
import { LocationNode } from "@domas/ui";
import { LocationType } from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";

interface LocationsContextType {
  treeData: LocationNode[];
  selectedNode: LocationNode | null;
  children: Location[];
  loading: boolean;
  selectNode: (node: LocationNode) => void;
  createLocation: (data: CreateLocationDto) => Promise<void>;
  deleteLocation: (id: number) => Promise<void>;
  refreshTree: () => Promise<void>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined,
);

function buildTree(flatList: Location[]): LocationNode[] {
  const pathMap = new Map<string, LocationNode>();
  const treeRoots: LocationNode[] = [];

  // Create all nodes
  flatList.forEach((loc) => {
    pathMap.set(loc.treePath, { ...loc, children: [] });
  });

  // Link children to parents
  flatList.forEach((loc) => {
    const node = pathMap.get(loc.treePath)!;
    const parts = loc.treePath.split(".");

    if (parts.length === 1) {
      treeRoots.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join(".");
      const parent = pathMap.get(parentPath);
      if (parent) {
        parent.children?.push(node);
      } else {
        // Fallback for orphans
        treeRoots.push(node);
      }
    }
  });

  return treeRoots;
}

function findInTree(
  nodes: LocationNode[],
  id: number | string,
): LocationNode | undefined {
  for (const node of nodes) {
    if (String(node.id) === String(id)) return node;
    if (node.children) {
      const found = findInTree(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

// Module-level beds cache — beds don't change during location CRUD so we fetch once per session.
type BedsResult = Awaited<ReturnType<typeof beds.findAll>>;
let bedsCache: BedsResult | null = null;
let bedsCachePromise: Promise<BedsResult> | null = null;

function getCachedBeds(): Promise<BedsResult> {
  if (bedsCache) return Promise.resolve(bedsCache);
  if (!bedsCachePromise) {
    bedsCachePromise = beds.findAll({ limit: 10000 }).then((res) => {
      bedsCache = res;
      return res;
    });
  }
  return bedsCachePromise;
}

function attachBedsToTree(builtTree: LocationNode[], bedsRes: BedsResult) {
  const bedsByRoom = new Map<number, any[]>();
  bedsRes.data.forEach((bed) => {
    if (!bedsByRoom.has(bed.locationId)) bedsByRoom.set(bed.locationId, []);
    bedsByRoom.get(bed.locationId)?.push({
      ...bed,
      id: `bed-${bed.id}`,
      name: bed.label,
      type: LocationType.BED,
      treePath: "",
      children: [],
      status: bed.status,
    });
  });

  const addBedsToTree = (nodes: LocationNode[]) => {
    for (const node of nodes) {
      if (node.type === LocationType.ROOM) {
        const roomBeds = bedsByRoom.get(Number(node.id));
        if (roomBeds) {
          roomBeds.sort((a, b) => a.name.localeCompare(b.name));
          node.children = [...(node.children || []), ...roomBeds];
        }
      }
      if (node.children) addBedsToTree(node.children);
    }
  };

  addBedsToTree(builtTree);
}

export function LocationsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [treeData, setTreeData] = useState<LocationNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<LocationNode | null>(null);
  const [childNodes, setChildren] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const selectNode = useCallback((node: LocationNode) => {
    setSelectedNode(node);
    setChildren((node.children as unknown as Location[]) || []);
  }, []);

  const getFirstSelectable = useCallback(
    (nodes: LocationNode[]): LocationNode | null => {
      for (const n of nodes) {
        if (n.type !== LocationType.UNIVERSITY) return n;
        const child = getFirstSelectable(n.children ?? []);
        if (child) return child;
      }
      return null;
    },
    [],
  );

  const refreshTree = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [locsRes, bedsRes] = await Promise.all([
          locations.findAll({ limit: 1000 }),
          getCachedBeds(),
        ]);

        const builtTree = buildTree(locsRes.data);
        attachBedsToTree(builtTree, bedsRes);
        setTreeData(builtTree);

        // Restore selection or auto-select first node
        setSelectedNode((prev) => {
          if (prev) {
            const freshNode = findInTree(builtTree, prev.id);
            const target =
              freshNode ?? getFirstSelectable(builtTree) ?? builtTree[0];
            if (target) {
              setChildren((target.children as unknown as Location[]) || []);
              return target;
            }
            return null;
          }
          const first = getFirstSelectable(builtTree) ?? builtTree[0];
          if (first) {
            setChildren((first.children as unknown as Location[]) || []);
            return first;
          }
          return null;
        });
      } catch (error) {
        notifications.show({
          title: t("error"),
          message: t("failed_to_fetch_data"),
          color: "red",
        });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t, getFirstSelectable],
  );

  const createLocation = useCallback(
    async (data: CreateLocationDto) => {
      try {
        await locations.create(data);
        await refreshTree();
      } catch (error) {
        notifications.show({
          title: t("error"),
          message: t("failed_to_save_role"),
          color: "red",
        });
      }
    },
    [refreshTree, t],
  );

  const removeNodeFromTree = useCallback(
    (nodes: LocationNode[], id: number): LocationNode[] => {
      return nodes
        .filter((node) => Number(node.id) !== id)
        .map((node) => {
          if (node.children && node.children.length > 0) {
            const updatedChildren = removeNodeFromTree(node.children, id);
            if (updatedChildren.length !== node.children.length) {
              return { ...node, children: updatedChildren };
            }
          }
          return node;
        });
    },
    [],
  );

  const deleteLocation = useCallback(
    async (id: number) => {
      const oldTree = [...treeData];
      setTreeData((prev) => removeNodeFromTree([...prev], id));

      setSelectedNode((prev) => {
        if (prev && Number(prev.id) === id) {
          setChildren([]);
          return null;
        }
        return prev;
      });

      try {
        await locations.delete(id);
        notifications.show({
          title: t("success"),
          message: t("location_delete_success"),
          color: "green",
        });
      } catch (error) {
        setTreeData(oldTree);
        notifications.show({
          title: t("error"),
          message: t("location_delete_error"),
          color: "red",
        });
      }

      await refreshTree(true);
    },
    [treeData, removeNodeFromTree, refreshTree, t],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    refreshTree();
  }, []);

  const value = useMemo(
    () => ({
      treeData,
      selectedNode,
      children: childNodes,
      loading,
      selectNode,
      createLocation,
      deleteLocation,
      refreshTree,
    }),
    [
      treeData,
      selectedNode,
      childNodes,
      loading,
      selectNode,
      createLocation,
      deleteLocation,
      refreshTree,
    ],
  );

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error("useLocations must be used within a LocationsProvider");
  }
  return context;
}
