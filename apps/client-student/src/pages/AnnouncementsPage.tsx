import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Box, Button, Group, Paper, Skeleton, Stack, Text, ThemeIcon } from '@domas/ui';
import { IconFile, IconPaperclip, IconPin, IconSpeakerphone } from '@tabler/icons-react';
import { Announcement } from '@domas/ts-types';
import { portalAnnouncements } from '@domas/api-client';
import { useAnnouncements } from '../contexts/AnnouncementsContext';
import { PageHero } from '../components/PageHero';

function AnnouncementCard({ item }: { item: Announcement }) {
  const { t } = useTranslation();

  return (
    <Paper
      radius="xl"
      style={{
        overflow: 'hidden',
        border: `1px solid ${item.pinned ? 'var(--mantine-color-orange-3)' : 'var(--mantine-color-default-border)'}`,
        boxShadow: item.pinned ? '0 4px 16px rgba(253,126,20,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <Group gap={0} wrap="nowrap">
        {/* Left accent strip */}
        <Box
          style={{
            width: 5,
            alignSelf: 'stretch',
            background: item.pinned
              ? 'linear-gradient(180deg, #F76707, #E8590C)'
              : 'var(--mantine-color-default-border)',
            flexShrink: 0,
          }}
        />
        <Box p="lg" style={{ flex: 1 }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
            <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              {item.pinned && (
                <ThemeIcon
                  size={26}
                  radius="md"
                  variant="light"
                  color="orange"
                  style={{ flexShrink: 0 }}
                >
                  <IconPin size={13} />
                </ThemeIcon>
              )}
              <Text fw={700} size="md" lineClamp={2} style={{ flex: 1 }}>
                {item.title}
              </Text>
            </Group>
            <Group gap="xs" style={{ flexShrink: 0 }}>
              {item.pinned && (
                <Badge color="orange" variant="light" size="sm" radius="xl">
                  {t('portal.announcement_pinned', { defaultValue: 'Pinned' })}
                </Badge>
              )}
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
              </Text>
            </Group>
          </Group>

          <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
            {item.body}
          </Text>

          {item.attachments && item.attachments.length > 0 && (
            <Box mt="sm">
              <Group gap="xs" mb={4}>
                <IconPaperclip size={13} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed" fw={500}>
                  {t('portal.attachments', { defaultValue: 'Attachments' })}
                </Text>
              </Group>
              <Group gap="xs" wrap="wrap">
                {item.attachments.map((att) => (
                  <Button
                    key={att.id}
                    size="xs"
                    variant="light"
                    color="blue"
                    radius="xl"
                    leftSection={<IconFile size={11} />}
                    onClick={() =>
                      portalAnnouncements.downloadAttachment(item.id, att.id, att.filename)
                    }
                  >
                    {att.filename}
                  </Button>
                ))}
              </Group>
            </Box>
          )}

          {item.createdByName && (
            <Text size="xs" c="dimmed" mt="sm" fw={500}>
              — {item.createdByName}
            </Text>
          )}
        </Box>
      </Group>
    </Paper>
  );
}

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const { items, loading, markAllAsSeen } = useAnnouncements();

  useEffect(() => {
    if (!loading && items.length > 0) {
      markAllAsSeen();
    }
  }, [items, loading, markAllAsSeen]);

  return (
    <Stack gap="lg">
      <PageHero
        color="purple"
        label="Student Housing Portal"
        title={t('portal.nav_announcements', { defaultValue: 'Announcements' })}
        subtitle={t('portal.announcements_subtitle', {
          defaultValue: 'Important notices from management',
        })}
        icon={<IconSpeakerphone size={28} />}
      />

      {loading ? (
        <Stack gap="md">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={110} radius="xl" />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <Paper
          radius="xl"
          p="xl"
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            textAlign: 'center',
          }}
        >
          <Stack align="center" gap="sm" py="md">
            <ThemeIcon size={52} radius="xl" variant="light" color="gray">
              <IconSpeakerphone size={26} />
            </ThemeIcon>
            <Text fw={600} size="lg">
              {t('portal.no_announcements', {
                defaultValue: 'No announcements at the moment.',
              })}
            </Text>
            <Text size="sm" c="dimmed">
              Check back later for updates from management.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          {items.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
