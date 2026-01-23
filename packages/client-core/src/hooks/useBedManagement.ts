import { useState, useEffect } from "react";
import { Bed, CreateBedDto } from "@domas/ts-types";
import { beds } from "@domas/api-client";

export function useBedManagement(
  selectedNodeId: number | null,
  isRoom: boolean,
) {
  const [roomBeds, setRoomBeds] = useState<Bed[]>([]);
  const [createBedModalOpened, setCreateBedModalOpened] = useState(false);

  useEffect(() => {
    if (isRoom && selectedNodeId) {
      refreshBeds();
    } else {
      setRoomBeds([]);
    }
  }, [selectedNodeId, isRoom]);

  const refreshBeds = async () => {
    if (!selectedNodeId) return;
    try {
      const res = await beds.findAll({
        locationId: selectedNodeId,
        limit: 100,
      });
      setRoomBeds(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const createBed = async (values: CreateBedDto) => {
    if (!selectedNodeId) return;
    try {
      await beds.create({ ...values, locationId: selectedNodeId });
      await refreshBeds();
      setCreateBedModalOpened(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBed = async (bed: Bed) => {
    if (!confirm("Are you sure?")) return;
    try {
      await beds.remove(bed.id);
      await refreshBeds();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    roomBeds,
    createBedModalOpened,
    setCreateBedModalOpened,
    createBed,
    deleteBed,
    refreshBeds,
  };
}
