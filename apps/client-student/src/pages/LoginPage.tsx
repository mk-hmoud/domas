import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Center, Group, Paper, Stack, Text, TextInput, Title } from '@domas/ui';
import { ThemeToggle, LanguageSwitcher } from '@domas/ui';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useStudentAuth } from '../contexts/StudentAuthContext';

export function LoginPage() {
  const { login } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const [studentNumber, setStudentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = studentNumber.trim();
    if (!trimmed) {
      setError(t('portal.student_number_required'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(trimmed);
      navigate(from, { replace: true });
    } catch {
      notifications.show({
        color: 'red',
        title: t('portal.login_failed_title'),
        message: t('portal.login_failed_message'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <Group justify="flex-end" p="sm">
        <LanguageSwitcher />
        <ThemeToggle />
      </Group>

      {/* Centered login card */}
      <Center style={{ flex: 1, padding: '0 16px 40px' }}>
        <Paper withBorder radius="md" p={{ base: 'xl', sm: 40 }} w="100%" maw={400}>
          <Stack gap="xs" mb="xl" align="center">
            <Title order={2} ta="center">
              {t('portal.login_title')}
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              {t('portal.login_subtitle')}
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label={t('portal.student_number_label')}
                placeholder={t('portal.student_number_placeholder')}
                value={studentNumber}
                onChange={(e) => {
                  setStudentNumber(e.currentTarget.value);
                  if (error) setError('');
                }}
                error={error || undefined}
                size="md"
                autoComplete="username"
                autoFocus
                inputMode="numeric"
              />

              <Button type="submit" fullWidth size="md" loading={loading} mt="xs">
                {t('sign_in')}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Center>
    </Box>
  );
}
