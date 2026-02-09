import {
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Button,
  Stack,
  Group,
  SimpleGrid,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  InventoryCatalogItem,
  CreateInventoryCatalogDto,
  InventoryScope,
} from "@domas/ts-types";
import { useEffect } from "react";

interface InventoryCatalogModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateInventoryCatalogDto) => Promise<void>;
  initialValues?: InventoryCatalogItem | null;
  loading?: boolean;
}

export function InventoryCatalogModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  loading,
}: InventoryCatalogModalProps) {
  const { t } = useTranslation();

  const form = useForm<CreateInventoryCatalogDto>({
    initialValues: {
      nameTr: "",
      nameEn: "",
      descriptionTr: "",
      descriptionEn: "",
      scope: InventoryScope.SHARED,
      basePriceTry: 0,
      basePriceForeign: 0,
      foreignCurrencyCode: "USD",
      isActive: true,
      isExtra: false,
      isOptional: false,
    },
    validate: {
      nameTr: (val) => (val ? null : t("field_required")),
      nameEn: (val) => (val ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          nameTr: initialValues.nameTr,
          nameEn: initialValues.nameEn,
          descriptionTr: initialValues.descriptionTr || "",
          descriptionEn: initialValues.descriptionEn || "",
          scope: initialValues.scope,
          basePriceTry: initialValues.basePriceTry,
          basePriceForeign: initialValues.basePriceForeign,
          foreignCurrencyCode: initialValues.foreignCurrencyCode,
          isActive: initialValues.isActive,
          isExtra: initialValues.isExtra,
          isOptional: initialValues.isOptional,
        });
      } else {
        form.reset();
      }
    }
  }, [opened, initialValues]);

  const handleSubmit = async (values: CreateInventoryCatalogDto) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t("edit_catalog_item") : t("create_catalog_item")}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SimpleGrid cols={2}>
            <TextInput
              label={t("name_tr")}
              required
              {...form.getInputProps("nameTr")}
            />
            <TextInput
              label={t("name_en")}
              required
              {...form.getInputProps("nameEn")}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <Textarea
              label={t("description_tr")}
              {...form.getInputProps("descriptionTr")}
            />
            <Textarea
              label={t("description_en")}
              {...form.getInputProps("descriptionEn")}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <Select
              label={t("scope")}
              data={[
                {
                  value: InventoryScope.ROOM,
                  label: t("inventory_scope.room"),
                },
                { value: InventoryScope.BED, label: t("inventory_scope.bed") },
                {
                  value: InventoryScope.SHARED,
                  label: t("inventory_scope.shared"),
                },
              ]}
              {...form.getInputProps("scope")}
            />
            <Select
              label={t("currency")}
              data={["USD", "EUR", "GBP"]}
              {...form.getInputProps("foreignCurrencyCode")}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <NumberInput
              label={t("price_try")}
              min={0}
              {...form.getInputProps("basePriceTry")}
            />
            <NumberInput
              label={t("price_foreign")}
              min={0}
              {...form.getInputProps("basePriceForeign")}
            />
          </SimpleGrid>

          <Group>
            <Switch
              label={t("active")}
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />

            <Switch
              label={t("is_extra")}
              {...form.getInputProps("isExtra", { type: "checkbox" })}
            />

            <Switch
              label={t("is_optional")}
              {...form.getInputProps("isOptional", { type: "checkbox" })}
            />
          </Group>

          <Group justify="flex-end" mt="xl">
            {" "}
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
