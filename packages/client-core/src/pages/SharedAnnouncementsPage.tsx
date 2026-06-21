import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  LoadingOverlay,
  Menu,
  Modal,
  MultiSelect,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { PageHeader, PageShell, EmptyState } from "@domas/ui";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFile,
  IconPaperclip,
  IconPin,
  IconPlus,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  announcements as announcementsApi,
  locations as locationsApi,
  semesters as semestersApi,
} from "@domas/api-client";
import {
  Announcement,
  AnnouncementAttachmentMeta,
  AnnouncementTargetDto,
  CreateAnnouncementDto,
} from "@domas/ts-types";
import {
  StudentMultiSelect,
  StudentOption,
} from "../components/StudentMultiSelect";

interface SelectOption {
  value: string;
  label: string;
}

function LocationMultiSelect({
  value,
  onChange,
  initialOptions = [],
  label,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  initialOptions?: SelectOption[];
  label?: string;
  placeholder?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<SelectOption[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    const key = initialOptions.map((o) => o.value).join(",");
    if (initializedFor.current === key) return;
    initializedFor.current = key;
    if (initialOptions.length === 0) return;
    setOptions((prev) => {
      const merged = new Map(prev.map((o) => [o.value, o]));
      initialOptions.forEach((o) => merged.set(o.value, o));
      return Array.from(merged.values());
    });
  }, [initialOptions]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await locationsApi.search(searchQuery, true);
        const fetched = results
          .filter((l) => l.type !== "bed")
          .map((l) => ({
            value: String(l.id),
            label: l.locationPath ? `${l.locationPath} > ${l.name}` : l.name,
          }));
        setOptions((prev) => {
          const merged = new Map(prev.map((o) => [o.value, o]));
          fetched.forEach((o) => merged.set(o.value, o));
          return Array.from(merged.values());
        });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <MultiSelect
      label={label}
      placeholder={placeholder}
      searchable
      value={value}
      onChange={onChange}
      data={options}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      rightSection={loading ? <Loader size={14} /> : undefined}
      nothingFoundMessage={
        searchQuery.trim() ? "No locations found" : "Type to search"
      }
      hidePickedOptions
    />
  );
}

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
  audienceMode: "all" | "targeted";
  targetStudentIds: string[];
  targetSemesterIds: string[];
  targetLocationIds: string[];
}

