import { Table, Group, ActionIcon, Text, Button, Stack } from "@mantine/core";
import { IconTrash, IconPlus, IconMinus } from "@tabler/icons-react";
import { InventoryAssignment } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface InventoryAssignmentListProps {
  data: InventoryAssignment[];
  onUpdateQuantity: (id: string, newQuantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAddClick: () => void;
  loading?: boolean;
}

export function InventoryAssignmentList({
  data,
  onUpdateQuantity,
  onRemove,
  onAddClick,
  loading,
}: InventoryAssignmentListProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>{t("inventory")}</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={onAddClick}
        >
          {t("assign_item")}
        </Button>
      </Group>

      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("item")}</Table.Th>
            <Table.Th style={{ width: 120 }}>{t("quantity")}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((assignment) => (
            <Table.Tr key={assignment.id}>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {isTr ? assignment.item?.nameTr : assignment.item?.nameEn}
                </Text>
                {assignment.notes && (
                  <Text size="xs" c="dimmed">
                    {assignment.notes}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    disabled={assignment.quantity <= 1 || loading}
                    onClick={() =>
                      onUpdateQuantity(assignment.id, assignment.quantity - 1)
                    }
                  >
                    <IconMinus size={12} />
                  </ActionIcon>
                  <Text size="sm" w={20} ta="center">
                    {assignment.quantity}
                  </Text>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    disabled={loading}
                    onClick={() =>
                      onUpdateQuantity(assignment.id, assignment.quantity + 1)
                    }
                  >
                    <IconPlus size={12} />
                  </ActionIcon>
                </Group>
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  disabled={loading}
                  onClick={() => onRemove(assignment.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
          {data.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text ta="center" c="dimmed" py="md" size="sm">
                  {t("no_inventory_items")}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
