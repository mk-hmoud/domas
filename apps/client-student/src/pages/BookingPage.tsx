import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import {
  IconBed,
  IconCalendar,
  IconCreditCard,
  IconDoor,
  IconFileDownload,
  IconHome2,
  IconInfoCircle,
  IconKey,
  IconReceipt,
} from '@tabler/icons-react';
import { BookingOpsStatus, PaymentStatus } from '@domas/ts-types';
import { portalBookings } from '@domas/api-client';
import { useCurrentBooking } from '../hooks/useCurrentBooking';
import { BookingStatusStepper } from '../components/BookingStatusStepper';
import { RoomShowcase } from '../components/RoomShowcase';

function usePaymentLabel() {
  const { t } = useTranslation();
  return (status: PaymentStatus): { label: string; color: string } => {
    switch (status) {
      case PaymentStatus.PAID:
        return { label: t('portal.payment_paid'), color: 'green' };
      case PaymentStatus.PARTIAL:
        return { label: t('portal.payment_partial'), color: 'orange' };
      case PaymentStatus.PENDING:
        return { label: t('portal.payment_pending'), color: 'red' };
      case PaymentStatus.FAILED:
        return { label: t('portal.payment_failed'), color: 'red' };
      case PaymentStatus.REFUNDED:
        return { label: t('portal.payment_refunded'), color: 'gray' };
      default:
        return { label: status, color: 'gray' };
    }
  };
}

