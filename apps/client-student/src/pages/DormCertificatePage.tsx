import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
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
  Title,
} from '@domas/ui';
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconFileDescription,
  IconFilePlus,
  IconLock,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { portalDormCertificates } from '@domas/api-client';
import { DormCertificateEligibility, DormCertificateRequest } from '@domas/ts-types';
import { notifications } from '@mantine/notifications';

const STATUS_COLOR: Record<string, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

export function DormCertificatePage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [eligibility, setEligibility] = useState<DormCertificateEligibility | null>(null);
  const [requests, setRequests] = useState<DormCertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [requesting, setRequesting] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [elig, reqs] = await Promise.all([
        portalDormCertificates.getEligibility(),
        portalDormCertificates.getMyRequests(),
      ]);
      setEligibility(elig);
      setRequests(reqs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasPendingRequest = requests.some((r) => r.status === 'pending');

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await portalDormCertificates.request(certFile ?? undefined, expiryDate ?? undefined);
      notifications.show({
        title: t('success'),
        message: t('portal.dorm_cert_requested', 'Dorm certificate request submitted.'),
        color: 'green',
      });
      setCertFile(null);
      setExpiryDate(null);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      notifications.show({
        title: t('error'),
        message: Array.isArray(msg) ? msg.join(', ') : (msg ?? t('action_failed', 'Action failed')),
        color: 'red',
      });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="xl" />
      </Center>
    );
  }

  const needsCert = eligibility?.reason === 'no_valid_certificate';
  const isPending = eligibility?.reason === 'account_pending';
  const canRequest = eligibility?.eligible && !hasPendingRequest;
  const canRequestWithCert = needsCert && !hasPendingRequest;

  return (
    <Stack gap="lg">
      <Title order={3} fw={800}>
        {t('portal.dorm_certificate_title', 'Dormitory Residency Certificate')}
      </Title>

      {/* Eligibility / status card */}
      {isPending ? (
        <Alert icon={<IconLock size={16} />} color="yellow" variant="light" radius="xl">
          {t(
            'portal.dorm_cert_blocked_pending',
            'Your account is pending approval. Dorm certificates can be requested once your registration is approved.',
          )}
        </Alert>
      ) : hasPendingRequest ? (
        <Alert icon={<IconClock size={16} />} color="blue" variant="light" radius="xl">
          {t(
            'portal.dorm_cert_pending_review',
            'Your request is currently under review. You will be notified once the certificate is ready.',
          )}
        </Alert>
      ) : (
        <Paper
          radius="xl"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-default-border)' }}
        >
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon
                size={44}
                radius="xl"
                variant="light"
                color={eligibility?.eligible ? 'teal' : 'orange'}
              >
                {eligibility?.eligible ? <IconCheck size={22} /> : <IconAlertCircle size={22} />}
              </ThemeIcon>
              <Box>
                <Text fw={700}>
                  {eligibility?.eligible
                    ? t('portal.dorm_cert_eligible', 'You can request a dorm certificate')
                    : t('portal.dorm_cert_needs_cert', 'Student certificate required')}
                </Text>
                {eligibility?.validCert && (
                  <Text size="xs" c="dimmed">
                    {t('portal.dorm_cert_valid_until', 'Valid certificate on file')}{' '}
                    {eligibility.validCert.expiryDate
                      ? `— ${t('portal.expires', 'expires')} ${new Date(eligibility.validCert.expiryDate).toLocaleDateString()}`
                      : ''}
                  </Text>
                )}
                {needsCert && (
                  <Text size="xs" c="dimmed">
                    {t(
                      'portal.dorm_cert_no_cert_hint',
                      'Upload a current student certificate to proceed.',
                    )}
                  </Text>
                )}
              </Box>
            </Group>

            {/* If needs cert, show cert upload inline */}
            {canRequestWithCert && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCertFile(f);
                    e.target.value = '';
                  }}
                />

                {certFile ? (
                  <Box
                    style={{
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
                            {certFile.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({(certFile.size / 1024).toFixed(0)} KB)
                          </Text>
                        </Group>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="red"
                          onClick={() => setCertFile(null)}
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
                    </Stack>
                  </Box>
                ) : (
                  <Button
                    variant="light"
                    radius="lg"
                    leftSection={<IconUpload size={16} />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('portal.upload_student_cert', 'Upload Student Certificate')}
                  </Button>
                )}
              </>
            )}

            <Button
              leftSection={<IconFilePlus size={16} />}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'teal', to: 'cyan' }}
              disabled={
                isPending ||
                hasPendingRequest ||
                (!eligibility?.eligible && !canRequestWithCert) ||
                (canRequestWithCert && !certFile)
              }
              loading={requesting}
              onClick={handleRequest}
            >
              {t('portal.request_dorm_cert', 'Request Dorm Certificate')}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <Stack gap="sm">
          <Text fw={700} size="sm">
            {t('portal.dorm_cert_history', 'Request History')}
          </Text>

          {requests.map((req) => (
            <Paper
              key={req.id}
              radius="xl"
              p="md"
              style={{ border: '1px solid var(--mantine-color-default-border)' }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Group gap="xs">
                    <Badge
                      color={STATUS_COLOR[req.status] ?? 'gray'}
                      variant="light"
                      radius="xl"
                      size="sm"
                    >
                      {t(`portal.dorm_cert_status_${req.status}`, req.status)}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </Text>
                  </Group>
                  {req.rejectionReason && (
                    <Text size="xs" c="red">
                      {req.rejectionReason}
                    </Text>
                  )}
                </Stack>

                {req.status === 'approved' && req.certificateUrl && (
                  <Button
                    size="compact-sm"
                    variant="light"
                    color="teal"
                    radius="xl"
                    leftSection={<IconFileDescription size={14} />}
                    component="a"
                    href={req.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('portal.download_cert', 'Download')}
                  </Button>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
