import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Button,
  Stack,
  Text,
  Group,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Table,
  LoadingOverlay,
  Paper,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDatabaseExport,
  IconDownload,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { backups, BackupFile } from "@domas/api-client";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SharedBackupsPage() {
  const { t } = useTranslation();
  const [list, setList] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setList(await backups.list());
    } catch {
      notifications.show({
        color: "red",
        message: t("backups.load_error", {
          defaultValue: "Failed to load backups",
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const backup = await backups.create();
      notifications.show({
        color: "green",
        message: t("backups.created", {
          defaultValue: "Backup created: {{name}}",
          name: backup.name,
        }),
      });
      await load();
    } catch {
      notifications.show({
        color: "red",
        message: t("backups.create_error", {
          defaultValue: "Failed to create backup",
        }),
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (name: string) => {
    const url = backups.download(name);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const handleDelete = (name: string) => {
    modals.openConfirmModal({
      title: t("backups.delete_confirm_title", {
        defaultValue: "Delete backup?",
      }),
      children: (
        <Text size="sm">
          {t("backups.delete_confirm_body", {
            defaultValue: "This will permanently delete {{name}}.",
            name,
          })}
        </Text>
      ),
      labels: {
        confirm: t("delete", { defaultValue: "Delete" }),
        cancel: t("cancel", { defaultValue: "Cancel" }),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await backups.delete(name);
          notifications.show({
            color: "green",
            message: t("backups.deleted", { defaultValue: "Backup deleted" }),
          });
          await load();
        } catch {
          notifications.show({
            color: "red",
            message: t("backups.delete_error", {
              defaultValue: "Failed to delete backup",
            }),
          });
        }
      },
    });
  };

  return (
    <>
      <PageHeader
        title={t("nav.backups")}
        subtitle={t("backups.subtitle")}
        actions={
          <Group>
            <Tooltip label={t("backups.refresh")}>
              <ActionIcon
                variant="subtle"
                onClick={load}
                loading={loading}
                size="lg"
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<IconDatabaseExport size={16} />}
              onClick={handleCreate}
              loading={creating}
            >
              {t("backups.create_now")}
            </Button>
          </Group>
        }
      />

      <PageShell>
        <Stack gap="md">
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="blue"
            variant="light"
          >
            {t("backups.info")}
          </Alert>

          <Paper withBorder radius="md" style={{ position: "relative" }}>
            <LoadingOverlay
              visible={loading && list.length === 0}
              overlayProps={{ blur: 2 }}
            />
            {list.length === 0 && !loading ? (
              <Text c="dimmed" ta="center" py="xl">
                {t("backups.no_backups")}
              </Text>
            ) : (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("backups.col_name")}</Table.Th>
                    <Table.Th>{t("backups.col_size")}</Table.Th>
                    <Table.Th>{t("backups.col_created")}</Table.Th>
                    <Table.Th style={{ width: 100 }} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {list.map((b, i) => (
                    <Table.Tr key={b.name}>
                      <Table.Td>
                        <Group gap={8}>
                          <Text size="sm" ff="monospace">
                            {b.name}
                          </Text>
                          {i === 0 && (
                            <Badge size="xs" color="green">
                              {t("backups.latest")}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatBytes(b.sizeBytes)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(b.createdAt).toLocaleString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label={t("download")}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={() => handleDownload(b.name)}
                            >
                              <IconDownload size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t("delete")}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(b.name)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Stack>
      </PageShell>
    </>
  );
}
