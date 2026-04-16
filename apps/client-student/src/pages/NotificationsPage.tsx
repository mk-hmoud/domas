import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionIcon, Box, Button, Group, Paper, Stack, Table, Text, ThemeIcon } from '@domas/ui';
import { IconBell, IconBellOff, IconCheck, IconCircleFilled } from '@tabler/icons-react';
import { StudentNotification } from '@domas/ts-types';
import { portalNotifications } from '@domas/api-client';
import { useNotifications } from '../contexts/NotificationsContext';

const PAGE_SIZE = 20;

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('portal.time_just_now');
    if (mins < 60) return t('portal.time_minutes_ago', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('portal.time_hours_ago', { count: hrs });
    const days = Math.floor(hrs / 24);
    if (days < 7) return t('portal.time_days_ago', { count: days });
    return new Date(dateStr).toLocaleDateString();
  };
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: StudentNotification;
  onMarkRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const isUnread = !notification.readAt;

  return (
    <Paper
      radius="lg"
      style={{
        overflow: 'hidden',
        border: `1px solid ${isUnread ? 'var(--mantine-color-blue-3)' : 'var(--mantine-color-default-border)'}`,
        boxShadow: isUnread ? '0 2px 8px rgba(34,139,230,0.1)' : undefined,
      }}
    >
      <Group gap={0} wrap="nowrap">
        {/* Unread accent strip */}
        <Box
          style={{
            width: 4,
            alignSelf: 'stretch',
            background: isUnread ? 'linear-gradient(180deg, #228BE6, #0C8599)' : 'transparent',
            flexShrink: 0,
            transition: 'background 0.2s ease',
          }}
        />
        <Group gap="sm" p="sm" style={{ flex: 1 }} align="flex-start" wrap="nowrap">
          <ThemeIcon
            size={34}
            radius="xl"
            variant={isUnread ? 'gradient' : 'light'}
            gradient={isUnread ? { from: 'blue', to: 'cyan' } : undefined}
            color={isUnread ? 'blue' : 'gray'}
            style={{ flexShrink: 0 }}
          >
            <IconBell size={16} />
          </ThemeIcon>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
              <Text
                size="sm"
                fw={isUnread ? 700 : 400}
                style={{ flex: 1, minWidth: 0 }}
                lineClamp={1}
              >
                {notification.title}
              </Text>
              {isUnread && (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="blue"
                  onClick={() => onMarkRead(notification.id)}
                  title={t('portal.mark_as_read')}
                  style={{ flexShrink: 0 }}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              )}
            </Group>
            <Text size="xs" c="dimmed" mt={2} lineClamp={2}>
              {notification.body}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {timeAgo(notification.createdAt)}
            </Text>
          </Box>
        </Group>
      </Group>
    </Paper>
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
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();

  if (items.length === 0) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <ThemeIcon size={52} radius="xl" variant="light" color="gray">
          <IconBell size={26} />
        </ThemeIcon>
        <Text fw={600}>{t('portal.no_notifications')}</Text>
        <Text size="sm" c="dimmed" ta="center">
          {t('portal.no_notifications_description')}
        </Text>
      </Stack>
    );
  }

  return (
    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={16} />
          <Table.Th>{t('portal.col_notification')}</Table.Th>
          <Table.Th>{t('portal.col_message')}</Table.Th>
          <Table.Th w={100}>{t('portal.col_when')}</Table.Th>
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
                <Text size="sm" fw={isUnread ? 700 : 400} style={{ whiteSpace: 'nowrap' }}>
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
                    title={t('portal.mark_as_read')}
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
  const { t } = useTranslation();
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
    <Paper
      radius="xl"
      px="xl"
      py="lg"
      style={{
        background: 'linear-gradient(135deg, #1864AB 0%, #1971C2 45%, #0C8599 100%)',
        boxShadow: '0 6px 24px rgba(25,113,194,0.22)',
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Box>
          <Text
            size="xs"
            c="white"
            fw={600}
            style={{
              opacity: 0.75,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Student Housing Portal
          </Text>
          <Text fw={800} c="white" size="xl" lh={1.2}>
            {t('portal.notifications_title')}
          </Text>
          {unreadCount > 0 && (
            <Text size="sm" c="white" style={{ opacity: 0.8, marginTop: 4 }}>
              {unreadCount === 1
                ? t('portal.unread_count_singular')
                : t('portal.unread_count_plural', { count: unreadCount })}
            </Text>
          )}
        </Box>
        <Group gap="sm" style={{ flexShrink: 0 }}>
          {unreadCount > 0 && (
            <Button
              variant="white"
              size="sm"
              leftSection={<IconBellOff size={14} />}
              onClick={handleMarkAllRead}
              radius="xl"
              style={{ color: '#1864AB' }}
            >
              {t('portal.mark_all_read')}
            </Button>
          )}
          <ThemeIcon
            size={52}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <IconBell size={26} />
          </ThemeIcon>
        </Group>
      </Group>
    </Paper>
  );

  const loadMoreButton = hasMore && (
    <Button
      variant="light"
      onClick={() => loadPage(items.length, true)}
      loading={isLoadingMore}
      mx="auto"
      display="block"
      radius="xl"
    >
      {t('portal.load_more')}
    </Button>
  );

  const emptyState = (
    <Stack align="center" gap="sm" py="xl">
      <ThemeIcon size={52} radius="xl" variant="light" color="gray">
        <IconBell size={26} />
      </ThemeIcon>
      <Text fw={600}>{t('portal.no_notifications')}</Text>
      <Text size="sm" c="dimmed" ta="center">
        {t('portal.no_notifications_description')}
      </Text>
    </Stack>
  );

  if (isLoading) {
    return (
      <Stack gap="lg">
        {header}
        {/* Desktop skeleton */}
        <Box visibleFrom="sm">
          <Paper
            radius="xl"
            style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-default-border)' }}
          >
            <Stack gap={0}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  style={{
                    height: 52,
                    borderBottom:
                      i < 4 ? '1px solid var(--mantine-color-default-border)' : undefined,
                    background: i % 2 === 0 ? 'var(--mantine-color-default-hover)' : undefined,
                  }}
                />
              ))}
            </Stack>
          </Paper>
        </Box>
        {/* Mobile skeleton */}
        <Box hiddenFrom="sm">
          <Stack gap="sm">
            {[...Array(4)].map((_, i) => (
              <Paper
                key={i}
                radius="lg"
                style={{
                  overflow: 'hidden',
                  border: '1px solid var(--mantine-color-default-border)',
                }}
              >
                <Group gap={0} wrap="nowrap">
                  <Box
                    style={{
                      width: 4,
                      height: 72,
                      background: 'var(--mantine-color-gray-2)',
                      flexShrink: 0,
                    }}
                  />
                  <Group gap="sm" p="sm" style={{ flex: 1 }}>
                    <Box
                      style={{
                        width: 34,
                        height: 34,
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
                </Group>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {header}

      {/* Desktop — table view */}
      <Box visibleFrom="sm">
        {items.length === 0 ? (
          emptyState
        ) : (
          <Stack gap="md">
            <Paper
              radius="xl"
              style={{
                overflow: 'hidden',
                border: '1px solid var(--mantine-color-default-border)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}
            >
              <NotificationsTable items={items} onMarkRead={handleMarkRead} />
            </Paper>
            {loadMoreButton}
          </Stack>
        )}
      </Box>

      {/* Mobile — card list */}
      <Box hiddenFrom="sm">
        {items.length === 0 ? (
          emptyState
        ) : (
          <Stack gap="sm">
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