export function BookingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const paymentLabel = usePaymentLabel();
  const { booking, isLoading } = useCurrentBooking();

  useEffect(() => {
    if (!isLoading && booking === null) {
      navigate('/apply', { replace: true });
    }
  }, [isLoading, booking, navigate]);

  if (isLoading || booking === null) {
    return (
      <Stack gap="lg">
        <Skeleton height={36} width={200} radius="md" />
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Skeleton height={320} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Stack gap="sm">
              <Skeleton height={40} radius="md" />
              <Skeleton height={180} radius="md" />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }

  const isActive = booking.status === BookingOpsStatus.ACTIVE;
  const isRejected = booking.status === BookingOpsStatus.REJECTED;
  const pmtInfo = paymentLabel(booking.paymentStatus);

  const statusBadgeLabel = isActive
    ? t('portal.status_active')
    : isRejected
      ? t('portal.status_not_approved')
      : booking.status === BookingOpsStatus.READY_FOR_CHECKIN ||
          booking.status === BookingOpsStatus.CONFIRMED
        ? t('portal.status_ready_checkin')
        : t('portal.status_under_review');

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3}>{t('portal.my_booking')}</Title>
        <Text size="sm" c="dimmed">
          {booking.semesterDisplayName}
        </Text>
      </Box>

      <Grid gutter="lg" align="flex-start">
        {/* Left — status stepper */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={700} size="sm">
                  {t('portal.application_status')}
                </Text>
                <Badge
                  color={isRejected ? 'red' : isActive ? 'green' : 'blue'}
                  variant="light"
                  radius="sm"
                >
                  {statusBadgeLabel}
                </Badge>
              </Group>
              <BookingStatusStepper status={booking.status} />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right — details via tabs */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Stack gap="md">
            {isRejected && (
              <Alert icon={<IconInfoCircle size={16} />} color="red" radius="md">
                {t('portal.application_rejected_message')}
              </Alert>
            )}

            {!isRejected && (
              <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
                <Tabs defaultValue="details" radius={0}>
                  <Tabs.List px="md" pt="xs">
                    <Tabs.Tab value="details" leftSection={<IconBed size={14} />}>
                      {t('portal.details_tab')}
                    </Tabs.Tab>
                    <Tabs.Tab value="room" leftSection={<IconHome2 size={14} />}>
                      {t('portal.room_tab', { defaultValue: 'Room' })}
                    </Tabs.Tab>
                    <Tabs.Tab value="financial" leftSection={<IconReceipt size={14} />}>
                      {t('portal.financial_tab')}
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* Details tab */}
                  <Tabs.Panel value="details" p="lg">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Stack gap="xs">
                        <Group gap="sm" align="flex-start">
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            variant="light"
                            color="blue"
                            style={{ flexShrink: 0 }}
                          >
                            <IconBed size={14} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              {t('portal.room_bed')}
                            </Text>
                            <Text size="sm" fw={500}>
                              {booking.roomName} —{' '}
                              {t('portal.bed_label', { label: booking.bedLabel })}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {booking.locationPath}
                            </Text>
                          </Box>
                        </Group>

                        <Group gap="sm" align="flex-start">
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            variant="light"
                            color="teal"
                            style={{ flexShrink: 0 }}
                          >
                            <IconCalendar size={14} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              {t('portal.period')}
                            </Text>
                            <Text size="sm">
                              {new Date(booking.startDate).toLocaleDateString()} –{' '}
                              {new Date(booking.endDate).toLocaleDateString()}
                            </Text>
                          </Box>
                        </Group>
                      </Stack>

                      <Stack gap="xs">
                        {isActive && booking.accessCardNumber && (
                          <Group gap="sm" align="flex-start">
                            <ThemeIcon
                              size={28}
                              radius="xl"
                              variant="light"
                              color="grape"
                              style={{ flexShrink: 0 }}
                            >
                              <IconKey size={14} />
                            </ThemeIcon>
                            <Box>
                              <Text size="xs" c="dimmed">
                                {t('portal.access_card')}
                              </Text>
                              <Text size="sm" fw={500}>
                                #{booking.accessCardNumber}
                              </Text>
                            </Box>
                          </Group>
                        )}

                        {booking.checkedInAt && (
                          <Group gap="sm" align="flex-start">
                            <ThemeIcon
                              size={28}
                              radius="xl"
                              variant="light"
                              color="green"
                              style={{ flexShrink: 0 }}
                            >
                              <IconDoor size={14} />
                            </ThemeIcon>
                            <Box>
                              <Text size="xs" c="dimmed">
                                {t('portal.checked_in_label')}
                              </Text>
                              <Text size="sm">
                                {new Date(booking.checkedInAt).toLocaleDateString()}
                              </Text>
                            </Box>
                          </Group>
                        )}

                        {booking.checkedOutAt && (
                          <Alert icon={<IconDoor size={14} />} color="gray" radius="md" p="xs">
                            <Text size="xs">
                              {t('portal.checked_out_label', {
                                date: new Date(booking.checkedOutAt).toLocaleDateString(),
                              })}
                            </Text>
                          </Alert>
                        )}
                      </Stack>
                    </SimpleGrid>
                  </Tabs.Panel>

                  {/* Room tab */}
                  <Tabs.Panel value="room" p="lg">
                    <RoomShowcase booking={booking} />
                  </Tabs.Panel>

                  {/* Financial tab */}
                  <Tabs.Panel value="financial" p="lg">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Group gap="xs">
                          <ThemeIcon size={24} radius="xl" variant="light" color={pmtInfo.color}>
                            <IconCreditCard size={12} />
                          </ThemeIcon>
                          <Text fw={600} size="sm">
                            {t('portal.payment_status')}
                          </Text>
                        </Group>
                        <Badge color={pmtInfo.color} variant="light" radius="sm">
                          {pmtInfo.label}
                        </Badge>
                      </Group>

                      <Divider />

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          {t('portal.deposit')}
                        </Text>
                        <Text size="sm" fw={500}>
                          {booking.depositAmountTry > 0
                            ? `₺${booking.depositAmountTry.toLocaleString()}`
                            : `${booking.depositAmountForeign} ${booking.foreignCurrencyCode}`}
                        </Text>
                      </Group>

                      {booking.paymentDeadlineDate && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">
                            {t('portal.payment_deadline')}
                          </Text>
                          <Text size="sm" c="orange">
                            {new Date(booking.paymentDeadlineDate).toLocaleDateString()}
                          </Text>
                        </Group>
                      )}

                      <Divider />

                      <Group gap="sm">
                        <Button
                          variant="subtle"
                          size="sm"
                          leftSection={<IconCreditCard size={14} />}
                          onClick={() => navigate('/financial')}
                        >
                          {t('portal.view_all_transactions')}
                        </Button>
                        {booking.contractSigned && (
                          <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconFileDownload size={14} />}
                            onClick={() => portalBookings.downloadContract(booking.id)}
                          >
                            {t('download_contract')}
                          </Button>
                        )}
                      </Group>
                    </Stack>
                  </Tabs.Panel>
                </Tabs>
              </Paper>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
