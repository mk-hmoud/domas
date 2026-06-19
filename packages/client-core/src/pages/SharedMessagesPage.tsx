import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { PageHeader, PageShell, EmptyState } from "@domas/ui";
import { notifications } from "@mantine/notifications";
import {
  IconLock,
  IconLockOpen,
  IconPlus,
  IconSend,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  conversations as conversationsApi,
  students as studentsApi,
} from "@domas/api-client";
import { Conversation } from "@domas/ts-types";

function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString();
}

function StudentSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await studentsApi.findAll({
          search: searchQuery,
          page: 1,
          limit: 20,
        });
        setOptions(
          result.data.map((s) => ({
            value: s.id,
            label: `${s.firstName} ${s.lastName} (${s.studentNumber})`,
          })),
        );
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <Select
      label={t("student", { defaultValue: "Student" })}
      placeholder={t("search_students_placeholder", {
        defaultValue: "Search students…",
      })}
      searchable
      data={options}
      value={value}
      onChange={onChange}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      rightSection={loading ? <Loader size={14} /> : undefined}
      nothingFoundMessage={
        searchQuery.trim()
          ? t("no_students_found", { defaultValue: "No students found" })
          : t("type_to_search", { defaultValue: "Type to search" })
      }
    />
  );
}

function StartConversationModal({
  opened,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  onSuccess: (conversation: Conversation) => void;
}) {
  const { t } = useTranslation();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) {
      setStudentId(null);
      setSubject("");
      setBody("");
    }
  }, [opened]);

  const handleSubmit = async () => {
    if (!studentId || !body.trim()) return;
    setLoading(true);
    try {
      const conversation = await conversationsApi.start({
        studentId,
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      onSuccess(conversation);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("new_conversation", { defaultValue: "New Conversation" })}
      size="md"
    >
      <Stack gap="md">
        <StudentSelect value={studentId} onChange={setStudentId} />
        <TextInput
          label={t("subject", { defaultValue: "Subject (optional)" })}
          value={subject}
          onChange={(e) => setSubject(e.currentTarget.value)}
        />
        <Textarea
          label={t("message", { defaultValue: "Message" })}
          required
          minRows={4}
          autosize
          value={body}
          onChange={(e) => setBody(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!studentId || !body.trim()}
          >
            {t("send", { defaultValue: "Send" })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function SharedMessagesPage() {
  const { t } = useTranslation();
  const [list, setList] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">(
    "open",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [startModalOpened, setStartModalOpened] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadList = async () => {
    setListLoading(true);
    try {
      const result = await conversationsApi.findAll({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      });
      setList(result);
    } finally {
      setListLoading(false);
    }
  };

  // Poll the list periodically so new/incoming conversations and unread
  // badges show up without a manual refresh — there's no admin-side SSE,
  // only the student side gets realtime push (see RealtimeService).
  useEffect(() => {
    loadList();
    const interval = setInterval(loadList, 15_000);
    return () => clearInterval(interval);
  }, [statusFilter, debouncedSearch]);

  const selectConversation = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const conversation = await conversationsApi.findOne(id);
      setSelected(conversation);
      if (conversation.unreadByAdmin) {
        await conversationsApi.markRead(id);
        loadList();
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Poll the open thread for new messages sent by the student while it's open
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      const conversation = await conversationsApi.findOne(selectedId);
      setSelected(conversation);
      if (conversation.unreadByAdmin) {
        await conversationsApi.markRead(selectedId);
        loadList();
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight });
  }, [selected?.messages?.length]);

  const handleReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setSending(true);
    try {
      const message = await conversationsApi.reply(selected.id, {
        body: replyBody.trim(),
      });
      setSelected((prev) =>
        prev
          ? { ...prev, messages: [...(prev.messages ?? []), message] }
          : prev,
      );
      setReplyBody("");
      loadList();
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selected) return;
    const updated =
      selected.status === "open"
        ? await conversationsApi.close(selected.id)
        : await conversationsApi.reopen(selected.id);
    setSelected((prev) => (prev ? { ...prev, status: updated.status } : prev));
    notifications.show({
      color: "green",
      message: t("saved_successfully", { defaultValue: "Saved successfully" }),
    });
    loadList();
  };

  return (
    <>
      <PageHeader
        title={t("messages", { defaultValue: "Messages" })}
        actions={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setStartModalOpened(true)}
          >
            {t("new_conversation", { defaultValue: "New Conversation" })}
          </Button>
        }
      />
      <PageShell>
        <Group
          align="flex-start"
          gap="md"
          wrap="nowrap"
          style={{ height: "calc(100vh - 220px)" }}
        >
          {/* Conversation list */}
          <Paper
            withBorder
            radius="md"
            style={{
              width: 340,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack gap="xs" p="sm">
              <TextInput
                placeholder={t("search_placeholder", {
                  defaultValue: "Search…",
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
              />
              <SegmentedControl
                fullWidth
                size="xs"
                value={statusFilter}
                onChange={(v) =>
                  setStatusFilter(v as "open" | "closed" | "all")
                }
                data={[
                  { label: t("open", { defaultValue: "Open" }), value: "open" },
                  {
                    label: t("closed", { defaultValue: "Closed" }),
                    value: "closed",
                  },
                  { label: t("all", { defaultValue: "All" }), value: "all" },
                ]}
              />
            </Stack>
            <Box style={{ position: "relative", flex: 1, overflow: "hidden" }}>
              <LoadingOverlay visible={listLoading} />
              <ScrollArea h="100%">
                <Stack gap={0}>
                  {list.length === 0 && !listLoading && (
                    <Box p="md">
                      <EmptyState
                        title={t("no_conversations", {
                          defaultValue: "No conversations.",
                        })}
                      />
                    </Box>
                  )}
                  {list.map((c) => (
                    <Box
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      p="sm"
                      style={{
                        cursor: "pointer",
                        borderBottom:
                          "1px solid var(--mantine-color-default-border)",
                        background:
                          c.id === selectedId
                            ? "var(--mantine-color-blue-light)"
                            : undefined,
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap" mb={2}>
                        <Text
                          size="sm"
                          fw={c.unreadByAdmin ? 700 : 500}
                          lineClamp={1}
                        >
                          {c.studentName}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                          {formatTime(c.lastMessageAt)}
                        </Text>
                      </Group>
                      <Group justify="space-between" wrap="nowrap">
                        <Text
                          size="xs"
                          c="dimmed"
                          lineClamp={1}
                          style={{ flex: 1 }}
                        >
                          {c.lastMessagePreview ?? c.subject ?? ""}
                        </Text>
                        {c.unreadByAdmin && (
                          <Badge size="xs" color="blue" circle />
                        )}
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </ScrollArea>
            </Box>
          </Paper>

          {/* Thread */}
          <Paper
            withBorder
            radius="md"
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <LoadingOverlay visible={detailLoading} />
            {!selected && (
              <EmptyState
                title={t("select_conversation", {
                  defaultValue: "Select a conversation",
                })}
              />
            )}
            {selected && (
              <>
                <Group
                  justify="space-between"
                  p="sm"
                  style={{
                    borderBottom:
                      "1px solid var(--mantine-color-default-border)",
                  }}
                >
                  <Box>
                    <Text fw={600}>{selected.studentName}</Text>
                    <Text size="xs" c="dimmed">
                      {selected.studentNumber}
                      {selected.subject ? ` · ${selected.subject}` : ""}
                    </Text>
                  </Box>
                  {selected.status === "open" || selected.canReopen ? (
                    <Button
                      size="xs"
                      variant="light"
                      color={selected.status === "open" ? "red" : "green"}
                      leftSection={
                        selected.status === "open" ? (
                          <IconLock size={13} />
                        ) : (
                          <IconLockOpen size={13} />
                        )
                      }
                      onClick={handleToggleStatus}
                    >
                      {selected.status === "open"
                        ? t("close_conversation", { defaultValue: "Close" })
                        : t("reopen_conversation", { defaultValue: "Reopen" })}
                    </Button>
                  ) : (
                    <Text size="xs" c="dimmed">
                      {t("cannot_reopen_hint", {
                        defaultValue: "Student has a newer open conversation",
                      })}
                    </Text>
                  )}
                </Group>
                <ScrollArea
                  style={{ flex: 1 }}
                  p="md"
                  viewportRef={viewportRef}
                >
                  <Stack gap="sm">
                    {(selected.messages ?? []).map((m) => (
                      <Box
                        key={m.id}
                        style={{
                          alignSelf:
                            m.senderType === "user" ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                        }}
                      >
                        <Paper
                          p="xs"
                          radius="md"
                          withBorder={m.senderType === "student"}
                          style={{
                            background:
                              m.senderType === "user"
                                ? "var(--mantine-color-blue-filled)"
                                : undefined,
                            color:
                              m.senderType === "user" ? "white" : undefined,
                          }}
                        >
                          <Text size="sm">{m.body}</Text>
                        </Paper>
                        <Text size="xs" c="dimmed" mt={2}>
                          {m.senderName} · {formatTime(m.createdAt)}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                </ScrollArea>
                <Group
                  p="sm"
                  gap="xs"
                  style={{
                    borderTop: "1px solid var(--mantine-color-default-border)",
                  }}
                >
                  <Textarea
                    style={{ flex: 1 }}
                    placeholder={t("type_a_message", {
                      defaultValue: "Type a message…",
                    })}
                    autosize
                    minRows={1}
                    maxRows={4}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <ActionIcon
                    size="lg"
                    onClick={handleReply}
                    loading={sending}
                    disabled={!replyBody.trim()}
                  >
                    <IconSend size={16} />
                  </ActionIcon>
                </Group>
              </>
            )}
          </Paper>
        </Group>

        <StartConversationModal
          opened={startModalOpened}
          onClose={() => setStartModalOpened(false)}
          onSuccess={(conversation) => {
            loadList();
            setSelectedId(conversation.id);
            setSelected(conversation);
          }}
        />
      </PageShell>
    </>
  );
}
