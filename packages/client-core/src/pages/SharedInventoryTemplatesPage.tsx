import { useState, useEffect } from "react";
import {
  Title,
  Button,
  Group,
  Paper,
  LoadingOverlay,
  Container,
  Text,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { inventory } from "@domas/api-client";
import {
  InventoryTemplate,
  CreateInventoryTemplateDto,
  InventoryCatalogItem,
} from "@domas/ts-types";
import { InventoryTemplateTable, InventoryTemplateModal } from "@domas/ui";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export function SharedInventoryTemplatesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<InventoryTemplate[]>([]);
  const [catalog, setCatalog] = useState<InventoryCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<InventoryTemplate | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, catalogRes] = await Promise.all([
        inventory.findAllTemplates(),
        inventory.findAllCatalog({ isActive: true }),
      ]);
      setData(templatesRes);
      setCatalog(catalogRes);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (values: CreateInventoryTemplateDto) => {
    setModalLoading(true);
    try {
      await inventory.createTemplate(values);
      notifications.show({
        title: t("success"),
        message: t("template_created", {
          defaultValue: "Blueprint created successfully",
        }),
        color: "green",
      });
      fetchData();
      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save"),
        color: "red",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (values: CreateInventoryTemplateDto) => {
    if (!selectedTemplate) return;
    setModalLoading(true);
    try {
      await inventory.updateTemplate(selectedTemplate.id, values);
      notifications.show({
        title: t("success"),
        message: t("template_updated", {
          defaultValue: "Blueprint updated successfully",
        }),
        color: "green",
      });
      fetchData();
      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save"),
        color: "red",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    modals.openConfirmModal({
      title: t("delete_template", { defaultValue: "Delete Blueprint" }),
      children: (
        <Text size="sm">
          {t("delete_template_confirm", {
            defaultValue:
              "Are you sure you want to delete this blueprint? This action cannot be undone.",
          })}
        </Text>
      ),
      labels: { confirm: t("delete"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await inventory.deleteTemplate(id);
          notifications.show({
            title: t("success"),
            message: t("template_deleted", {
              defaultValue: "Blueprint deleted successfully",
            }),
            color: "green",
          });
          fetchData();
        } catch (error) {
          notifications.show({
            title: t("error"),
            message: t("failed_to_delete"),
            color: "red",
          });
        }
      },
    });
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title>
          {t("inventory_blueprints", { defaultValue: "Inventory Blueprints" })}
        </Title>
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => {
            setSelectedTemplate(null);
            setModalOpened(true);
          }}
        >
          {t("create_template")}
        </Button>
      </Group>

      <Paper withBorder radius="md" style={{ position: "relative" }}>
        <LoadingOverlay visible={loading} />
        <InventoryTemplateTable
          data={data}
          onEdit={(template) => {
            setSelectedTemplate(template);
            setModalOpened(true);
          }}
          onDelete={handleDelete}
        />
      </Paper>

      <InventoryTemplateModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedTemplate(null);
        }}
        onSubmit={selectedTemplate ? handleUpdate : handleCreate}
        initialValues={selectedTemplate}
        catalog={catalog}
        loading={modalLoading}
      />
    </Container>
  );
}
