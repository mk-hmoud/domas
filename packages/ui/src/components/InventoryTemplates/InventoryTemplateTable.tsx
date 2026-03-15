import {
  Table,
  Group,
  ActionIcon,
  Badge,
  Text,
  Tooltip,
  Collapse,
  Box,
  Stack,
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconFiles,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import { InventoryTemplate } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { useState, Fragment } from "react";

interface InventoryTemplateTableProps {
  data: InventoryTemplate[];
  onEdit: (template: InventoryTemplate) => void;
  onDelete: (id: number) => void;
  onApply?: (template: InventoryTemplate) => void;
}

export function InventoryTemplateTable({
  data,
  onEdit,
  onDelete,
  onApply,
}: InventoryTemplateTableProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const [openedRows, setOpenedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setOpenedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const rows = data.map((template) => {
    const isOpened = openedRows[template.id];

    return (
      <Fragment key={template.id}>
        <Table.Tr
          onClick={() => toggleRow(template.id)}
          style={{ cursor: "pointer" }}
        >
          <Table.Td style={{ width: 40 }}>
            <ActionIcon variant="subtle" color="gray" size="sm">
              {isOpened ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </ActionIcon>
          </Table.Td>
          <Table.Td>
            <Text size="sm" fw={500}>
              {template.name}
            </Text>
            {template.description && (
              <Text size="xs" c="dimmed">
                {template.description}
              </Text>
            )}
          </Table.Td>
          <Table.Td>
            <Badge variant="light">
              {t(`inventory_scope.${template.scope}`, {
                defaultValue: template.scope,
              })}
            </Badge>
          </Table.Td>
          <Table.Td>
            <Text size="sm">
              {template.items?.length || 0} {t("items")}
            </Text>
          </Table.Td>
          <Table.Td onClick={(e) => e.stopPropagation()}>
            <Group gap={4} justify="flex-end">
              {onApply && (
                <Tooltip
                  label={t("apply_to_locations", {
                    defaultValue: "Apply to Locations",
                  })}
                >
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => onApply(template)}
                  >
                    <IconFiles size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label={t("edit")}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => onEdit(template)}
                >
                  <IconPencil size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("delete")}>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => onDelete(template.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td colSpan={5} p={0}>
            <Collapse in={isOpened}>
              <Box
                p="md"
                bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
              >
                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    {t("blueprint_contents", {
                      defaultValue: "Blueprint Contents",
                    })}
                  </Text>
                  <Table
                    withColumnBorders
                    withTableBorder
                    bg="light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))"
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t("item")}</Table.Th>
                        <Table.Th style={{ width: 100 }}>
                          {t("quantity")}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {template.items?.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            {isTr
                              ? item.itemNameTr || "İsimsiz"
                              : item.itemNameEn || "Unnamed"}
                          </Table.Td>
                          <Table.Td>{item.quantity}</Table.Td>
                        </Table.Tr>
                      ))}
                      {(!template.items || template.items.length === 0) && (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text size="xs" c="dimmed" ta="center">
                              {t("no_items")}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Box>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      </Fragment>
    );
  });

  return (
    <Table striped highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th />
          <Table.Th>{t("name")}</Table.Th>
          <Table.Th>{t("scope")}</Table.Th>
          <Table.Th>{t("items")}</Table.Th>
          <Table.Th style={{ width: 120 }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text ta="center" c="dimmed" py="xl">
                {t("no_templates_found", {
                  defaultValue: "No templates found",
                })}
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
