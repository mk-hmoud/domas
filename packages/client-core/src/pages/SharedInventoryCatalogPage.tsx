import { useState, useEffect } from "react";
import {
  Title,
  Button,
  Group,
  Paper,
  LoadingOverlay,
  Container,
  Text,
  TextInput,
  Card,
} from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { inventory } from "@domas/api-client";
import {
  InventoryCatalogItem,
  CreateInventoryCatalogDto,
} from "@domas/ts-types";
import {
  InventoryCatalogTable,
  InventoryCatalogModal,
  InventoryCatalogDrawer,
} from "@domas/ui";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export function SharedInventoryCatalogPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<InventoryCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryCatalogItem | null>(
    null,
  );
  const [viewItem, setViewItem] = useState<InventoryCatalogItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await inventory.findAllCatalog();
      setData(result);
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

  const filteredData = data.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.nameEn.toLowerCase().includes(query) ||
      item.nameTr.toLowerCase().includes(query) ||
      item.scope.toLowerCase().includes(query) ||
      t(`inventory_scope.${item.scope}`).toLowerCase().includes(query)
    );
  });

  const handleCreate = async (values: CreateInventoryCatalogDto) => {
    setModalLoading(true);
    try {
      await inventory.createCatalog(values);
      notifications.show({
        title: t("success"),
        message: t("catalog_item_created"),
        color: "green",
      });
      fetchData();
      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_catalog_item"),
        color: "red",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (values: CreateInventoryCatalogDto) => {
    if (!selectedItem) return;
    setModalLoading(true);
    try {
      await inventory.updateCatalog(selectedItem.id, values);
      notifications.show({
        title: t("success"),
        message: t("catalog_item_updated"),
        color: "green",
      });
      fetchData();
      setModalOpened(false);
      setSelectedItem(null);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_catalog_item"),
        color: "red",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = (item: InventoryCatalogItem) => {
    modals.openConfirmModal({
      title: t("delete"),
      children: <Text size="sm">{t("confirm_delete_message")}</Text>,
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await inventory.deleteCatalog(item.id);
          notifications.show({
            title: t("success"),
            message: t("catalog_item_deleted"),
            color: "green",
          });
          fetchData();
          if (viewItem?.id === item.id) setViewItem(null);
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
    <Container size="lg" py="xl" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{t("inventory_catalog")}</Title>
          <Text c="dimmed" size="sm">
            {t("inventory_catalog_description")}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setSelectedItem(null);
            setModalOpened(true);
          }}
        >
          {t("create_catalog_item")}
        </Button>
      </Group>

      <Card withBorder padding="md" radius="md" mb="md">
        <TextInput
          placeholder={t("search_placeholder", "Search...")}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Card>

      <Paper withBorder radius="md">
        <InventoryCatalogTable
          data={filteredData}
          onEdit={(item) => {
            setSelectedItem(item);
            setModalOpened(true);
          }}
          onDelete={handleDelete}
          onRowClick={setViewItem}
        />
      </Paper>

      <InventoryCatalogDrawer
        opened={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
        onEdit={(item) => {
          setSelectedItem(item);
          setModalOpened(true);
        }}
      />

      <InventoryCatalogModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedItem(null);
        }}
        onSubmit={selectedItem ? handleUpdate : handleCreate}
        initialValues={selectedItem}
        loading={modalLoading}
      />
    </Container>
  );
}
