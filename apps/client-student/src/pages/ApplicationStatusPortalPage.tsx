import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Center,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import { IconCheck, IconClock, IconUserCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { portalApplications } from '@domas/api-client';
import { StudentApplication } from '@domas/ts-types';
import { useStudentAuth } from '../contexts/StudentAuthContext';

const STATUS_CONFIG = {
  pending: { icon: IconClock, color: 'yellow' as const },
  approved: { icon: IconCheck, color: 'green' as const },
  rejected: { icon: IconX, color: 'red' as const },
};

export function ApplicationStatusPortalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { student } = useStudentAuth();

  const [application, setApplication] = useState<StudentApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApplications
      .getMine()
      .then(setApplication)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // If the student was approved in another tab, redirect to the dashboard
  useEffect(() => {
    if (student?.enrollmentStatus === 'enrolled') {
      navigate('/dashboard', { replace: true });
    }
  }, [student, navigate]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (!application) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Text fw={700} size="xl">
            {t('portal.application_not_found', 'Application not found')}
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
    <Center py="xl">
      <Stack w="100%" maw={480} gap="lg" align="center">
        <Stack gap={4} align="center">
          <Title order={3} fw={800}>
            {t('portal.application_status_title', 'Application Status')}
          </Title>
          <Text size="sm" c="dimmed">
            {student?.firstName} {student?.lastName} · {student?.studentNumber}
          </Text>
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
            </Stack>

            {application.status === 'pending' && (
              <Alert color="yellow" variant="light" radius="lg" style={{ width: '100%' }}>
                {t(
                  'portal.status_pending_body',
                  'Your application is being reviewed by our staff. This usually takes 1–3 business days. Check back here anytime by logging in.',
                )}
              </Alert>
            )}

            {application.status === 'approved' && (
              <Stack gap="sm" w="100%">
                <Alert icon={<IconUserCheck size={16} />} color="green" variant="light" radius="lg">
                  {t(
                    'portal.status_approved_portal_body',
                    'Your account has been activated. You can now access the full portal.',
                  )}
                </Alert>
                <Button
                  onClick={() => navigate('/dashboard', { replace: true })}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  size="md"
                >
                  {t('portal.go_to_dashboard', 'Go to Dashboard')}
                </Button>
              </Stack>
            )}

            {application.status === 'rejected' && (
              <Stack gap="sm" w="100%">
                {application.rejectionReason && (
                  <Box
                    style={{
                      borderRadius: 12,
                      border: '1px solid var(--mantine-color-red-4)',
                      padding: '12px 16px',
                    }}
                  >
                    <Text size="xs" fw={600} c="red" mb={4}>
                      {t('reason', 'Reason')}
                    </Text>
                    <Text size="sm">{application.rejectionReason}</Text>
                  </Box>
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
      </Stack>
    </Center>
  );
}
