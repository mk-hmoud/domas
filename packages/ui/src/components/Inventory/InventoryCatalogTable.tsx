import { Table, Group, ActionIcon, Badge, Text } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { InventoryCatalogItem } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface InventoryCatalogTableProps {
  data: InventoryCatalogItem[];
  onEdit: (item: InventoryCatalogItem) => void;
  onDelete: (item: InventoryCatalogItem) => void;
  onRowClick?: (item: InventoryCatalogItem) => void;
}

export function InventoryCatalogTable({
  data,
  onEdit,
  onDelete,
  onRowClick,
}: InventoryCatalogTableProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  const rows = data.map((item) => (
    <Table.Tr
      key={item.id}
      onClick={() => onRowClick?.(item)}
      style={{ cursor: onRowClick ? "pointer" : "default" }}
    >
      <Table.Td fw={500}>{isTr ? item.nameTr : item.nameEn}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue">
          {t(`inventory_scope.${item.scope}`)}
        </Badge>
      </Table.Td>
      <Table.Td>
        {item.basePriceTry} TRY / {item.basePriceForeign}{" "}
        {item.foreignCurrencyCode}
      </Table.Td>
      <Table.Td>
        <Badge color={item.isActive ? "green" : "gray"}>
          {item.isActive ? t("active") : t("inactive")}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("name")}</Table.Th>
          <Table.Th>{t("scope")}</Table.Th>
          <Table.Th>{t("price")}</Table.Th>
          <Table.Th>{t("status")}</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text ta="center" c="dimmed" py="xl">
                {t("no_inventory_items")}
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
