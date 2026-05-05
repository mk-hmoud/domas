import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Center, Group, Paper, Stack, Text, TextInput, Title } from '@domas/ui';
import { ThemeToggle, LanguageSwitcher } from '@domas/ui';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { Divider } from '@mantine/core';
import { IconBed, IconArrowRight } from '@tabler/icons-react';
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
      <Group justify="flex-end" p="sm" style={{ position: 'relative', zIndex: 10 }}>
        <LanguageSwitcher />
        <ThemeToggle />
      </Group>

      {/* Centered content */}
      <Center style={{ flex: 1, padding: '0 16px 60px' }}>
        <Stack align="center" gap="xl" w="100%" maw={420}>
          {/* Brand mark */}
          <Stack align="center" gap="sm">
            <Box
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #1864AB 0%, #1971C2 45%, #0C8599 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(25,113,194,0.35)',
              }}
            >
              <IconBed size={34} color="white" />
            </Box>
            <Stack align="center" gap={4}>
              <Title order={2} ta="center" fw={800} lh={1.2}>
                {t('portal.login_title')}
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                {t('portal.login_subtitle')}
              </Text>
            </Stack>
          </Stack>

          {/* Login card */}
          <Paper
            radius="xl"
            p={{ base: 'xl', sm: 32 }}
            w="100%"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
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
                  radius="lg"
                  autoComplete="username"
                  autoFocus
                  inputMode="numeric"
                  styles={{
                    input: {
                      borderWidth: 1.5,
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="xl"
                  loading={loading}
                  rightSection={!loading ? <IconArrowRight size={16} /> : undefined}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  style={{
                    boxShadow: '0 4px 16px rgba(34,139,230,0.35)',
                  }}
                >
                  {t('sign_in')}
                </Button>
              </Stack>
            </form>
          </Paper>

          <Divider
            label={t('portal.new_student', 'New student?')}
            labelPosition="center"
            w="100%"
          />

          <Button component={Link} to="/register" variant="light" radius="xl" size="md" w="100%">
            {t('portal.apply_now', 'Apply for accommodation')}
          </Button>
        </Stack>
      </Center>
    </Box>
  );
}
