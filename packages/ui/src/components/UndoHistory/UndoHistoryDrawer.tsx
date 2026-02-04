import { useState } from "react";
import {
  Drawer,
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Badge,
  ScrollArea,
  Loader,
  Center,
  Switch,
} from "@mantine/core";
import {
  IconRotateDot,
  IconHistory,
  IconInfoCircle,
  IconUser,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { UndoLog } from "@domas/ts-types";

export interface UndoHistoryDrawerProps {
  opened: boolean;
  onClose: () => void;
  data: UndoLog[];
  loading?: boolean;
  onUndo: (id: string) => Promise<void>;
  currentUserId?: string;
  canSeeAll?: boolean;
}

export function UndoHistoryDrawer({
  opened,
  onClose,
  data,
  loading,
  onUndo,
  currentUserId,
  canSeeAll,
}: UndoHistoryDrawerProps) {
  const { t } = useTranslation();
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const getActionColor = (actionType: string) => {
    const action = actionType.toUpperCase();
    if (
      action.includes("CREATE") ||
      action.includes("INSERT") ||
      action.includes("ADD")
    )
      return "green";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "blue";
    if (action.includes("DELETE") || action.includes("REMOVE")) return "red";
    return "gray";
  };

  const filteredData = showOnlyMine
    ? data.filter((log) => log.userId === currentUserId)
    : data;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap="xs" style={{ width: "100%" }}>
          <Group gap="xs">
            <IconHistory size={20} />
            <Text fw={700}>{t("recent_history")}</Text>
          </Group>
          {canSeeAll && (
            <Switch
              size="xs"
              label={t("show_only_my_actions")}
              checked={showOnlyMine}
              onChange={(event) => setShowOnlyMine(event.currentTarget.checked)}
            />
          )}
        </Stack>
      }
      position="right"
      size="md"
    >
      {loading ? (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      ) : (
        <ScrollArea h="calc(100vh - 120px)" offsetScrollbars>
          <Stack gap="md" pr="md">
            {filteredData.length === 0 ? (
              <Center py={100} style={{ flexDirection: "column" }}>
                <IconHistory
                  size={48}
                  color="var(--mantine-color-gray-4)"
                  stroke={1.5}
                />
                <Text c="dimmed" mt="md">
                  {t("no_recent_history")}
                </Text>
              </Center>
            ) : (
              filteredData.map((log) => {
                const isMine = log.userId === currentUserId;
                return (
                  <Paper key={log.id} withBorder p="md" radius="md" shadow="xs">
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Badge
                              color={getActionColor(log.actionType)}
                              variant="light"
                            >
                              {log.actionType}
                            </Badge>
                            <Text size="sm" fw={600}>
                              {log.entityType}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {new Date(log.eventTimestamp).toLocaleString()}
                          </Text>
                        </Stack>

                        {!log.undoneAt && (
                          <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconRotateDot size={14} />}
                            onClick={() => onUndo(log.id)}
                          >
                            {t("undo")}
                          </Button>
                        )}
                      </Group>

                      {log.description && (
                        <Text size="sm" fw={500}>
                          {log.description}
                        </Text>
                      )}

                      {log.undoneAt && (
                        <Badge color="green" variant="dot" size="sm">
                          {t("undone_at")}:{" "}
                          {new Date(log.undoneAt).toLocaleString()}
                        </Badge>
                      )}

                      <Group justify="space-between">
                        <Group gap={4}>
                          <IconUser
                            size={12}
                            color="var(--mantine-color-dimmed)"
                          />
                          <Text size="xs" c="dimmed">
                            {isMine ? (
                              <Text span fw={700} c="blue">
                                {t("you")}
                              </Text>
                            ) : (
                              log.performedByName ||
                              log.performedByEmail ||
                              log.userId
                            )}
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconInfoCircle
                            size={12}
                            color="var(--mantine-color-dimmed)"
                          />
                          <Text size="xs" c="dimmed">
                            {t("entity_id", { defaultValue: "Target ID" })}:{" "}
                            {log.entityId}
                          </Text>
                        </Group>
                      </Group>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      )}
    </Drawer>
  );
}
