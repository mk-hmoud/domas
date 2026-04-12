import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@domas/ui';
import {
  IconBell,
  IconBed,
  IconCalendarPlus,
  IconCheck,
  IconCreditCard,
  IconDoor,
  IconFileDownload,
  IconKey,
  IconPin,
} from '@tabler/icons-react';
import {
  Announcement,
  BookingOpsStatus,
  PaymentStatus,
  PortalSemester,
  StudentCurrentBooking,
} from '@domas/ts-types';
import {
  portalAnnouncements,
  portalBookings,
  portalNotifications,
  portalSemesters,
} from '@domas/api-client';
import { StudentNotification } from '@domas/ts-types';
import { BookingStatusStepper } from '../components/BookingStatusStepper';
import { useStudentAuth } from '../contexts/StudentAuthContext';

// ─── Status helpers ───────────────────────────────────────────────────────────

function useStatusLabel() {
  const { t } = useTranslation();
  return (status: BookingOpsStatus): string => {
    switch (status) {
      case BookingOpsStatus.PENDING_ACCOUNTING:
        return t('portal.status_under_review');
      case BookingOpsStatus.READY_FOR_CHECKIN:
      case BookingOpsStatus.CONFIRMED:
        return t('portal.status_ready_checkin');
      case BookingOpsStatus.ACTIVE:
        return t('portal.status_active');
      case BookingOpsStatus.REJECTED:
        return t('portal.status_not_approved');
      default:
        return status;
    }
  };
}

function statusColor(status: BookingOpsStatus): string {
  switch (status) {
    case BookingOpsStatus.ACTIVE:
      return 'green';
    case BookingOpsStatus.REJECTED:
      return 'red';
    case BookingOpsStatus.READY_FOR_CHECKIN:
    case BookingOpsStatus.CONFIRMED:
      return 'teal';
    default:
      return 'blue';
  }
}

// ─── Stats band — shown when a booking exists ─────────────────────────────────

