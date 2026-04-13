import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Box, Card, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@domas/ui';
import { IconPin, IconSpeakerphone } from '@tabler/icons-react';
import { Announcement } from '@domas/ts-types';
import { portalAnnouncements } from '@domas/api-client';

function AnnouncementCard({ item }: { item: Announcement }) {
  const { t } = useTranslation();
  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            {item.pinned && (
              <ThemeIcon size={20} radius="xl" variant="light" color="orange">
                <IconPin size={12} />
              </ThemeIcon>
            )}
            <Text fw={600} size="sm">
              {item.title}
            </Text>
          </Group>
          <Group gap="xs">
            {item.pinned && (
              <Badge color="orange" variant="light" size="xs">
                {t('portal.announcement_pinned', { defaultValue: 'Pinned' })}
              </Badge>
            )}
            <Text size="xs" c="dimmed">
              {item.createdByName && `${item.createdByName} · `}
              {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
            </Text>
          </Group>
        </Group>
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {item.body}
        </Text>
      </Stack>
    </Card>
  );
}

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalAnnouncements
      .getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3}>{t('portal.nav_announcements', { defaultValue: 'Announcements' })}</Title>
        <Text size="sm" c="dimmed">
          {t('portal.announcements_subtitle', {
            defaultValue: 'Important notices from management',
          })}
        </Text>
      </Box>

      {loading ? (
        <Stack gap="sm">
          <Skeleton height={90} radius="md" />
          <Skeleton height={90} radius="md" />
          <Skeleton height={90} radius="md" />
        </Stack>
      ) : items.length === 0 ? (
        <Alert icon={<IconSpeakerphone size={16} />} color="gray" radius="md">
          {t('portal.no_announcements', {
            defaultValue: 'No announcements at the moment.',
          })}
        </Alert>
      ) : (
        <Stack gap="sm">
          {items.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
