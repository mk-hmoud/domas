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
  IconArrowsExchange,
  IconBed,
  IconCalendar,
  IconCalendarPlus,
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
import { PortalPageHeader } from '../components/PortalPageHeader';
import { BookingStatusStepper } from '../components/BookingStatusStepper';
import { RoomShowcase } from '../components/RoomShowcase';
import { RoomChangeTab } from '../components/RoomChangeTab';

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
  const { booking, isLoading, refetch } = useCurrentBooking();

  if (isLoading) {
    return (
      <Stack gap="lg">
        <Skeleton height={80} radius="lg" />
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

  if (booking === null) {
    return (
      <Stack gap="lg">
        <PortalPageHeader icon={IconBed} color="blue" title={t('portal.nav_my_room')} />
        <Paper
          radius="xl"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-default-border)', textAlign: 'center' }}
        >
          <Stack align="center" gap="md" py="lg">
            <ThemeIcon size={64} radius="xl" variant="light" color="blue">
              <IconBed size={32} />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="lg">
                {t('portal.no_booking_title', 'No active booking')}
              </Text>
              <Text size="sm" c="dimmed" mt={4} maw={360} mx="auto">
                {t(
                  'portal.no_booking_description',
                  "You don't have a current booking. Apply for a room to get started.",
                )}
              </Text>
            </Box>
            <Button
              leftSection={<IconCalendarPlus size={16} />}
              onClick={() => navigate('/apply')}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
            >
              {t('portal.apply_now')}
            </Button>
          </Stack>
        </Paper>
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

  const badgeColor = isActive ? 'green' : isRejected ? 'red' : 'blue';

  return (
    <Stack gap="lg">
      <PortalPageHeader
        icon={IconBed}
        color={badgeColor}
        title={booking.roomName}
        subtitle={`${booking.locationPath} · ${t('portal.bed_label', { label: booking.bedLabel })} · ${booking.semesterDisplayName}`}
        action={
          <Badge color={badgeColor} variant="light" size="lg" radius="xl">
            {statusBadgeLabel}
          </Badge>
        }
      />

      <Grid gutter="lg" align="flex-start">
        {/* Left — status stepper */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper radius="xl" p="lg" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={700} size="sm">
                  {t('portal.application_status')}
                </Text>
                <Badge color={badgeColor} variant="light" radius="xl">
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
              <Paper radius="xl" withBorder style={{ overflow: 'hidden' }}>
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
                    <Tabs.Tab value="room-change" leftSection={<IconArrowsExchange size={14} />}>
                      {t('portal.room_change_tab')}
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* Details tab */}
                  <Tabs.Panel value="details" p="lg">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                      <Paper radius="lg" p="sm" withBorder>
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

                      <Paper radius="lg" p="sm" withBorder>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                          <ThemeIcon
                            size={30}
                            radius="md"
                            variant="light"
                            color="blue"
                            style={{ flexShrink: 0 }}
                          >
                            <IconKey size={15} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              {t('portal.access_card')}
                            </Text>
                            {booking.accessCardNumber ? (
                              <Text size="sm" fw={600}>
                                #{booking.accessCardNumber}
                              </Text>
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Box>
                        </Group>
                      </Paper>

                      <Paper radius="lg" p="sm" withBorder>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                          <ThemeIcon
                            size={30}
                            radius="md"
                            variant="light"
                            color="blue"
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

                      <Paper radius="lg" p="sm" withBorder>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                          <ThemeIcon
                            size={30}
                            radius="md"
                            variant="light"
                            color="blue"
                            style={{ flexShrink: 0 }}
                          >
                            <IconDoor size={15} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              {t('portal.checked_in_label')}
                            </Text>
                            {booking.checkedInAt ? (
                              <Text size="sm" fw={500}>
                                {new Date(booking.checkedInAt).toLocaleDateString()}
                              </Text>
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Box>
                        </Group>
                      </Paper>
                    </SimpleGrid>

                    {booking.checkedOutAt && (
                      <Alert icon={<IconDoor size={14} />} color="gray" radius="lg" p="sm" mt="sm">
                        <Text size="xs">
                          {t('portal.checked_out_label', {
                            date: new Date(booking.checkedOutAt).toLocaleDateString(),
                          })}
                        </Text>
                      </Alert>
                    )}
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
                        <Badge color={pmtInfo.color} variant="light" radius="xl">
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
                            variant="filled"
                            color="blue"
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
                  {/* Room Change tab */}
                  <Tabs.Panel value="room-change" p="lg">
                    <RoomChangeTab booking={booking} onRefetch={refetch} />
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
