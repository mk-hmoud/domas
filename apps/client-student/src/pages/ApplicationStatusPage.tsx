import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Center,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import { IconArrowLeft, IconCheck, IconClock, IconUserCheck, IconX } from '@tabler/icons-react';
import logo from '../assets/eul-logo.png';
import { useTranslation } from 'react-i18next';
import { portalApplications } from '@domas/api-client';
import { StudentApplication } from '@domas/ts-types';

const STATUS_CONFIG = {
  pending: { icon: IconClock, color: 'yellow' as const },
  approved: { icon: IconCheck, color: 'green' as const },
  rejected: { icon: IconX, color: 'red' as const },
};

export function ApplicationStatusPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [application, setApplication] = useState<StudentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    portalApplications
      .getStatus(id)
      .then(setApplication)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Center h="100dvh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (notFound || !application) {
    return (
      <Center h="100dvh" p="md">
        <Stack align="center" gap="md">
          <Text fw={700} size="xl">
            {t('portal.application_not_found', 'Application not found')}
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            {t(
              'portal.application_not_found_hint',
              'Please check the link you were given, or submit a new application.',
            )}
          </Text>
          <Button component={Link} to="/register" variant="light" radius="xl">
            {t('portal.new_application', 'New Application')}
          </Button>
        </Stack>
      </Center>
    );
  }

  const { icon: StatusIcon, color } = STATUS_CONFIG[application.status];

  return (
    <Box style={{ minHeight: '100dvh', background: 'var(--mantine-color-body)' }}>
      <Center p="md" pt="xl">
        <Stack w="100%" maw={480} gap="lg" align="center">
          <Stack gap={4} align="center">
            <Image src={logo} h={80} w="auto" fit="contain" />
            <Title order={3} fw={800}>
              {t('portal.application_status_title', 'Application Status')}
            </Title>
          </Stack>

          <Paper
            radius="xl"
            p="xl"
            w="100%"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <Stack align="center" gap="lg">
              <ThemeIcon size={64} radius="xl" variant="light" color={color}>
                <StatusIcon size={32} />
              </ThemeIcon>

              <Stack gap={4} align="center">
                <Text fw={800} size="xl">
                  {application.status === 'pending' &&
                    t('portal.status_pending_title', 'Under Review')}
                  {application.status === 'approved' &&
                    t('portal.status_approved_title', 'Application Approved!')}
                  {application.status === 'rejected' &&
                    t('portal.status_rejected_title', 'Application Rejected')}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {application.firstName} {application.lastName} · {application.studentNumber}
                </Text>
              </Stack>

              {application.status === 'pending' && (
                <Stack gap="sm" w="100%">
                  <Alert color="yellow" variant="light" radius="lg">
                    {t(
                      'portal.status_pending_body',
                      'Your application is being reviewed by our staff. This usually takes 1–3 business days.',
                    )}
                  </Alert>
                  <Button component={Link} to="/login" variant="light" radius="xl" size="sm">
                    {t('portal.login_to_check_status', 'Log in to check your status')}
                  </Button>
                </Stack>
              )}

              {application.status === 'approved' && (
                <Stack gap="sm" w="100%">
                  <Alert
                    icon={<IconUserCheck size={16} />}
                    color="green"
                    variant="light"
                    radius="lg"
                  >
                    {t(
                      'portal.status_approved_body',
                      'Your student account has been created. You can now log in to the portal using your student number.',
                    )}
                  </Alert>
                  <Button
                    component={Link}
                    to="/login"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                    size="md"
                  >
                    {t('portal.go_to_login', 'Go to Login')}
                  </Button>
                </Stack>
              )}

              {application.status === 'rejected' && (
                <Stack gap="sm" w="100%">
                  {application.rejectionReason && (
                    <Paper
                      withBorder
                      p="sm"
                      radius="md"
                      style={{ borderColor: 'var(--mantine-color-red-4)' }}
                    >
                      <Text size="xs" fw={600} c="red" mb={4}>
                        {t('reason', 'Reason')}
                      </Text>
                      <Text size="sm">{application.rejectionReason}</Text>
                    </Paper>
                  )}
                  <Alert color="red" variant="light" radius="lg">
                    {t(
                      'portal.status_rejected_body',
                      'You may submit a new application with corrected information.',
                    )}
                  </Alert>
                  <Button component={Link} to="/register" variant="light" radius="xl">
                    {t('portal.submit_new_application', 'Submit New Application')}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>

          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={14} />}
            component={Link}
            to="/login"
          >
            {t('portal.back_to_login', 'Back to login')}
          </Button>
        </Stack>
      </Center>
    </Box>
  );
}
