import { useState, useCallback } from "react";

export function useLocationSelection(allItemIds: (string | number)[]) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.length === allItemIds.length && prev.length > 0) {
        return [];
      } else {
        return [...allItemIds];
      }
    });
  }, [allItemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    setSelectedIds,
  };
}
