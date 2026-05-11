import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Center,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@domas/ui';
import { ThemeToggle, LanguageSwitcher } from '@domas/ui';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import {
  IconArrowRight,
  IconBed,
  IconBell,
  IconCreditCard,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import logo from '../assets/eul-logo.png';

// ─── Feature list shown on the branding panel ─────────────────────────────────

const FEATURES = [
  { icon: IconBed, labelKey: 'portal.login_feature_booking' },
  { icon: IconCreditCard, labelKey: 'portal.login_feature_financial' },
  { icon: IconBell, labelKey: 'portal.login_feature_notifications' },
  { icon: IconShieldCheck, labelKey: 'portal.login_feature_secure' },
] as const;

// ─── Left branding panel (desktop only) ──────────────────────────────────────

function BrandPanel() {
  const { t } = useTranslation();
  return (
    <Box
      visibleFrom="sm"
      style={{
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #1864AB 0%, #1971C2 40%, #0C8599 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 44px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <Box
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }}
      />

      <Stack gap="xl" style={{ position: 'relative' }}>
        {/* Logo + wordmark */}
        <Stack gap="md">
          <Image
            src={logo}
            h={72}
            w="auto"
            fit="contain"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
          />
          <Box>
            <Title order={2} c="white" fw={800} lh={1.2}>
              {t('portal.login_brand_title', { defaultValue: 'Student Housing Portal' })}
            </Title>
            <Text size="sm" c="white" style={{ opacity: 0.75, marginTop: 6 }}>
              {t('portal.login_brand_subtitle', {
                defaultValue: 'Manage your dormitory booking, payments, and more in one place.',
              })}
            </Text>
          </Box>
        </Stack>

        {/* Feature list */}
        <Stack gap="sm">
          {FEATURES.map(({ icon: Icon, labelKey }) => (
            <Group key={labelKey} gap="sm">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="white" />
              </Box>
              <Text size="sm" c="white" style={{ opacity: 0.88 }}>
                {t(labelKey, { defaultValue: labelKey })}
              </Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top utility bar */}
      <Group
        justify="flex-end"
        p="sm"
        style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}
      >
        <LanguageSwitcher />
        <ThemeToggle />
      </Group>

      {/* Main layout: branding (desktop left) + form (right) */}
      <Box style={{ flex: 1, display: 'flex', minHeight: '100dvh' }}>
        <BrandPanel />

        {/* Form panel */}
        <Center
          style={{
            flex: 1,
            padding: '80px 24px 40px',
          }}
        >
          <Stack gap="xl" w="100%" maw={400}>
            {/* Mobile-only logo */}
            <Stack align="center" gap="sm" style={{ display: 'flex' }} hiddenFrom="sm">
              <Image src={logo} h={80} w="auto" fit="contain" />
            </Stack>

            {/* Heading */}
            <Stack gap={4}>
              <Title order={2} fw={800} lh={1.2}>
                {t('portal.login_title')}
              </Title>
              <Text c="dimmed" size="sm">
                {t('portal.login_subtitle')}
              </Text>
            </Stack>

            {/* Form card */}
            <Paper
              radius="xl"
              p={{ base: 'xl', sm: 32 }}
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
                    styles={{ input: { borderWidth: 1.5 } }}
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
                    style={{ boxShadow: '0 4px 16px rgba(34,139,230,0.35)' }}
                  >
                    {t('sign_in')}
                  </Button>
                </Stack>
              </form>
            </Paper>

            <Divider label={t('portal.new_student', 'New student?')} labelPosition="center" />

            <Button component={Link} to="/register" variant="light" radius="xl" size="md">
              {t('portal.apply_now', 'Apply for accommodation')}
            </Button>
          </Stack>
        </Center>
      </Box>
    </Box>
  );
}
