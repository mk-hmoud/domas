import { useEffect, useState, useCallback } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import { IconBell, IconBellOff, IconCheck, IconCircleFilled } from '@tabler/icons-react';
import { StudentNotification } from '@domas/ts-types';
import { portalNotifications } from '@domas/api-client';
import { useNotifications } from '../contexts/NotificationsContext';

const PAGE_SIZE = 20;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: StudentNotification;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !notification.readAt;
  return (
    <Card
      withBorder
      radius="md"
      p="sm"
      style={{
        background: isUnread ? 'var(--mantine-color-blue-light)' : undefined,
        borderColor: isUnread ? 'var(--mantine-color-blue-4)' : undefined,
      }}
    >
      <Group gap="sm" align="flex-start">
        <ThemeIcon size={32} radius="xl" variant="light" color={isUnread ? 'blue' : 'gray'}>
          <IconBell size={16} />
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start" gap="xs">
            <Text size="sm" fw={isUnread ? 600 : 400} style={{ flex: 1, minWidth: 0 }}>
              {notification.title}
            </Text>
            {isUnread && (
              <ActionIcon
                variant="subtle"
                size="sm"
                color="blue"
                onClick={() => onMarkRead(notification.id)}
                title="Mark as read"
              >
                <IconCheck size={14} />
              </ActionIcon>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            {notification.body}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {timeAgo(notification.createdAt)}
          </Text>
        </Box>
      </Group>
    </Card>
  );
}

// ─── Desktop table ────────────────────────────────────────────────────────────

function NotificationsTable({
  items,
  onMarkRead,
}: {
  items: StudentNotification[];
  onMarkRead: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon size={48} radius="xl" variant="light" color="gray">
          <IconBell size={24} />
        </ThemeIcon>
        <Text fw={500}>No notifications yet</Text>
        <Text size="sm" c="dimmed" ta="center">
          You will be notified here about your booking status and other updates.
        </Text>
      </Stack>
    );
  }

  return (
    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={16} />
          <Table.Th>Notification</Table.Th>
          <Table.Th>Message</Table.Th>
          <Table.Th w={100}>When</Table.Th>
          <Table.Th w={40} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((n) => {
          const isUnread = !n.readAt;
          return (
            <Table.Tr
              key={n.id}
              style={{
                background: isUnread ? 'var(--mantine-color-blue-light)' : undefined,
              }}
            >
              <Table.Td>
                {isUnread && (
                  <IconCircleFilled
                    size={8}
                    color="var(--mantine-color-blue-5)"
                    style={{ display: 'block' }}
                  />
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={isUnread ? 600 : 400} style={{ whiteSpace: 'nowrap' }}>
                  {n.title}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {n.body}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {timeAgo(n.createdAt)}
                </Text>
              </Table.Td>
              <Table.Td>
                {isUnread && (
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="blue"
                    onClick={() => onMarkRead(n.id)}
                    title="Mark as read"
                  >
                    <IconCheck size={14} />
                  </ActionIcon>
                )}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { markAsRead, markAllAsRead } = useNotifications();
  const [items, setItems] = useState<StudentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    if (offset === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const data = await portalNotifications.getAll({ limit: PAGE_SIZE, offset });
      setHasMore(data.length === PAGE_SIZE);
      setItems((prev) => (append ? [...prev, ...data] : data));
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const unreadCount = items.filter((n) => !n.readAt).length;

  const header = (
    <Group justify="space-between" align="center">
      <Box>
        <Title order={3}>Notifications</Title>
        {unreadCount > 0 && (
          <Text size="sm" c="dimmed">
            {unreadCount} unread
          </Text>
        )}
      </Box>
      {unreadCount > 0 && (
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconBellOff size={14} />}
          onClick={handleMarkAllRead}
        >
          Mark all read
        </Button>
      )}
    </Group>
  );

  // ── Skeleton ──
  if (isLoading) {
    return (
      <Stack gap="lg">
        {header}
        {/* Desktop skeleton */}
        <Box visibleFrom="sm">
          <Stack gap="xs">
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                style={{
                  height: 44,
                  borderRadius: 8,
                  background: 'var(--mantine-color-gray-1)',
                }}
              />
            ))}
          </Stack>
        </Box>
        {/* Mobile skeleton */}
        <Box hiddenFrom="sm">
          <Stack gap="sm">
            {[...Array(4)].map((_, i) => (
              <Card key={i} withBorder radius="md" p="sm">
                <Group gap="sm">
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--mantine-color-gray-2)',
                      flexShrink: 0,
                    }}
                  />
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Box
                      style={{
                        height: 14,
                        borderRadius: 4,
                        background: 'var(--mantine-color-gray-2)',
                        width: '60%',
                      }}
                    />
                    <Box
                      style={{
                        height: 12,
                        borderRadius: 4,
                        background: 'var(--mantine-color-gray-1)',
                        width: '85%',
                      }}
                    />
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        </Box>
      </Stack>
    );
  }

  const loadMoreButton = hasMore && (
    <Button
      variant="subtle"
      onClick={() => loadPage(items.length, true)}
      loading={isLoadingMore}
      mx="auto"
      display="block"
    >
      Load more
    </Button>
  );

  return (
    <Stack gap="lg">
      {header}

      {/* Desktop — table view */}
      <Box visibleFrom="sm">
        {items.length === 0 ? (
          <Stack align="center" gap="xs" py="xl">
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
              <IconBell size={24} />
            </ThemeIcon>
            <Text fw={500}>No notifications yet</Text>
            <Text size="sm" c="dimmed" ta="center">
              You will be notified here about your booking status and other updates.
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            <Box
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
                overflow: 'hidden',
              }}
            >
              <NotificationsTable items={items} onMarkRead={handleMarkRead} />
            </Box>
            {loadMoreButton}
          </Stack>
        )}
      </Box>

      {/* Mobile — card list */}
      <Box hiddenFrom="sm">
        {items.length === 0 ? (
          <Stack align="center" gap="xs" py="xl">
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
              <IconBell size={24} />
            </ThemeIcon>
            <Text fw={500}>No notifications yet</Text>
            <Text size="sm" c="dimmed" ta="center">
              You will be notified here about your booking status and other updates.
            </Text>
          </Stack>
        ) : (
          <Stack gap="xs">
            {items.map((n) => (
              <NotificationCard key={n.id} notification={n} onMarkRead={handleMarkRead} />
            ))}
            {loadMoreButton}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
