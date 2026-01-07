import { useState, useEffect } from "react";
import {
  TextInput,
  NumberInput,
  Button,
  Modal,
  Select,
  Checkbox,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { CreateLocationDto, LocationType, GenderType } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface CreateLocationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateLocationDto) => Promise<void>;
  parentId?: number | null;
  parentType?: LocationType;
}

export function CreateLocationModal({
  opened,
  onClose,
  onSubmit,
  parentId,
  parentType,
}: CreateLocationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateLocationDto>({
    initialValues: {
      name: "",
      type: LocationType.CAMPUS, // Default, will be overridden by logic
      parentId: parentId || undefined,
      capacity: 0,
      genderLock: undefined, // Explicitly undefined to avoid sending null if not selected
      isGuestZone: false,
    },
    validate: {
      name: (val) => (val.length < 2 ? t("validation_name_short") : null),
      type: (val) => (!val ? t("validation_type_required") : null),
    },
  });

  // Suggest next type based on parent
  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue("parentId", parentId || undefined);
      if (!parentId) {
        form.setFieldValue("type", LocationType.UNIVERSITY);
      } else if (parentType === LocationType.UNIVERSITY) {
        form.setFieldValue("type", LocationType.CAMPUS);
      } else if (parentType === LocationType.CAMPUS) {
        form.setFieldValue("type", LocationType.BUILDING);
      } else if (parentType === LocationType.BUILDING) {
        form.setFieldValue("type", LocationType.BLOCK);
      } else if (parentType === LocationType.BLOCK) {
        form.setFieldValue("type", LocationType.FLOOR);
      } else if (parentType === LocationType.FLOOR) {
        form.setFieldValue("type", LocationType.ROOM);
      }
    }
  }, [opened, parentId, parentType]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.reset();
      onClose();
    } catch (error) {
      // Parent handles error
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = Object.values(LocationType).map((t) => ({
    value: t,
    label: t.toUpperCase(),
  }));
  const genderOptions = Object.values(GenderType).map((t) => ({
    value: t,
    label: t,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={parentId ? t("add_child_location") : t("create_root_location")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t("name_label")}
          placeholder={t("name_placeholder")}
          required
          mb="md"
          {...form.getInputProps("name")}
        />

        <Select
          label={t("type_label")}
          data={typeOptions}
          required
          mb="md"
          {...form.getInputProps("type")}
        />

        <NumberInput
          label={t("capacity_label")}
          description={t("capacity_description")}
          mb="md"
          min={0}
          {...form.getInputProps("capacity")}
        />

        <Select
          label={t("gender_lock_label")}
          placeholder={t("none")}
          data={genderOptions}
          clearable
          mb="md"
          {...form.getInputProps("genderLock")}
        />

        <Checkbox
          label={t("is_guest_zone_label")}
          mb="xl"
          {...form.getInputProps("isGuestZone", { type: "checkbox" })}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={loading}>
            {t("create")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
