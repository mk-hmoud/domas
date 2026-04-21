import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Button,
} from "@mantine/core";
import { IconEdit, IconArchive } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { InventoryCatalogItem } from "@domas/ts-types";
import { LabelValue } from "../LabelValue";

interface InventoryCatalogDrawerProps {
  opened: boolean;
  onClose: () => void;
  item: InventoryCatalogItem | null;
  onEdit?: (item: InventoryCatalogItem) => void;
}

export function InventoryCatalogDrawer({
  opened,
  onClose,
  item,
  onEdit,
}: InventoryCatalogDrawerProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconArchive size={18} />
          <Text fw={700} size="sm">
            {t("item_details", { defaultValue: "Item Details" })}
          </Text>
        </Group>
      }
      position="right"
      size="md"
    >
      {item && (
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text fw={700} size="md">
                {isTr ? item.nameTr : item.nameEn}
              </Text>
              <Text size="xs" c="dimmed">
                {isTr ? item.nameEn : item.nameTr}
              </Text>
            </Stack>
            <Badge color={item.isActive ? "green" : "gray"} variant="light">
              {item.isActive ? t("active") : t("inactive")}
            </Badge>
          </Group>

          <Divider />

          <Stack gap="md">
            <LabelValue label={t("scope")}>
              <Group gap="xs">
                <Badge variant="light" color="blue">
                  {t(`inventory_scope.${item.scope}`)}
                </Badge>
                {item.isOptional && (
                  <Badge variant="dot" color="cyan">
                    {t("is_optional")}
                  </Badge>
                )}
              </Group>
            </LabelValue>

            <Group grow>
              <LabelValue label={t("price_try")}>
                <Text fw={700} size="lg" c="blue">
                  {item.basePriceTry} TRY
                </Text>
              </LabelValue>
              <LabelValue label={t("price_foreign")}>
                <Text fw={700} size="lg" c="green">
                  {item.basePriceForeign} {item.foreignCurrencyCode}
                </Text>
              </LabelValue>
            </Group>

            <LabelValue label={t("description")}>
              {(isTr ? item.descriptionTr : item.descriptionEn) || (
                <Text size="sm" c="dimmed" fs="italic">
                  —
                </Text>
              )}
            </LabelValue>
          </Stack>

          <Divider />

          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              {t("item_id", { defaultValue: "Item ID" })}: {item.id}
            </Text>
            <Text size="xs" c="dimmed">
              {t("created_at")}: {new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed">
              {t("updated_at")}: {new Date(item.updatedAt).toLocaleString()}
            </Text>
          </Stack>

          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={() => {
              onEdit?.(item);
              onClose();
            }}
            mt="md"
          >
            {t("edit_catalog_item")}
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}
