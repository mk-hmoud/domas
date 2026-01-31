import { useState } from "react";
import {
  Modal,
  Button,
  Group,
  Switch,
  Select,
  Checkbox,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  UpdateLocationDto,
  LocationOwnership,
  GenderType,
} from "@domas/ts-types";

interface BulkEditLocationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateLocationDto) => Promise<void>;
  count: number;
}

export function BulkEditLocationModal({
  opened,
  onClose,
  onSubmit,
  count,
}: BulkEditLocationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // States to track which fields to update
  const [updateOwnership, setUpdateOwnership] = useState(false);
  const [updateTrOnly, setUpdateTrOnly] = useState(false);
  const [updateGuestZone, setUpdateGuestZone] = useState(false);
  const [updateGenderLock, setUpdateGenderLock] = useState(false);

  const form = useForm<UpdateLocationDto>({
    initialValues: {
      ownership: LocationOwnership.DORM,
      isTrOnly: false,
      isGuestZone: false,
      genderLock: undefined,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload: UpdateLocationDto = {};
      if (updateOwnership) payload.ownership = values.ownership;
      if (updateTrOnly) payload.isTrOnly = values.isTrOnly;
      if (updateGuestZone) payload.isGuestZone = values.isGuestZone;
      if (updateGenderLock) payload.genderLock = values.genderLock;

      if (Object.keys(payload).length > 0) {
        await onSubmit(payload);
      }

      form.reset();
      setUpdateOwnership(false);
      setUpdateTrOnly(false);
      setUpdateGuestZone(false);
      setUpdateGenderLock(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const ownershipOptions = Object.values(LocationOwnership).map((o) => ({
    value: o,
    label: t(`ownerships.${o}`),
  }));

  const genderOptions = Object.values(GenderType).map((g) => ({
    value: g,
    label: t(g),
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${t("bulk_edit", { defaultValue: "Bulk Edit" })} (${count})`}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={1} spacing="md">
          <Group align="flex-end">
            <Checkbox
              checked={updateOwnership}
              onChange={(e) => setUpdateOwnership(e.currentTarget.checked)}
              label={t("ownership")}
              style={{ width: 150 }}
            />
            <Select
              data={ownershipOptions}
              disabled={!updateOwnership}
              style={{ flex: 1 }}
              {...form.getInputProps("ownership")}
            />
          </Group>

          <Group align="center">
            <Checkbox
              checked={updateTrOnly}
              onChange={(e) => setUpdateTrOnly(e.currentTarget.checked)}
              label={t("is_tr_only")}
              style={{ width: 150 }}
            />
            <Switch
              disabled={!updateTrOnly}
              {...form.getInputProps("isTrOnly", { type: "checkbox" })}
            />
          </Group>

          <Group align="center">
            <Checkbox
              checked={updateGuestZone}
              onChange={(e) => setUpdateGuestZone(e.currentTarget.checked)}
              label={t("is_guest_zone_label")}
              style={{ width: 150 }}
            />
            <Switch
              disabled={!updateGuestZone}
              {...form.getInputProps("isGuestZone", { type: "checkbox" })}
            />
          </Group>

          <Group align="flex-end">
            <Checkbox
              checked={updateGenderLock}
              onChange={(e) => setUpdateGenderLock(e.currentTarget.checked)}
              label={t("gender_lock_label")}
              style={{ width: 150 }}
            />
            <Select
              placeholder={t("none")}
              data={genderOptions}
              disabled={!updateGenderLock}
              clearable
              style={{ flex: 1 }}
              {...form.getInputProps("genderLock")}
            />
          </Group>
        </SimpleGrid>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={
              !updateOwnership &&
              !updateTrOnly &&
              !updateGuestZone &&
              !updateGenderLock
            }
          >
            {t("save")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
