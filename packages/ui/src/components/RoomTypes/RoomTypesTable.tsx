import {
  Table,
  ActionIcon,
  Group,
  Badge,
  Text,
  Tooltip,
  Stack,
} from "@mantine/core";
import { IconEdit, IconTrash, IconPhoto } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { RoomType } from "@domas/ts-types";

export interface RoomTypesTableProps {
  data: RoomType[];
  onEdit: (rt: RoomType) => void;
  onDelete: (rt: RoomType) => void;
}

export function RoomTypesTable({
  data,
  onEdit,
  onDelete,
}: RoomTypesTableProps) {
  const { t } = useTranslation();

  const confirmDelete = (rt: RoomType) => {
    modals.openConfirmModal({
      title: t("delete_room_type", { defaultValue: "Delete Room Type" }),
      children: (
        <Text size="sm">
          {t("delete_room_type_confirm", {
            defaultValue:
              "Delete «{{name}}»? Rooms assigned to this type will be unlinked.",
            name: rt.name,
          })}
        </Text>
      ),
      labels: { confirm: t("delete"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => onDelete(rt),
    });
  };

  return (
    <Table highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("name")}</Table.Th>
          <Table.Th>{t("capacity", { defaultValue: "Capacity" })}</Table.Th>
          <Table.Th>{t("amenities", { defaultValue: "Amenities" })}</Table.Th>
          <Table.Th>
            {t("gallery_photos", { defaultValue: "Gallery Photos" })}
          </Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text c="dimmed" ta="center" size="sm" py="md">
                {t("no_room_types", {
                  defaultValue: "No room types yet. Create one to get started.",
                })}
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          data.map((rt) => (
            <Table.Tr key={rt.id}>
              <Table.Td>
                <Stack gap={2}>
                  <Text fw={500}>{rt.name}</Text>
                  {rt.description && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {rt.description}
                    </Text>
                  )}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{rt.capacity}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="wrap">
                  {rt.amenities.length === 0 ? (
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  ) : (
                    rt.amenities.slice(0, 4).map((a) => (
                      <Badge key={a} size="xs" variant="light">
                        {a}
                      </Badge>
                    ))
                  )}
                  {rt.amenities.length > 4 && (
                    <Text size="xs" c="dimmed">
                      +{rt.amenities.length - 4}
                    </Text>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <IconPhoto size={14} />
                  <Text size="sm">{rt.galleryUrls.length}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group justify="flex-end" gap="xs">
                  <Tooltip label={t("edit")}>
                    <ActionIcon variant="subtle" onClick={() => onEdit(rt)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("delete")}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => confirmDelete(rt)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}