function AnnouncementModal({
  opened,
  onClose,
  onSubmit,
  onSuccess,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<string>;
  onSuccess: () => Promise<void>;
  initial?: Announcement | null;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>(
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const existingAttachments: AnnouncementAttachmentMeta[] = (
    initial?.attachments ?? []
  ).filter((a) => !deletedAttachmentIds.includes(a.id));

  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<SelectOption[]>([]);

  const form = useForm<AnnouncementFormValues>({
    initialValues: {
      title: "",
      body: "",
      pinned: false,
      expiresAt: "",
      audienceMode: "all",
      targetStudentIds: [],
      targetSemesterIds: [],
      targetLocationIds: [],
    },
    validate: {
      title: (v) => (v.trim() ? null : t("field_required")),
      body: (v) => (v.trim() ? null : t("field_required")),
    },
  });

  useEffect(() => {
    if (opened) {
      const studentTargets = (initial?.targets ?? []).filter(
        (target) => target.targetType === "student",
      );
      const semesterTargets = (initial?.targets ?? []).filter(
        (target) => target.targetType === "semester",
      );
      const locationTargets = (initial?.targets ?? []).filter(
        (target) => target.targetType === "location",
      );

      form.setValues({
        title: initial?.title ?? "",
        body: initial?.body ?? "",
        pinned: initial?.pinned ?? false,
        expiresAt: initial?.expiresAt
          ? new Date(initial.expiresAt).toISOString().split("T")[0]
          : "",
        audienceMode: initial?.audienceMode ?? "all",
        targetStudentIds: studentTargets.map((t) => t.studentId!),
        targetSemesterIds: semesterTargets.map((t) => String(t.semesterId)),
        targetLocationIds: locationTargets.map((t) => String(t.locationId)),
      });
      setStudentOptions(
        studentTargets.map((t) => ({
          value: t.studentId!,
          label: t.studentName ?? t.studentId!,
        })),
      );
      setLocationOptions(
        locationTargets.map((t) => ({
          value: String(t.locationId),
          label: t.locationName ?? String(t.locationId),
        })),
      );
      setSemesterOptions([]);
      setPendingFiles([]);
      setDeletedAttachmentIds([]);
    }
  }, [opened, initial]);

  // Semesters are a small, finite list — load once when targeting is opened
  // rather than wiring up a debounced search like the student/location pickers.
  useEffect(() => {
    if (!opened || form.values.audienceMode !== "targeted") return;
    if (semesterOptions.length > 0) return;
    semestersApi.findAll({ limit: 200 }).then((result) => {
      const initialSemesterTargets = (initial?.targets ?? []).filter(
        (target) => target.targetType === "semester",
      );
      const merged = new Map<string, SelectOption>(
        initialSemesterTargets.map((t) => [
          String(t.semesterId),
          {
            value: String(t.semesterId),
            label: t.semesterDisplayName ?? String(t.semesterId),
          },
        ]),
      );
      result.data.forEach((s) =>
        merged.set(String(s.id), { value: String(s.id), label: s.displayName }),
      );
      setSemesterOptions(Array.from(merged.values()));
    });
  }, [
    opened,
    form.values.audienceMode,
    initial?.targets,
    semesterOptions.length,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
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
      await onSuccess();
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

          {/* Audience targeting */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t("audience", { defaultValue: "Audience" })}
            </Text>
            <SegmentedControl
              fullWidth
              value={form.values.audienceMode}
              onChange={(v) =>
                form.setFieldValue("audienceMode", v as "all" | "targeted")
              }
              data={[
                {
                  label: t("all_students", { defaultValue: "All students" }),
                  value: "all",
                },
                {
                  label: t("targeted", { defaultValue: "Targeted" }),
                  value: "targeted",
                },
              ]}
            />
            {form.values.audienceMode === "targeted" && (
              <Stack gap="sm" mt="sm">
                <Text size="xs" c="dimmed">
                  {t("audience_targeting_hint", {
                    defaultValue:
                      "Visible to students matching any of the criteria below.",
                  })}
                </Text>
                <StudentMultiSelect
                  label={t("students", { defaultValue: "Students" })}
                  placeholder={t("search_students", {
                    defaultValue: "Search students…",
                  })}
                  value={form.values.targetStudentIds}
                  onChange={(v) => form.setFieldValue("targetStudentIds", v)}
                  initialOptions={studentOptions}
                />
                <MultiSelect
                  label={t("semesters", { defaultValue: "Semesters" })}
                  placeholder={t("select_semesters", {
                    defaultValue: "Select semesters…",
                  })}
                  data={semesterOptions}
                  value={form.values.targetSemesterIds}
                  onChange={(v) => form.setFieldValue("targetSemesterIds", v)}
                  searchable
                  hidePickedOptions
                />
                <LocationMultiSelect
                  label={t("buildings_and_rooms", {
                    defaultValue: "Buildings / rooms",
                  })}
                  placeholder={t("search_locations", {
                    defaultValue: "Search buildings, floors, rooms…",
                  })}
                  value={form.values.targetLocationIds}
                  onChange={(v) => form.setFieldValue("targetLocationIds", v)}
                  initialOptions={locationOptions}
                />
              </Stack>
            )}
          </Box>

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

            {/* Permanent drop zone */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              mt={
                existingAttachments.length > 0 || pendingFiles.length > 0
                  ? "xs"
                  : 0
              }
              style={{
                border: `2px dashed ${isDragging ? "var(--mantine-color-blue-4)" : "var(--mantine-color-default-border)"}`,
                borderRadius: "var(--mantine-radius-sm)",
                background: isDragging
                  ? "var(--mantine-color-blue-light)"
                  : undefined,
                padding: "32px 24px",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Stack gap={6} align="center">
                <IconPaperclip
                  size={28}
                  color={
                    isDragging
                      ? "var(--mantine-color-blue-5)"
                      : "var(--mantine-color-dimmed)"
                  }
                />
                <Text size="sm" c={isDragging ? "blue" : "dimmed"} ta="center">
                  {isDragging
                    ? t("drop_files_here", { defaultValue: "Drop files here" })
                    : t("drop_or_click", {
                        defaultValue: "Drop files here or click to browse",
                      })}
                </Text>
              </Stack>
            </Box>
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

  const buildTargets = (
    values: AnnouncementFormValues,
  ): AnnouncementTargetDto[] => [
    ...values.targetStudentIds.map((studentId) => ({
      targetType: "student" as const,
      studentId,
    })),
    ...values.targetSemesterIds.map((id) => ({
      targetType: "semester" as const,
      semesterId: Number(id),
    })),
    ...values.targetLocationIds.map((id) => ({
      targetType: "location" as const,
      locationId: Number(id),
    })),
  ];

  const handleCreate = async (
    values: AnnouncementFormValues,
  ): Promise<string> => {
    const dto: CreateAnnouncementDto = {
      title: values.title,
      body: values.body,
      pinned: values.pinned,
      expiresAt: values.expiresAt || undefined,
      audienceMode: values.audienceMode,
      targets:
        values.audienceMode === "targeted" ? buildTargets(values) : undefined,
    };
    const ann = await announcementsApi.create(dto);
    notifications.show({
      color: "green",
      message: t("created_successfully", {
        defaultValue: "Created successfully",
      }),
    });
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
      audienceMode: values.audienceMode,
      targets: values.audienceMode === "targeted" ? buildTargets(values) : [],
    });
    notifications.show({
      color: "green",
      message: t("saved_successfully", { defaultValue: "Saved successfully" }),
    });
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
        <Stack gap="sm" pos="relative">
          <LoadingOverlay visible={loading} />
          {data.length === 0 && !loading && (
            <EmptyState
              title={t("no_announcements_yet", {
                defaultValue: "No announcements yet.",
              })}
            />
          )}
          {data.map((item) => (
            <Card
              key={item.id}
              withBorder
              radius="md"
              p="md"
              style={{
                borderLeftWidth: 3,
                borderLeftColor: item.pinned
                  ? "var(--mantine-color-orange-filled)"
                  : item.isPublished
                    ? "var(--mantine-color-green-filled)"
                    : "var(--mantine-color-default-border)",
              }}
            >
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
                    {item.audienceMode === "targeted" && (
                      <Badge
                        color="violet"
                        variant="light"
                        size="sm"
                        leftSection={<IconUsers size={10} />}
                      >
                        {t("targeted_count", {
                          defaultValue: "Targeted ({{count}})",
                          count: item.targets.length,
                        })}
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
                      leftSection={
                        item.isPublished ? (
                          <IconEyeOff size={14} />
                        ) : (
                          <IconEye size={14} />
                        )
                      }
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
          onSuccess={load}
          initial={editing}
        />
      </PageShell>
    </>
  );
}
