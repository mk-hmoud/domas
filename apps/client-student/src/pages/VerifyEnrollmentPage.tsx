import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Center,
  DatePickerInput,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@domas/ui';
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconFileDescription,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { portalEnrollment } from '@domas/api-client';
import { EnrollmentStatus } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';

export function VerifyEnrollmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<EnrollmentStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const s = await portalEnrollment.getStatus();
      // If student has active booking or cert is verified, redirect away
      if (s.hasActiveBooking || s.enrollmentVerified) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setStatus(s);
    } catch {
      // keep showing the page
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setSelectedFile(file);
  };

  const handleSubmitCert = async () => {
    if (!selectedFile) return;

    const expiryDateStr = expiryDate ?? undefined;

    setUploading(true);
    try {
      await portalEnrollment.uploadCertificate(selectedFile, expiryDateStr);
      notifications.show({
        title: t('portal.cert_uploaded_title', 'Certificate submitted'),
        message: t(
          'portal.cert_uploaded_body',
          'Your certificate has been submitted and is under review.',
        ),
        color: 'green',
      });
      setSelectedFile(null);
      setExpiryDate(null);
      await fetchStatus();
    } catch {
      notifications.show({
        title: t('error'),
        message: t('action_failed', 'Action failed'),
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loadingStatus) {
    return (
      <Center h="100dvh">
        <Loader size="xl" />
      </Center>
    );
  }

  const cert = status?.latestCert;
  const isPending = cert?.status === 'pending';
  const isRejected = cert?.status === 'rejected';
  const showUpload = !cert || isRejected;

  return (
    <Center h="100dvh" p="md">
      <Paper
        radius="xl"
        p="xl"
        style={{
          width: '100%',
          maxWidth: 480,
          border: '1px solid var(--mantine-color-default-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <Stack gap="lg" align="center">
          {/* Icon */}
          <ThemeIcon size={64} radius="xl" variant="light" color={isPending ? 'yellow' : 'blue'}>
            {isPending ? <IconClock size={32} /> : <IconFileDescription size={32} />}
          </ThemeIcon>

          {/* Title */}
          <Stack gap={4} align="center">
            <Text fw={800} size="xl" ta="center">
              {isPending
                ? t('portal.cert_pending_title', 'Under Review')
                : t('portal.cert_required_title', 'Enrollment Verification Required')}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {isPending
                ? t(
                    'portal.cert_pending_body',
                    'Your certificate has been submitted. You will gain access once a staff member verifies it.',
                  )
                : t(
                    'portal.cert_required_body',
                    'As a returning student, you need to submit your current enrollment certificate to continue using the portal.',
                  )}
            </Text>
          </Stack>

          {/* Rejection alert */}
          {isRejected && cert?.rejectionReason && (
            <Alert
              icon={<IconX size={16} />}
              color="red"
              variant="light"
              radius="lg"
              style={{ width: '100%' }}
            >
              <Text size="sm" fw={500}>
                {t('portal.cert_rejected_title', 'Previous submission rejected')}
              </Text>
              <Text size="xs" mt={4}>
                {cert.rejectionReason}
              </Text>
            </Alert>
          )}

          {/* Pending status card */}
          {isPending && cert && (
            <Box
              style={{
                width: '100%',
                borderRadius: 12,
                background: 'var(--mantine-color-yellow-light)',
                border: '1px solid var(--mantine-color-yellow-3)',
                padding: '12px 16px',
              }}
            >
              <Group gap="sm">
                <IconClock size={16} />
                <Stack gap={0}>
                  <Text size="xs" fw={600}>
                    {cert.filename}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('portal.submitted_at', 'Submitted')}{' '}
                    {new Date(cert.uploadedAt).toLocaleDateString()}
                  </Text>
                </Stack>
              </Group>
            </Box>
          )}

          {/* Upload section */}
          {showUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <Box
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid var(--mantine-color-default-border)',
                    padding: '12px 16px',
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs">
                        <IconFileDescription size={16} />
                        <Text size="sm" fw={500} truncate>
                          {selectedFile.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </Text>
                      </Group>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        onClick={() => setSelectedFile(null)}
                      >
                        <IconX size={14} />
                      </Button>
                    </Group>
                    <DatePickerInput
                      label={t('portal.certificate_expiry', 'Certificate Expiry Date')}
                      placeholder={t('portal.cert_expiry_placeholder', 'Leave blank if unknown')}
                      radius="lg"
                      valueFormat="DD/MM/YYYY"
                      value={expiryDate}
                      onChange={setExpiryDate}
                      minDate={new Date()}
                      clearable
                    />
                    <Button
                      loading={uploading}
                      radius="xl"
                      size="md"
                      variant="gradient"
                      gradient={{ from: 'blue', to: 'cyan' }}
                      onClick={handleSubmitCert}
                      style={{ alignSelf: 'stretch' }}
                    >
                      {t('portal.submit_certificate', 'Submit Certificate')}
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Button
                  leftSection={<IconUpload size={16} />}
                  radius="xl"
                  size="md"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ alignSelf: 'stretch' }}
                >
                  {isRejected
                    ? t('portal.resubmit_certificate', 'Resubmit Certificate')
                    : t('portal.upload_certificate', 'Upload Student Certificate')}
                </Button>
              )}
              <Text size="xs" c="dimmed" ta="center">
                {t('portal.cert_formats', 'Accepted formats: PDF, JPEG, PNG, WebP — max 10 MB')}
              </Text>
            </>
          )}

          {/* Verified (shouldn't be visible but just in case) */}
          {cert?.status === 'verified' && (
            <Alert
              icon={<IconCheck size={16} />}
              color="green"
              variant="light"
              radius="lg"
              style={{ width: '100%' }}
            >
              {t('portal.cert_verified', 'Your enrollment has been verified.')}
            </Alert>
          )}

          {/* Alert icon only below icon row */}
          {!isPending && !cert && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="blue"
              variant="light"
              radius="lg"
              style={{ width: '100%' }}
            >
              {t(
                'portal.cert_hint',
                'You can obtain this certificate from your university registrar. It must confirm your current enrollment.',
              )}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
