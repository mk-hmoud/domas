import { useEffect, useState, useCallback } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import { IconBell, IconBellOff, IconCheck } from '@tabler/icons-react';
import { StudentNotification } from '@domas/ts-types';
import { portalNotifications } from '@domas/api-client';
import { useNotifications } from '../contexts/NotificationsContext';

const PAGE_SIZE = 20;

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
        background: isUnread ? 'var(--mantine-color-blue-0)' : undefined,
        borderColor: isUnread ? 'var(--mantine-color-blue-2)' : undefined,
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
            {new Date(notification.createdAt).toLocaleString()}
          </Text>
        </Box>
      </Group>
    </Card>
  );
}

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

  return (
    <Stack p="md" gap="md" maw={640} mx="auto">
      <Group justify="space-between" align="center">
        <Box>
          <Title order={4}>Notifications</Title>
          {unreadCount > 0 && (
            <Text size="sm" c="dimmed">
              {unreadCount} unread
            </Text>
          )}
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconBellOff size={14} />}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </Group>

      {isLoading ? (
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
      ) : items.length === 0 ? (
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

          {hasMore && (
            <Button
              variant="subtle"
              onClick={() => loadPage(items.length, true)}
              loading={isLoadingMore}
              leftSection={isLoadingMore ? <Loader size={14} /> : undefined}
            >
              Load more
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
