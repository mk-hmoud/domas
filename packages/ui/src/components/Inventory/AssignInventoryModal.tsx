import {
  Modal,
  Select,
  NumberInput,
  Textarea,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  InventoryCatalogItem,
  CreateInventoryAssignmentDto,
} from "@domas/ts-types";
import { useEffect } from "react";

interface AssignInventoryModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateInventoryAssignmentDto) => Promise<void>;
  catalog: InventoryCatalogItem[];
  locationId?: number;
  bedId?: number;
  loading?: boolean;
}

export function AssignInventoryModal({
  opened,
  onClose,
  onSubmit,
  catalog,
  locationId,
  bedId,
  loading,
}: AssignInventoryModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  const form = useForm<CreateInventoryAssignmentDto>({
    initialValues: {
      catalogId: 0,
      locationId,
      bedId,
      quantity: 1,
      notes: "",
    },
    validate: {
      catalogId: (val) => (val > 0 ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue("locationId", locationId);
      form.setFieldValue("bedId", bedId);
    }
  }, [opened, locationId, bedId]);

  const catalogOptions = catalog
    .filter((item) => item.isActive)
    .map((item) => ({
      value: item.id.toString(),
      label: isTr ? item.nameTr : item.nameEn,
    }));

  const handleSubmit = async (values: CreateInventoryAssignmentDto) => {
    await onSubmit({
      ...values,
      catalogId: Number(values.catalogId),
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("assign_item")}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label={t("item")}
            data={catalogOptions}
            required
            searchable
            {...form.getInputProps("catalogId")}
          />
          <NumberInput
            label={t("quantity")}
            min={1}
            required
            {...form.getInputProps("quantity")}
          />
          <Textarea label={t("notes")} {...form.getInputProps("notes")} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("confirm")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
