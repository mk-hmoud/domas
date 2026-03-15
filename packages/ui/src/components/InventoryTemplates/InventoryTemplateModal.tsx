import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  ActionIcon,
  Table,
  NumberInput,
  Text,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  CreateInventoryTemplateDto,
  InventoryTemplate,
  InventoryScope,
  InventoryCatalogItem,
} from "@domas/ts-types";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect } from "react";

interface InventoryTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateInventoryTemplateDto) => Promise<void>;
  initialValues?: InventoryTemplate | null;
  catalog: InventoryCatalogItem[];
  loading?: boolean;
}

export function InventoryTemplateModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  catalog,
  loading = false,
}: InventoryTemplateModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  const form = useForm<CreateInventoryTemplateDto>({
    initialValues: {
      name: "",
      description: "",
      scope: InventoryScope.ROOM,
      items: [],
    },
    validate: {
      name: (val) => (val ? null : t("field_required")),
      scope: (val) => (val ? null : t("field_required")),
      items: {
        catalogId: (val) => (val ? null : t("field_required")),
        quantity: (val) => (val > 0 ? null : t("invalid_number")),
      },
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          name: initialValues.name,
          description: initialValues.description || "",
          scope: initialValues.scope,
          items:
            initialValues.items?.map((item) => ({
              catalogId: item.catalogId,
              quantity: item.quantity,
            })) || [],
        });
      } else {
        form.reset();
      }
    }
  }, [opened, initialValues]);

  const filteredCatalog = catalog.filter(
    (item) =>
      item.scope === form.values.scope || item.scope === InventoryScope.SHARED,
  );

  const addItem = () => {
    form.insertListItem("items", { catalogId: 0, quantity: 1 });
  };

  const removeItem = (index: number) => {
    form.removeListItem("items", index);
  };

  const handleSubmit = async (values: CreateInventoryTemplateDto) => {
    // Filter out invalid items (id 0)
    const validItems = values.items.filter((i) => i.catalogId > 0);
    await onSubmit({ ...values, items: validItems });
    onClose();
  };

  const itemRows = form.values.items.map((item, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <Select
          data={filteredCatalog.map((c) => ({
            value: c.id.toString(),
            label: isTr ? c.nameTr : c.nameEn,
          }))}
          searchable
          placeholder={t("select_item")}
          {...form.getInputProps(`items.${index}.catalogId`)}
          onChange={(val) =>
            form.setFieldValue(`items.${index}.catalogId`, Number(val))
          }
          value={item.catalogId === 0 ? null : item.catalogId.toString()}
        />
      </Table.Td>
      <Table.Td style={{ width: 100 }}>
        <NumberInput
          min={1}
          {...form.getInputProps(`items.${index}.quantity`)}
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          color="red"
          variant="subtle"
          onClick={() => removeItem(index)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t("edit_template") : t("create_template")}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("name")}
            required
            {...form.getInputProps("name")}
          />
          <Textarea
            label={t("description")}
            {...form.getInputProps("description")}
          />
          <Select
            label={t("scope")}
            data={[
              { value: InventoryScope.ROOM, label: t("inventory_scope.room") },
              { value: InventoryScope.BED, label: t("inventory_scope.bed") },
              {
                value: InventoryScope.SHARED,
                label: t("inventory_scope.shared"),
              },
            ]}
            required
            disabled={!!initialValues} // Scope shouldn't change after creation
            {...form.getInputProps("scope")}
          />

          <Divider
            label={t("template_items", { defaultValue: "Blueprint Items" })}
            labelPosition="center"
          />

          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("item")}</Table.Th>
                <Table.Th>{t("quantity")}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {itemRows}
              {form.values.items.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text ta="center" c="dimmed" size="sm" py="sm">
                      {t("no_items_in_template", {
                        defaultValue: "No items added yet",
                      })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={addItem}
          >
            {t("add_item")}
          </Button>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {initialValues ? t("save") : t("create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
