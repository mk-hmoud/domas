import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { Location, CreateLocationDto } from "@domas/ts-types";
import { locations } from "@domas/api-client";
import { LocationNode } from "@domas/ui";

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

// Helper to find a node deep in the tree to restore selection
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

export function LocationsProvider({ children }: { children: ReactNode }) {
  const [treeData, setTreeData] = useState<LocationNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<LocationNode | null>(null);
  const [childNodes, setChildren] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTree = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await locations.findAll({ limit: 1000 });
      const builtTree = buildTree(result.data);
      setTreeData(builtTree);

      // Restore selection if possible
      if (selectedNode) {
        const freshNode = findInTree(builtTree, selectedNode.id);
        if (freshNode) {
          selectNode(freshNode);
        } else if (builtTree.length > 0) {
          selectNode(builtTree[0]);
        }
      } else if (builtTree.length > 0) {
        selectNode(builtTree[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const selectNode = (node: LocationNode) => {
    setSelectedNode(node);
    // Use local children from the tree instead of fetching
    // The tree is built from a flat list where we attach children arrays
    // However, the original 'Location' type might not have them populated
    // but our 'LocationNode' (from buildTree) definitely does.
    setChildren((node.children as unknown as Location[]) || []);
  };

  const createLocation = async (data: CreateLocationDto) => {
    await locations.create(data);
    await refreshTree();
  };

  // Helper to remove a node immutably from the tree
  const removeNodeFromTree = (
    nodes: LocationNode[],
    id: number,
  ): LocationNode[] => {
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
  };

  const deleteLocation = async (id: number) => {
    // 1. Optimistic Update: Remove it from UI immediately
    setTreeData((prev) => removeNodeFromTree([...prev], id));

    if (selectedNode && Number(selectedNode.id) === id) {
      setSelectedNode(null);
      setChildren([]);
    }

    // 2. Call API in background
    await locations.delete(id);

    // 3. Silent Refresh
    await refreshTree(true);
  };

  // Initial load
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
    [treeData, selectedNode, childNodes, loading],
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
