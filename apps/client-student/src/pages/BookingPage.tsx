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
  IconMapPin,
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
        <Skeleton height={100} radius="xl" />
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Skeleton height={340} radius="xl" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Stack gap="sm">
              <Skeleton height={44} radius="xl" />
              <Skeleton height={200} radius="xl" />
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

  const headerColor = isActive ? 'green' : isRejected ? 'red' : 'blue';
  const headerGradient = isActive
    ? 'linear-gradient(135deg, #2F9E44 0%, #37B24D 50%, #2B8A3E 100%)'
    : isRejected
      ? 'linear-gradient(135deg, #C92A2A 0%, #E03131 50%, #C92A2A 100%)'
      : 'linear-gradient(135deg, #1864AB 0%, #1971C2 45%, #0C8599 100%)';

  return (
    <Stack gap="lg">
      {/* Page hero */}
      <Paper
        radius="xl"
        style={{
          overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
        }}
      >
        <Box px="xl" py="lg" style={{ background: headerGradient }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box>
              <Text
                size="xs"
                c="white"
                fw={600}
                style={{
                  opacity: 0.75,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontSize: 11,
                  marginBottom: 4,
                }}
              >
                {t('portal.my_booking')}
              </Text>
              <Text fw={800} c="white" size="xl" lh={1.2}>
                {booking.roomName}
              </Text>
              <Group gap={4} mt={4}>
                <IconMapPin size={13} color="rgba(255,255,255,0.7)" />
                <Text size="xs" c="white" style={{ opacity: 0.8 }}>
                  {booking.locationPath} · {t('portal.bed_label', { label: booking.bedLabel })}
                </Text>
              </Group>
            </Box>
            <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
              <Badge
                color="white"
                variant="filled"
                size="lg"
                radius="xl"
                style={{ color: isRejected ? '#C92A2A' : isActive ? '#2F9E44' : '#1971C2' }}
              >
                {statusBadgeLabel}
              </Badge>
              <Text size="xs" c="white" style={{ opacity: 0.75 }}>
                {booking.semesterDisplayName}
              </Text>
            </Stack>
          </Group>
        </Box>
      </Paper>

      <Grid gutter="lg" align="flex-start">
        {/* Left — status stepper */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper
            radius="xl"
            p="lg"
            style={{
              border: `2px solid var(--mantine-color-${headerColor}-3)`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={700} size="sm">
                  {t('portal.application_status')}
                </Text>
                <Badge
                  color={isRejected ? 'red' : isActive ? 'green' : 'blue'}
                  variant="light"
                  radius="xl"
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
              <Alert icon={<IconInfoCircle size={16} />} color="red" radius="xl" variant="light">
                {t('portal.application_rejected_message')}
              </Alert>
            )}

            {!isRejected && (
              <Paper
                radius="xl"
                style={{
                  overflow: 'hidden',
                  border: '1px solid var(--mantine-color-default-border)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
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
                      <Stack gap="sm">
                        <Paper
                          radius="lg"
                          p="sm"
                          style={{
                            background: 'var(--mantine-color-blue-light)',
                            border: '1px solid var(--mantine-color-blue-2)',
                          }}
                        >
                          <Group gap="sm" align="flex-start" wrap="nowrap">
                            <ThemeIcon
                              size={30}
                              radius="md"
                              variant="light"
                              color="blue"
                              style={{ flexShrink: 0 }}
                            >
                              <IconBed size={15} />
                            </ThemeIcon>
                            <Box>
                              <Text size="xs" c="dimmed">
                                {t('portal.room_bed')}
                              </Text>
                              <Text size="sm" fw={600}>
                                {booking.roomName} —{' '}
                                {t('portal.bed_label', { label: booking.bedLabel })}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {booking.locationPath}
                              </Text>
                            </Box>
                          </Group>
                        </Paper>

                        <Paper
                          radius="lg"
                          p="sm"
                          style={{
                            background: 'var(--mantine-color-teal-light)',
                            border: '1px solid var(--mantine-color-teal-2)',
                          }}
                        >
                          <Group gap="sm" align="flex-start" wrap="nowrap">
                            <ThemeIcon
                              size={30}
                              radius="md"
                              variant="light"
                              color="teal"
                              style={{ flexShrink: 0 }}
                            >
                              <IconCalendar size={15} />
                            </ThemeIcon>
                            <Box>
                              <Text size="xs" c="dimmed">
                                {t('portal.period')}
                              </Text>
                              <Text size="sm" fw={500}>
                                {new Date(booking.startDate).toLocaleDateString()} –{' '}
                                {new Date(booking.endDate).toLocaleDateString()}
                              </Text>
                            </Box>
                          </Group>
                        </Paper>
                      </Stack>

                      <Stack gap="sm">
                        {isActive && booking.accessCardNumber && (
                          <Paper
                            radius="lg"
                            p="sm"
                            style={{
                              background: 'var(--mantine-color-grape-light)',
                              border: '1px solid var(--mantine-color-grape-2)',
                            }}
                          >
                            <Group gap="sm" align="flex-start" wrap="nowrap">
                              <ThemeIcon
                                size={30}
                                radius="md"
                                variant="light"
                                color="grape"
                                style={{ flexShrink: 0 }}
                              >
                                <IconKey size={15} />
                              </ThemeIcon>
                              <Box>
                                <Text size="xs" c="dimmed">
                                  {t('portal.access_card')}
                                </Text>
                                <Text size="sm" fw={600}>
                                  #{booking.accessCardNumber}
                                </Text>
                              </Box>
                            </Group>
                          </Paper>
                        )}

                        {booking.checkedInAt && (
                          <Paper
                            radius="lg"
                            p="sm"
                            style={{
                              background: 'var(--mantine-color-green-light)',
                              border: '1px solid var(--mantine-color-green-2)',
                            }}
                          >
                            <Group gap="sm" align="flex-start" wrap="nowrap">
                              <ThemeIcon
                                size={30}
                                radius="md"
                                variant="light"
                                color="green"
                                style={{ flexShrink: 0 }}
                              >
                                <IconDoor size={15} />
                              </ThemeIcon>
                              <Box>
                                <Text size="xs" c="dimmed">
                                  {t('portal.checked_in_label')}
                                </Text>
                                <Text size="sm" fw={500}>
                                  {new Date(booking.checkedInAt).toLocaleDateString()}
                                </Text>
                              </Box>
                            </Group>
                          </Paper>
                        )}

                        {booking.checkedOutAt && (
                          <Alert icon={<IconDoor size={14} />} color="gray" radius="lg" p="sm">
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
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Group gap="sm" wrap="nowrap">
                          <ThemeIcon size={28} radius="md" variant="light" color={pmtInfo.color}>
                            <IconCreditCard size={14} />
                          </ThemeIcon>
                          <Text fw={600} size="sm">
                            {t('portal.payment_status')}
                          </Text>
                        </Group>
                        <Badge color={pmtInfo.color} variant="filled" radius="xl">
                          {pmtInfo.label}
                        </Badge>
                      </Group>

                      <Divider />

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          {t('portal.deposit')}
                        </Text>
                        <Text size="sm" fw={600}>
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
                          <Text size="sm" fw={600} c="orange">
                            {new Date(booking.paymentDeadlineDate).toLocaleDateString()}
                          </Text>
                        </Group>
                      )}

                      <Divider />

                      <Group gap="sm" wrap="wrap">
                        <Button
                          variant="light"
                          size="sm"
                          leftSection={<IconCreditCard size={14} />}
                          onClick={() => navigate('/financial')}
                          radius="xl"
                        >
                          {t('portal.view_all_transactions')}
                        </Button>
                        {booking.contractSigned && (
                          <Button
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'cyan' }}
                            size="sm"
                            leftSection={<IconFileDownload size={14} />}
                            onClick={() => portalBookings.downloadContract(booking.id)}
                            radius="xl"
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
