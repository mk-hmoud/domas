import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionIcon,
  Alert,
  Box,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from '@domas/ui';
import { IconLock, IconMessageCircle, IconSend } from '@tabler/icons-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { useMessages } from '../contexts/MessagesContext';

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
}

export function MessagesPage() {
  const { t } = useTranslation();
  const { conversation, loading, sendMessage, markAllAsRead } = useMessages();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAllAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight });
  }, [conversation?.messages?.length]);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await sendMessage(body.trim());
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack gap="lg">
      <PortalPageHeader
        icon={IconMessageCircle}
        color="indigo"
        title={t('portal.messages_title', { defaultValue: 'Messages' })}
        subtitle={t('portal.messages_subtitle', {
          defaultValue: 'Chat with the dorm management team',
        })}
      />
      {conversation?.status === 'closed' && (
        <Alert color="gray" variant="light" icon={<IconLock size={16} />}>
          {t('portal.conversation_closed_notice', {
            defaultValue:
              'This conversation has been closed by management. Sending a new message will start a new conversation.',
          })}
        </Alert>
      )}
      <Paper
        radius="xl"
        style={{
          overflow: 'hidden',
          border: '1px solid var(--mantine-color-default-border)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100dvh - 260px)',
          minHeight: 360,
        }}
      >
        <ScrollArea style={{ flex: 1 }} p="md" viewportRef={viewportRef}>
          {!loading && !conversation?.messages?.length && (
            <Stack align="center" gap="sm" py="xl">
              <ThemeIcon size={52} radius="xl" variant="light" color="gray">
                <IconMessageCircle size={26} />
              </ThemeIcon>
              <Text fw={600}>{t('portal.no_messages', { defaultValue: 'No messages yet' })}</Text>
              <Text size="sm" c="dimmed" ta="center">
                {t('portal.no_messages_description', {
                  defaultValue: 'Send a message to start a conversation with management.',
                })}
              </Text>
            </Stack>
          )}
          <Stack gap="sm">
            {(conversation?.messages ?? []).map((m) => (
              <Box
                key={m.id}
                style={{
                  alignSelf: m.senderType === 'student' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}
              >
                <Paper
                  p="xs"
                  radius="md"
                  withBorder={m.senderType === 'user'}
                  style={{
                    background:
                      m.senderType === 'student' ? 'var(--mantine-color-blue-filled)' : undefined,
                    color: m.senderType === 'student' ? 'white' : undefined,
                  }}
                >
                  <Text size="sm">{m.body}</Text>
                </Paper>
                <Text size="xs" c="dimmed" mt={2}>
                  {formatTime(m.createdAt)}
                </Text>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
        <Group
          p="sm"
          gap="xs"
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Textarea
            style={{ flex: 1 }}
            placeholder={t('portal.type_a_message', { defaultValue: 'Type a message…' })}
            autosize
            minRows={1}
            maxRows={4}
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <ActionIcon size="lg" onClick={handleSend} loading={sending} disabled={!body.trim()}>
            <IconSend size={16} />
          </ActionIcon>
        </Group>
      </Paper>
    </Stack>
  );
}
