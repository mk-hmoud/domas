import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@tabler/icons-react';
import {
  BookingOpsStatus,
  PaymentStatus,
  PortalSemester,
  StudentCurrentBooking,
} from '@domas/ts-types';
import { portalBookings, portalNotifications, portalSemesters } from '@domas/api-client';
import { StudentNotification } from '@domas/ts-types';
import { BookingStatusStepper } from '../components/BookingStatusStepper';
import { useStudentAuth } from '../contexts/StudentAuthContext';

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(status: BookingOpsStatus): string {
  switch (status) {
    case BookingOpsStatus.PENDING_ACCOUNTING:
      return 'Under Review';
    case BookingOpsStatus.READY_FOR_CHECKIN:
    case BookingOpsStatus.CONFIRMED:
      return 'Ready for Check-In';
    case BookingOpsStatus.ACTIVE:
      return 'Active';
    case BookingOpsStatus.REJECTED:
      return 'Not Approved';
    default:
      return status;
  }
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
  const paymentPending =
    booking.paymentStatus === PaymentStatus.PENDING ||
    booking.paymentStatus === PaymentStatus.PARTIAL;

  const daysRemaining = Math.ceil(
    (new Date(booking.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const stats = [
    {
      label: 'Status',
      value: statusLabel(booking.status),
      color: statusColor(booking.status),
      icon: IconDoor,
      onClick: () => navigate('/booking'),
    },
    {
      label: 'Payment',
      value: paymentPending ? 'Pending' : 'Paid',
      color: paymentPending ? 'orange' : 'green',
      icon: IconCreditCard,
      onClick: () => navigate('/financial'),
    },
    {
      label: 'Room',
      value: `${booking.roomName} · Bed ${booking.bedLabel}`,
      color: 'blue',
      icon: IconBed,
      onClick: () => navigate('/booking'),
    },
    ...(booking.accessCardNumber
      ? [
          {
            label: 'Access Card',
            value: `#${booking.accessCardNumber}`,
            color: 'grape',
            icon: IconKey,
            onClick: () => navigate('/booking'),
          },
        ]
      : daysRemaining > 0
        ? [
            {
              label: 'Days Remaining',
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
  if (semesters.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl">
        <Stack align="center" gap="xs" py="md">
          <ThemeIcon size={52} radius="xl" variant="light" color="gray">
            <IconBed size={26} />
          </ThemeIcon>
          <Text fw={500} size="lg">
            No open semesters
          </Text>
          <Text size="sm" c="dimmed" ta="center" maw={360}>
            There are no accommodation periods currently open for applications. Check back later.
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
            Accommodation applications are open
          </Text>
          <Stack gap={4} mb="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={110}>
                Semester period:
              </Text>
              <Text size="sm">
                {new Date(next.startDate).toLocaleDateString()} –{' '}
                {new Date(next.endDate).toLocaleDateString()}
              </Text>
            </Group>
            {next.bookingEndDate && (
              <Group gap="xs">
                <Text size="sm" c="dimmed" w={110}>
                  Apply by:
                </Text>
                <Text size="sm" fw={500} c="orange">
                  {new Date(next.bookingEndDate).toLocaleDateString()}
                </Text>
              </Group>
            )}
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={110}>
                Deposit:
              </Text>
              <Text size="sm">
                {next.depositAmountTry > 0
                  ? `₺${next.depositAmountTry.toLocaleString()}`
                  : `${next.depositAmountForeign} ${next.foreignCurrencyCode}`}
              </Text>
            </Group>
          </Stack>
          <Button leftSection={<IconCalendarPlus size={16} />} onClick={onApply}>
            Apply Now
          </Button>
        </Box>
      </Group>
    </Paper>
  );
}

// ─── State B — Pending booking ────────────────────────────────────────────────

function PendingBookingCard({ booking }: { booking: StudentCurrentBooking }) {
  return (
    <Paper withBorder radius="md" p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text fw={700} size="lg">
              Your Application
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
              Your application was not approved. Please contact the dormitory office for more
              information.
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
                Your accommodation is approved. Present yourself at the dormitory office to check
                in.
              </Text>
            </Group>
          </Paper>
        )}

        <Group gap="xs">
          <ThemeIcon variant="transparent" size="sm" c="dimmed">
            <IconBed size={14} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            {booking.locationPath} — {booking.roomName}, Bed {booking.bedLabel}
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
  return (
    <Paper withBorder radius="md" p="xl" style={{ borderColor: 'var(--mantine-color-green-4)' }}>
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon size={48} radius="xl" variant="light" color="green">
            <IconDoor size={24} />
          </ThemeIcon>
          <Box>
            <Text fw={700} size="lg">
              You are checked in
            </Text>
            <Text size="sm" c="dimmed">
              {booking.semesterDisplayName}
            </Text>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              Location:
            </Text>
            <Text size="sm" fw={500}>
              {booking.locationPath}
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              Room / Bed:
            </Text>
            <Text size="sm" fw={500}>
              {booking.roomName}, Bed {booking.bedLabel}
            </Text>
          </Group>
          {booking.accessCardNumber && (
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={90}>
                Access card:
              </Text>
              <Text size="sm" fw={500}>
                #{booking.accessCardNumber}
              </Text>
            </Group>
          )}
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              Check-in:
            </Text>
            <Text size="sm">
              {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleDateString() : '—'}
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={90}>
              Semester end:
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
            View Full Details
          </Button>
          {booking.contractSigned && (
            <Button
              variant="subtle"
              leftSection={<IconFileDownload size={16} />}
              onClick={() => portalBookings.downloadContract(booking.id)}
            >
              Contract
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationsPanel({ limit = 5 }: { limit?: number }) {
  const navigate = useNavigate();
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
          Recent Notifications
        </Text>
        <Text
          size="xs"
          c="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/notifications')}
        >
          View all
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
              No notifications yet
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
        <Title order={3}>Hello, {student?.firstName ?? 'Student'} 👋</Title>
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
              <NotificationsPanel limit={6} />
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  );
}