function StatsBand({ booking }: { booking: StudentCurrentBooking }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  const paymentPending =
    booking.paymentStatus === PaymentStatus.PENDING ||
    booking.paymentStatus === PaymentStatus.PARTIAL;

  const daysRemaining = Math.ceil(
    (new Date(booking.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const stats = [
    {
      label: t('portal.stat_status'),
      value: statusLabel(booking.status),
      color: statusColor(booking.status),
      icon: IconDoor,
      onClick: () => navigate('/booking'),
    },
    {
      label: t('portal.stat_payment'),
      value: paymentPending ? t('portal.payment_pending') : t('portal.payment_paid'),
      color: paymentPending ? 'orange' : 'green',
      icon: IconCreditCard,
      onClick: () => navigate('/financial'),
    },
    {
      label: t('portal.stat_room'),
      value: `${booking.roomName} · ${t('portal.bed_label', { label: booking.bedLabel })}`,
      color: 'blue',
      icon: IconBed,
      onClick: () => navigate('/booking'),
    },
    ...(booking.accessCardNumber
      ? [
          {
            label: t('portal.stat_access_card'),
            value: `#${booking.accessCardNumber}`,
            color: 'grape',
            icon: IconKey,
            onClick: () => navigate('/booking'),
          },
        ]
      : daysRemaining > 0
        ? [
            {
              label: t('portal.stat_days_remaining'),
              value: String(daysRemaining),
              color: daysRemaining < 30 ? 'orange' : 'teal',
              icon: IconCalendarPlus,
              onClick: () => navigate('/booking'),
            },
          ]
        : []),
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
      {stats.map((s) => (
        <Card
          key={s.label}
          withBorder
          radius="md"
          p="sm"
          style={{ cursor: 'pointer' }}
          onClick={s.onClick}
        >
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon
              size={32}
              radius="xl"
              variant="light"
              color={s.color}
              style={{ flexShrink: 0 }}
            >
              <s.icon size={16} />
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" truncate>
                {s.label}
              </Text>
              <Text size="sm" fw={600} c={s.color} truncate>
                {s.value}
              </Text>
            </Box>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
}

// ─── State A — No booking ─────────────────────────────────────────────────────

function NoBookingCard({
  semesters,
  onApply,
}: {
  semesters: PortalSemester[];
  onApply: () => void;
}) {
  const { t } = useTranslation();

  if (semesters.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl">
        <Stack align="center" gap="xs" py="md">
          <ThemeIcon size={52} radius="xl" variant="light" color="gray">
            <IconBed size={26} />
          </ThemeIcon>
          <Text fw={500} size="lg">
            {t('portal.no_open_semesters')}
          </Text>
          <Text size="sm" c="dimmed" ta="center" maw={360}>
            {t('portal.no_semesters_description')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  const next = semesters[0];
  return (
    <Paper withBorder radius="md" p="xl" style={{ borderColor: 'var(--mantine-color-blue-4)' }}>
      <Group gap="lg" align="flex-start" wrap="nowrap">
        <ThemeIcon size={52} radius="xl" variant="light" color="blue" style={{ flexShrink: 0 }}>
          <IconCalendarPlus size={26} />
        </ThemeIcon>
        <Box style={{ flex: 1 }}>
          <Text fw={700} size="lg" mb={4}>
            {next.displayName}
          </Text>
          <Text size="sm" c="dimmed" mb="sm">
            {t('portal.applications_open')}
          </Text>
          <Stack gap={4} mb="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={110}>
                {t('portal.semester_period')}
              </Text>
              <Text size="sm">
                {new Date(next.startDate).toLocaleDateString()} –{' '}
                {new Date(next.endDate).toLocaleDateString()}
              </Text>
            </Group>
            {next.bookingEndDate && (
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={110}>
                  {t('portal.apply_by')}
                </Text>
                <Text size="sm" fw={500} c="orange">
                  {new Date(next.bookingEndDate).toLocaleDateString()}
                </Text>
              </Group>
            )}
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={110}>
                {t('portal.deposit_label')}
              </Text>
              <Text size="sm">
                {next.depositAmountTry > 0
                  ? `₺${next.depositAmountTry.toLocaleString()}`
                  : `${next.depositAmountForeign} ${next.foreignCurrencyCode}`}
              </Text>
            </Group>
          </Stack>
          <Button leftSection={<IconCalendarPlus size={16} />} onClick={onApply}>
            {t('portal.apply_now')}
          </Button>
        </Box>
      </Group>
    </Paper>
  );
}

// ─── State B — Pending booking ────────────────────────────────────────────────

function PendingBookingCard({ booking }: { booking: StudentCurrentBooking }) {
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  return (
    <Paper withBorder radius="md" p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text fw={700} size="lg">
              {t('portal.your_application')}
            </Text>
            <Text size="sm" c="dimmed">
              {booking.semesterDisplayName}
            </Text>
          </Box>
          <Badge color={statusColor(booking.status)} variant="light" radius="sm" size="lg">
            {statusLabel(booking.status)}
          </Badge>
        </Group>

        {booking.status === BookingOpsStatus.REJECTED && (
          <Paper
            withBorder
            p="sm"
            radius="sm"
            style={{ background: 'var(--mantine-color-red-light)' }}
          >
            <Text size="sm" c="red">
              {t('portal.application_rejected_message')}
            </Text>
          </Paper>
        )}

        <BookingStatusStepper status={booking.status} />

        {(booking.status === BookingOpsStatus.READY_FOR_CHECKIN ||
          booking.status === BookingOpsStatus.CONFIRMED) && (
          <Paper
            withBorder
            p="sm"
            radius="sm"
            style={{ background: 'var(--mantine-color-teal-light)' }}
          >
            <Group gap="xs">
              <IconCheck size={16} color="var(--mantine-color-teal-filled)" />
              <Text size="sm" c="teal" fw={500}>
                {t('portal.application_approved_message')}
              </Text>
            </Group>
          </Paper>
        )}

        <Group gap="xs">
          <ThemeIcon variant="transparent" size="sm" c="dimmed">
            <IconBed size={14} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            {booking.locationPath} — {booking.roomName},{' '}
            {t('portal.bed_label', { label: booking.bedLabel })}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

// ─── State C — Active resident ────────────────────────────────────────────────

function ActiveResidentCard({
  booking,
  onViewBooking,
}: {
  booking: StudentCurrentBooking;
  onViewBooking: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Paper withBorder radius="md" p="xl" style={{ borderColor: 'var(--mantine-color-green-4)' }}>
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon size={48} radius="xl" variant="light" color="green">
            <IconDoor size={24} />
          </ThemeIcon>
          <Box>
            <Text fw={700} size="lg">
              {t('portal.active_resident_title')}
            </Text>
            <Text size="sm" c="dimmed">
              {booking.semesterDisplayName}
            </Text>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              {t('portal.location_label')}
            </Text>
            <Text size="sm" fw={500}>
              {booking.locationPath}
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              {t('portal.room_bed_label')}
            </Text>
            <Text size="sm" fw={500}>
              {booking.roomName}, {t('portal.bed_label', { label: booking.bedLabel })}
            </Text>
          </Group>
          {booking.accessCardNumber && (
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={90}>
                {t('portal.access_card_label')}
              </Text>
              <Text size="sm" fw={500}>
                #{booking.accessCardNumber}
              </Text>
            </Group>
          )}
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              {t('portal.check_in_date_label')}
            </Text>
            <Text size="sm">
              {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleDateString() : '—'}
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              {t('portal.semester_end_label')}
            </Text>
            <Text size="sm">{new Date(booking.endDate).toLocaleDateString()}</Text>
          </Group>
        </SimpleGrid>

        <Group gap="sm">
          <Button
            variant="light"
            color="green"
            leftSection={<IconDoor size={16} />}
            onClick={onViewBooking}
          >
            {t('portal.view_full_details')}
          </Button>
          {booking.contractSigned && (
            <Button
              variant="subtle"
              leftSection={<IconFileDownload size={16} />}
              onClick={() => portalBookings.downloadContract(booking.id)}
            >
              {t('portal.contract')}
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

// ─── Announcements panel ──────────────────────────────────────────────────────

function AnnouncementsPanel({ limit = 3 }: { limit?: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    portalAnnouncements
      .getAll()
      .then((all) => setItems(all.slice(0, limit)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  if (!isLoading && items.length === 0) return null;

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="sm">
          {t('portal.nav_announcements', { defaultValue: 'Announcements' })}
        </Text>
        <Text
          size="xs"
          c="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/announcements')}
        >
          {t('portal.view_all')}
        </Text>
      </Group>

      <Stack gap="xs">
        {isLoading ? (
          <>
            <Skeleton height={56} radius="sm" />
            <Skeleton height={56} radius="sm" />
          </>
        ) : (
          items.map((item) => (
            <Box
              key={item.id}
              p="xs"
              style={{
                borderRadius: 8,
                background: item.pinned ? 'var(--mantine-color-orange-light)' : undefined,
                borderLeft: item.pinned
                  ? '3px solid var(--mantine-color-orange-4)'
                  : '3px solid transparent',
              }}
            >
              <Group gap={4} mb={2}>
                {item.pinned && <IconPin size={11} color="var(--mantine-color-orange-filled)" />}
                <Text size="sm" fw={600} lineClamp={1}>
                  {item.title}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={2}>
                {item.body}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {item.createdByName && `${item.createdByName} · `}
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
              </Text>
            </Box>
          ))
        )}
      </Stack>
    </Paper>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationsPanel({ limit = 5 }: { limit?: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<StudentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    portalNotifications
      .getAll({ limit })
      .then(setItems)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  return (
    <Paper withBorder radius="md" p="md" style={{ height: '100%' }}>
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="sm">
          {t('portal.recent_notifications')}
        </Text>
        <Text
          size="xs"
          c="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/notifications')}
        >
          {t('portal.view_all')}
        </Text>
      </Group>

      <Stack gap="xs">
        {isLoading ? (
          <>
            <Skeleton height={56} radius="sm" />
            <Skeleton height={56} radius="sm" />
            <Skeleton height={56} radius="sm" />
          </>
        ) : items.length === 0 ? (
          <Box py="xl" style={{ textAlign: 'center' }}>
            <ThemeIcon size={36} radius="xl" variant="light" color="gray" mx="auto" mb="xs">
              <IconBell size={18} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {t('portal.no_notifications')}
            </Text>
          </Box>
        ) : (
          items.map((n) => (
            <Box
              key={n.id}
              p="xs"
              style={{
                borderRadius: 8,
                background: !n.readAt ? 'var(--mantine-color-blue-light)' : undefined,
                borderLeft: !n.readAt
                  ? '3px solid var(--mantine-color-blue-4)'
                  : '3px solid transparent',
              }}
            >
              <Text size="sm" fw={!n.readAt ? 600 : 400} lineClamp={1}>
                {n.title}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {n.body}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {new Date(n.createdAt).toLocaleString()}
              </Text>
            </Box>
          ))
        )}
      </Stack>
    </Paper>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { student } = useStudentAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [booking, setBooking] = useState<StudentCurrentBooking | null>(null);
  const [semesters, setSemesters] = useState<PortalSemester[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalBookings.getCurrent().catch(() => null),
      portalSemesters.getBookable().catch(() => []),
    ]).then(([b, s]) => {
      setBooking(b);
      setSemesters(s as PortalSemester[]);
      setIsLoading(false);
    });
  }, []);

  const isActive = booking?.status === BookingOpsStatus.ACTIVE;
  const hasPending =
    booking !== null &&
    ![
      BookingOpsStatus.CANCELLED,
      BookingOpsStatus.COMPLETED,
      BookingOpsStatus.TRANSFERRED,
    ].includes(booking.status);

  return (
    <Stack gap="lg">
      {/* Greeting */}
      <Box>
        <Title order={3}>
          {t('portal.greeting', { name: student?.firstName ?? t('student') })}
        </Title>
        <Text size="sm" c="dimmed">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Box>

      {isLoading ? (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
          </SimpleGrid>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Skeleton height={240} radius="md" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Skeleton height={240} radius="md" />
            </Grid.Col>
          </Grid>
        </>
      ) : (
        <>
          {/* Stats band — only when a booking exists */}
          {booking && <StatsBand booking={booking} />}

          {/* Main grid */}
          <Grid gutter="lg" align="flex-start">
            <Grid.Col span={{ base: 12, md: 7 }}>
              {isActive ? (
                <ActiveResidentCard booking={booking!} onViewBooking={() => navigate('/booking')} />
              ) : hasPending ? (
                <PendingBookingCard booking={booking!} />
              ) : (
                <NoBookingCard semesters={semesters} onApply={() => navigate('/apply')} />
              )}
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="lg">
                <AnnouncementsPanel limit={3} />
                <NotificationsPanel limit={5} />
              </Stack>
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  );
}
