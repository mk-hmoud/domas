import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Title,
  Divider,
  Box,
  Button,
} from "@mantine/core";
import { IconEdit, IconArchive, IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { InventoryCatalogItem } from "@domas/ts-types";

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
          <IconArchive size={20} />
          <Text fw={700}>
            {t("item_details", { defaultValue: "Item Details" })}
          </Text>
        </Group>
      }
      position="right"
      size="md"
    >
      {item && (
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Title order={3}>{isTr ? item.nameTr : item.nameEn}</Title>
              <Text size="sm" c="dimmed">
                {isTr ? item.nameEn : item.nameTr}
              </Text>
            </Stack>
            <Badge color={item.isActive ? "green" : "gray"} variant="filled">
              {item.isActive ? t("active") : t("inactive")}
            </Badge>
          </Group>

          <Divider />

          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              {t("scope")}
            </Text>
            <Group gap="xs">
              <Badge variant="light" color="blue" size="lg">
                {t(`inventory_scope.${item.scope}`)}
              </Badge>
              {item.isExtra && (
                <Badge variant="dot" color="orange" size="lg">
                  {t("is_extra")}
                </Badge>
              )}
              {item.isOptional && (
                <Badge variant="dot" color="cyan" size="lg">
                  {t("is_optional")}
                </Badge>
              )}
            </Group>
          </Box>

          <Group grow>
            <Box>
              <Text size="xs" c="dimmed">
                {t("price_try")}
              </Text>
              <Text fw={700} size="xl" c="blue">
                {item.basePriceTry} TRY
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">
                {t("price_foreign")}
              </Text>
              <Text fw={700} size="xl" c="green">
                {item.basePriceForeign} {item.foreignCurrencyCode}
              </Text>
            </Box>
          </Group>

          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              {t("description")}
            </Text>
            <Text size="sm">
              {(isTr ? item.descriptionTr : item.descriptionEn) || "-"}
            </Text>
          </Box>

          <Divider />

          <Stack gap="xs">
            <Group gap={4}>
              <IconInfoCircle size={14} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">
                {t("item_id", { defaultValue: "Item ID" })}: {item.id}
              </Text>
            </Group>
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
            mt="xl"
          >
            {t("edit_catalog_item")}
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}
