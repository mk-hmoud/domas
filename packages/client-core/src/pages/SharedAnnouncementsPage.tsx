import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { PageHeader, PageShell } from "@domas/ui";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDotsVertical,
  IconEdit,
  IconFile,
  IconPaperclip,
  IconPin,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { announcements as announcementsApi } from "@domas/api-client";
import {
  Announcement,
  AnnouncementAttachmentMeta,
  CreateAnnouncementDto,
} from "@domas/ts-types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  onSubmit: (values: AnnouncementFormValues) => Promise<string>;
  initial?: Announcement | null;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>(
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingAttachments: AnnouncementAttachmentMeta[] = (
    initial?.attachments ?? []
  ).filter((a) => !deletedAttachmentIds.includes(a.id));

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
      setPendingFiles([]);
      setDeletedAttachmentIds([]);
    }
  }, [opened, initial]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const markDeleted = (attachmentId: string) => {
    setDeletedAttachmentIds((prev) => [...prev, attachmentId]);
  };

  const handleSubmit = async (values: AnnouncementFormValues) => {
    setLoading(true);
    try {
      const id = await onSubmit(values);
      // Delete removed attachments
      await Promise.all(
        deletedAttachmentIds.map((aid) =>
          announcementsApi.deleteAttachment(id, aid),
        ),
      );
      // Upload new files
      if (pendingFiles.length > 0) {
        await announcementsApi.uploadAttachments(id, pendingFiles);
      }
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

          {/* Attachments section */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                {t("attachments", { defaultValue: "Attachments" })}
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPaperclip size={13} />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("add_files", { defaultValue: "Add files" })}
              </Button>
            </Group>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {existingAttachments.length === 0 && pendingFiles.length === 0 && (
              <Text size="xs" c="dimmed">
                {t("no_attachments", { defaultValue: "No attachments yet." })}
              </Text>
            )}

            <Stack gap={4}>
              {existingAttachments.map((att) => (
                <Group
                  key={att.id}
                  justify="space-between"
                  wrap="nowrap"
                  px="sm"
                  py={6}
                  style={{
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: 8,
                  }}
                >
                  <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon
                      size={20}
                      variant="light"
                      color="blue"
                      radius="sm"
                    >
                      <IconFile size={11} />
                    </ThemeIcon>
                    <Text size="xs" lineClamp={1}>
                      {att.filename}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                      {formatBytes(att.size)}
                    </Text>
                  </Group>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => markDeleted(att.id)}
                  >
                    <IconX size={11} />
                  </ActionIcon>
                </Group>
              ))}

              {pendingFiles.map((file, i) => (
                <Group
                  key={i}
                  justify="space-between"
                  wrap="nowrap"
                  px="sm"
                  py={6}
                  style={{
                    border: "1px dashed var(--mantine-color-blue-4)",
                    borderRadius: 8,
                    background: "var(--mantine-color-blue-light)",
                  }}
                >
                  <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon
                      size={20}
                      variant="filled"
                      color="blue"
                      radius="sm"
                    >
                      <IconFile size={11} />
                    </ThemeIcon>
                    <Text size="xs" lineClamp={1}>
                      {file.name}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                      {formatBytes(file.size)}
                    </Text>
                  </Group>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => removePending(i)}
                  >
                    <IconX size={11} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Box>

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

  const handleCreate = async (
    values: AnnouncementFormValues,
  ): Promise<string> => {
    const dto: CreateAnnouncementDto = {
      title: values.title,
      body: values.body,
      pinned: values.pinned,
      expiresAt: values.expiresAt || undefined,
    };
    const ann = await announcementsApi.create(dto);
    notifications.show({
      color: "green",
      message: t("created_successfully", {
        defaultValue: "Created successfully",
      }),
    });
    load();
    return ann.id;
  };

  const handleUpdate = async (
    values: AnnouncementFormValues,
  ): Promise<string> => {
    if (!editing) return "";
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
    return editing.id;
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
    <>
      <PageHeader
        title={t("announcements", { defaultValue: "Announcements" })}
        actions={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditing(null);
              setModalOpened(true);
            }}
          >
            {t("new_announcement", { defaultValue: "New Announcement" })}
          </Button>
        }
      />
      <PageShell>
        <LoadingOverlay visible={loading} />

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
                    {item.attachments.length > 0 && (
                      <Badge
                        color="blue"
                        variant="light"
                        size="sm"
                        leftSection={<IconPaperclip size={10} />}
                      >
                        {item.attachments.length}
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {item.body}
                  </Text>
                  {item.attachments.length > 0 && (
                    <Group gap="xs" mt={6} wrap="wrap">
                      {item.attachments.map((att) => (
                        <Button
                          key={att.id}
                          size="xs"
                          variant="subtle"
                          color="blue"
                          leftSection={<IconFile size={11} />}
                          onClick={() =>
                            announcementsApi.downloadAttachment(
                              item.id,
                              att.id,
                              att.filename,
                            )
                          }
                        >
                          {att.filename}
                        </Button>
                      ))}
                    </Group>
                  )}
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
      </PageShell>
    </>
  );
}
