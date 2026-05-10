import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@domas/ui';
import { IconArrowsExchange, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { StudentCurrentBooking, StudentRoomChangeView } from '@domas/ts-types';
import { portalRoomChanges } from '@domas/api-client';
import { notifications } from '@mantine/notifications';
import { RoomChangeBedModal } from './RoomChangeBedModal';

interface Props {
  booking: StudentCurrentBooking;
  onRefetch: () => void;
}

export function RoomChangeTab({ booking, onRefetch }: Props) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<StudentRoomChangeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    portalRoomChanges
      .getAll()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const pendingRequest =
    requests.find((r) => r.status === 'pending' || r.status === 'pending_payment') ?? null;
  const history = requests.filter((r) => r.status !== 'pending' && r.status !== 'pending_payment');

  const { roomChangesCount, maxRoomChanges } = booking;
  const atLimit = maxRoomChanges !== null && roomChangesCount >= maxRoomChanges;
  const canRequest = !pendingRequest && !atLimit;

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await portalRoomChanges.cancel(id);
      notifications.show({
        message: t('portal.room_change_cancelled'),
        color: 'green',
      });
      fetchRequests();
      onRefetch();
    } catch {
      notifications.show({
        message: t('portal.room_change_cancel_error'),
        color: 'red',
      });
    } finally {
      setCancelling(null);
    }
  };

  const handleSuccess = () => {
    notifications.show({
      message: t('portal.room_change_submitted'),
      color: 'green',
    });
    fetchRequests();
    onRefetch();
  };

  return (
    <>
      <Stack gap="md">
        {/* Quota */}
        <Paper
          radius="lg"
          p="sm"
          style={{
            background: atLimit
              ? 'var(--mantine-color-red-light)'
              : 'var(--mantine-color-blue-light)',
            border: `1px solid ${atLimit ? 'var(--mantine-color-red-3)' : 'var(--mantine-color-blue-3)'}`,
          }}
        >
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={28} radius="md" variant="light" color={atLimit ? 'red' : 'blue'}>
              <IconArrowsExchange size={15} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed">
                {t('portal.room_change_quota_label')}
              </Text>
              <Text size="sm" fw={600}>
                {maxRoomChanges === null
                  ? t('portal.room_change_usage_unlimited')
                  : atLimit
                    ? t('portal.room_change_limit_reached')
                    : t('portal.room_change_usage_count', {
                        used: roomChangesCount,
                        max: maxRoomChanges,
                      })}
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Pending request */}
        {loading ? (
          <Group justify="center" py="sm">
            <Loader size="sm" />
          </Group>
        ) : pendingRequest ? (
          <Paper radius="lg" p="sm" withBorder>
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <ThemeIcon
                  size={28}
                  radius="md"
                  variant="light"
                  color={pendingRequest.status === 'pending_payment' ? 'blue' : 'yellow'}
                >
                  <IconClock size={15} />
                </ThemeIcon>
                <Box style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed">
                    {pendingRequest.status === 'pending_payment'
                      ? t('portal.room_change_pending_payment_title', {
                          defaultValue: 'Approved — Awaiting Payment',
                        })
                      : t('portal.room_change_pending_title')}
                  </Text>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {t('portal.bed_label', { label: pendingRequest.requestedBedLabel })}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {pendingRequest.requestedLocationPath}
                  </Text>
                  {pendingRequest.note && (
                    <Text size="xs" c="dimmed" mt={2}>
                      "{pendingRequest.note}"
                    </Text>
                  )}
                  {pendingRequest.status === 'pending_payment' && (
                    <Badge size="xs" color="orange" variant="light" mt={4}>
                      {t('portal.room_change_fee_label', {
                        defaultValue: `Fee: ${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: pendingRequest.paymentCurrency ?? 'TRY',
                        }).format(
                          pendingRequest.paymentAmount ?? 0,
                        )} — awaiting accounting confirmation`,
                      })}
                    </Badge>
                  )}
                </Box>
              </Group>
              {pendingRequest.status === 'pending' && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  loading={cancelling === pendingRequest.id}
                  onClick={() => handleCancel(pendingRequest.id)}
                >
                  {t('portal.room_change_cancel_request')}
                </Button>
              )}
            </Group>
          </Paper>
        ) : (
          <Button
            leftSection={<IconArrowsExchange size={16} />}
            onClick={() => setPickerOpen(true)}
            disabled={!canRequest}
            variant={canRequest ? 'gradient' : 'light'}
            gradient={{ from: 'blue', to: 'cyan' }}
            radius="xl"
          >
            {t('portal.room_change_request_btn')}
          </Button>
        )}

        {/* History */}
        {history.length > 0 && (
          <>
            <Divider
              label={<Text size="xs">{t('portal.room_change_history_title')}</Text>}
              labelPosition="left"
            />
            <Stack gap="xs">
              {history.map((req) => (
                <Paper key={req.id} radius="lg" p="sm" withBorder>
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      <ThemeIcon
                        size={26}
                        radius="md"
                        variant="light"
                        color={req.status === 'approved' ? 'green' : 'red'}
                      >
                        {req.status === 'approved' ? <IconCheck size={13} /> : <IconX size={13} />}
                      </ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="xs" fw={600} lineClamp={1}>
                          {t('portal.bed_label', { label: req.requestedBedLabel })}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {req.requestedLocationPath}
                        </Text>
                        {req.rejectionReason && (
                          <Text size="xs" c="red.7" mt={2}>
                            {req.rejectionReason}
                          </Text>
                        )}
                      </Box>
                    </Group>
                    <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
                      <Badge
                        size="xs"
                        color={req.status === 'approved' ? 'green' : 'red'}
                        variant="light"
                      >
                        {t(`portal.room_change_status_${req.status}`)}
                      </Badge>
                      {req.resolvedAt && (
                        <Text size="xs" c="dimmed">
                          {new Date(req.resolvedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </>
        )}

        {!loading && requests.length === 0 && (
          <Text size="sm" c="dimmed" ta="center">
            {t('portal.room_change_no_history')}
          </Text>
        )}
      </Stack>

      <RoomChangeBedModal
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        semesterId={booking.semesterId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
