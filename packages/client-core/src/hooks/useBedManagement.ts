import { useState, useEffect } from "react";
import { Bed, CreateBedDto } from "@domas/ts-types";
import { beds } from "@domas/api-client";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";

export function useBedManagement(
  selectedNodeId: number | null,
  isRoom: boolean,
) {
  const { t } = useTranslation();
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
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    }
  };

  const createBed = async (values: CreateBedDto) => {
    if (!selectedNodeId) return;
    try {
      await beds.create({ ...values, locationId: selectedNodeId });
      notifications.show({
        title: t("success"),
        message: t("bed_created", "Bed created successfully"),
        color: "green",
      });
      await refreshBeds();
      setCreateBedModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const deleteBed = async (bed: Bed) => {
    if (!confirm(t("confirm"))) return;
    try {
      await beds.remove(bed.id);
      notifications.show({
        title: t("success"),
        message: t("bed_deleted", "Bed deleted successfully"),
        color: "green",
      });
      await refreshBeds();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_delete_role"),
        color: "red",
      });
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
