import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDotsVertical,
  IconEdit,
  IconPin,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { announcements as announcementsApi } from "@domas/api-client";
import { Announcement, CreateAnnouncementDto } from "@domas/ts-types";

interface AnnouncementFormValues {
  title: string;
  body: string;
  pinned: boolean;
  expiresAt: string;
}

function AnnouncementModal({
  opened,
  onClose,
  onSubmit,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<void>;
  initial?: Announcement | null;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    initialValues: { title: "", body: "", pinned: false, expiresAt: "" },
    validate: {
      title: (v) => (v.trim() ? null : t("field_required")),
      body: (v) => (v.trim() ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues({
        title: initial?.title ?? "",
        body: initial?.body ?? "",
        pinned: initial?.pinned ?? false,
        expiresAt: initial?.expiresAt
          ? new Date(initial.expiresAt).toISOString().split("T")[0]
          : "",
      });
    }
  }, [opened, initial]);

  const handleSubmit = async (values: AnnouncementFormValues) => {
    setLoading(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        initial
          ? t("edit_announcement", { defaultValue: "Edit Announcement" })
          : t("new_announcement", { defaultValue: "New Announcement" })
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("title")}
            required
            {...form.getInputProps("title")}
          />
          <Textarea
            label={t("message", { defaultValue: "Message" })}
            required
            minRows={5}
            autosize
            {...form.getInputProps("body")}
          />
          <Group grow>
            <Switch
              label={t("pin_announcement", { defaultValue: "Pin to top" })}
              checked={form.values.pinned}
              onChange={(e) =>
                form.setFieldValue("pinned", e.currentTarget.checked)
              }
            />
            <TextInput
              label={t("expires_at", { defaultValue: "Expires on (optional)" })}
              type="date"
              {...form.getInputProps("expiresAt")}
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {initial ? t("save") : t("create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export function SharedAnnouncementsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await announcementsApi.findAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values: AnnouncementFormValues) => {
    const dto: CreateAnnouncementDto = {
      title: values.title,
      body: values.body,
      pinned: values.pinned,
      expiresAt: values.expiresAt || undefined,
    };
    await announcementsApi.create(dto);
    notifications.show({
      color: "green",
      message: t("created_successfully", {
        defaultValue: "Created successfully",
      }),
    });
    load();
  };

  const handleUpdate = async (values: AnnouncementFormValues) => {
    if (!editing) return;
    await announcementsApi.update(editing.id, {
      title: values.title,
      body: values.body,
      pinned: values.pinned,
      expiresAt: values.expiresAt || null,
    });
    notifications.show({
      color: "green",
      message: t("saved_successfully", { defaultValue: "Saved successfully" }),
    });
    load();
  };

  const handleTogglePublish = async (item: Announcement) => {
    if (item.isPublished) {
      await announcementsApi.unpublish(item.id);
    } else {
      await announcementsApi.publish(item.id);
    }
    load();
  };

  const handleDelete = (item: Announcement) => {
    modals.openConfirmModal({
      title: t("delete_announcement", { defaultValue: "Delete Announcement" }),
      children: (
        <Text size="sm">
          {t("delete_confirm", {
            defaultValue: "Are you sure? This cannot be undone.",
          })}
        </Text>
      ),
      labels: { confirm: t("delete"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await announcementsApi.delete(item.id);
        notifications.show({
          color: "green",
          message: t("deleted_successfully", {
            defaultValue: "Deleted successfully",
          }),
        });
        load();
      },
    });
  };

  return (
    <Container size="lg" py="xl" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />

      <Group justify="space-between" mb="lg">
        <Title>{t("announcements", { defaultValue: "Announcements" })}</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditing(null);
            setModalOpened(true);
          }}
        >
          {t("new_announcement", { defaultValue: "New Announcement" })}
        </Button>
      </Group>

      <Stack gap="sm">
        {data.length === 0 && !loading && (
          <Text c="dimmed" ta="center" py="xl">
            {t("no_announcements_yet", {
              defaultValue: "No announcements yet.",
            })}
          </Text>
        )}
        {data.map((item) => (
          <Card key={item.id} withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Group gap="xs" mb={4}>
                  {item.pinned && <IconPin size={14} color="orange" />}
                  <Text fw={600}>{item.title}</Text>
                  <Badge
                    color={item.isPublished ? "green" : "gray"}
                    variant="light"
                    size="sm"
                  >
                    {item.isPublished
                      ? t("published", { defaultValue: "Published" })
                      : t("draft", { defaultValue: "Draft" })}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {item.body}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {item.createdByName && `${item.createdByName} · `}
                  {new Date(item.createdAt).toLocaleDateString()}
                  {item.expiresAt &&
                    ` · ${t("expires", { defaultValue: "Expires" })} ${new Date(item.expiresAt).toLocaleDateString()}`}
                </Text>
              </Box>

              <Menu shadow="md" width={180} withinPortal>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <IconDotsVertical size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => {
                      setEditing(item);
                      setModalOpened(true);
                    }}
                  >
                    {t("edit")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconPin size={14} />}
                    onClick={() => handleTogglePublish(item)}
                  >
                    {item.isPublished
                      ? t("unpublish", { defaultValue: "Unpublish" })
                      : t("publish", { defaultValue: "Publish" })}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => handleDelete(item)}
                  >
                    {t("delete")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Card>
        ))}
      </Stack>

      <AnnouncementModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
    </Container>
  );
}
