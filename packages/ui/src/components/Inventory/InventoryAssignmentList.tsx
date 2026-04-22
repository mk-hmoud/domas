import {
  Table,
  Group,
  ActionIcon,
  Text,
  Button,
  Stack,
  Collapse,
  Badge,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconChevronRight,
  IconFiles,
} from "@tabler/icons-react";
import { InventoryAssignment } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface InventoryAssignmentListProps {
  data: InventoryAssignment[];
  onUpdateQuantity: (id: string, newQuantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAddClick: () => void;
  onApplyTemplate?: () => void;
  loading?: boolean;
}

export function InventoryAssignmentList({
  data,
  onUpdateQuantity,
  onRemove,
  onAddClick,
  onApplyTemplate,
  loading,
}: InventoryAssignmentListProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Stack gap={0}>
      <UnstyledButton
        onClick={toggle}
        style={{
          padding: "8px 4px",
          borderRadius: 6,
          transition: "background-color 0.1s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--mantine-color-default-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <IconChevronRight
              size={14}
              style={{
                transform: opened ? "rotate(90deg)" : "none",
                transition: "transform 0.15s ease",
                color: "var(--mantine-color-dimmed)",
                flexShrink: 0,
              }}
            />
            <Text fw={600} size="sm">
              {t("inventory")}
            </Text>
            {data.length > 0 && (
              <Badge size="xs" variant="light" color="gray" circle>
                {data.length}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {onApplyTemplate && (
              <Button
                size="xs"
                variant="subtle"
                color="blue"
                leftSection={<IconFiles size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyTemplate();
                }}
              >
                {t("apply_blueprint")}
              </Button>
            )}
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={12} />}
              onClick={(e) => {
                e.stopPropagation();
                onAddClick();
              }}
            >
              {t("assign_item")}
            </Button>
          </Group>
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        <Table verticalSpacing="xs" mt="xs">
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
      </Collapse>
    </Stack>
  );
}
