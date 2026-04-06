import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
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
      return 'Approved — Ready for Check-In';
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
      <Paper withBorder radius="md" p="lg">
        <Stack align="center" gap="xs" py="md">
          <ThemeIcon size={48} radius="xl" variant="light" color="gray">
            <IconBed size={24} />
          </ThemeIcon>
          <Text fw={500}>No open semesters</Text>
          <Text size="sm" c="dimmed" ta="center">
            There are no accommodation periods currently open for applications. Check back later.
          </Text>
        </Stack>
      </Paper>
    );
  }

  const next = semesters[0];
  return (
    <Paper withBorder radius="md" p="lg" style={{ borderColor: 'var(--mantine-color-blue-4)' }}>
      <Stack gap="sm">
        <Group gap="sm">
          <ThemeIcon size={40} radius="xl" variant="light" color="blue">
            <IconCalendarPlus size={20} />
          </ThemeIcon>
          <Box>
            <Text fw={600}>{next.displayName}</Text>
            <Text size="xs" c="dimmed">
              Accommodation applications are open
            </Text>
          </Box>
        </Group>

        <Stack gap={4}>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Semester period:
            </Text>
            <Text size="sm">
              {new Date(next.startDate).toLocaleDateString()} –{' '}
              {new Date(next.endDate).toLocaleDateString()}
            </Text>
          </Group>
          {next.bookingEndDate && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Apply by:
              </Text>
              <Text size="sm" fw={500} c="orange">
                {new Date(next.bookingEndDate).toLocaleDateString()}
              </Text>
            </Group>
          )}
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Deposit:
            </Text>
            <Text size="sm">
              {next.depositAmountTry > 0
                ? `₺${next.depositAmountTry.toLocaleString()}`
                : `${next.depositAmountForeign} ${next.foreignCurrencyCode}`}
            </Text>
          </Group>
        </Stack>

        <Button leftSection={<IconCalendarPlus size={16} />} onClick={onApply} mt="xs">
          Apply Now
        </Button>
      </Stack>
    </Paper>
  );
}

// ─── State B — Pending booking ────────────────────────────────────────────────

function PendingBookingCard({ booking }: { booking: StudentCurrentBooking }) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text fw={600}>Your Application</Text>
            <Text size="xs" c="dimmed">
              {booking.semesterDisplayName}
            </Text>
          </Box>
          <Badge color={statusColor(booking.status)} variant="light" radius="sm">
            {statusLabel(booking.status)}
          </Badge>
        </Group>

        {booking.status === BookingOpsStatus.REJECTED && (
          <Paper withBorder p="sm" radius="sm" bg="red.0">
            <Text size="sm" c="red.8">
              Your application was not approved. Please contact the dormitory office for more
              information.
            </Text>
          </Paper>
        )}

        <BookingStatusStepper status={booking.status} />

        {(booking.status === BookingOpsStatus.READY_FOR_CHECKIN ||
          booking.status === BookingOpsStatus.CONFIRMED) && (
          <Paper withBorder p="sm" radius="sm" bg="teal.0">
            <Group gap="xs">
              <IconCheck size={16} color="var(--mantine-color-teal-7)" />
              <Text size="sm" c="teal.8" fw={500}>
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
    <Paper withBorder radius="md" p="lg" style={{ borderColor: 'var(--mantine-color-green-4)' }}>
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon size={40} radius="xl" variant="light" color="green">
            <IconDoor size={20} />
          </ThemeIcon>
          <Box>
            <Text fw={600}>You are checked in</Text>
            <Text size="xs" c="dimmed">
              {booking.semesterDisplayName}
            </Text>
          </Box>
        </Group>

        <Stack gap={6}>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={100}>
              Location:
            </Text>
            <Text size="sm" fw={500}>
              {booking.locationPath}
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={100}>
              Room / Bed:
            </Text>
            <Text size="sm" fw={500}>
              {booking.roomName}, Bed {booking.bedLabel}
            </Text>
          </Group>
          {booking.accessCardNumber && (
            <Group gap="xs">
              <Text size="sm" c="dimmed" w={100}>
                Access card:
              </Text>
              <Text size="sm" fw={500}>
                #{booking.accessCardNumber}
              </Text>
            </Group>
          )}
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={100}>
              Check-in:
            </Text>
            <Text size="sm">
              {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleDateString() : '—'}
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" w={100}>
              Check-out:
            </Text>
            <Text size="sm">{new Date(booking.endDate).toLocaleDateString()}</Text>
          </Group>
        </Stack>

        <Group gap="sm">
          <Button
            variant="light"
            color="green"
            leftSection={<IconDoor size={16} />}
            onClick={onViewBooking}
            style={{ flex: 1 }}
          >
            View Booking
          </Button>
          {booking.contractSigned && (
            <Button
              variant="subtle"
              leftSection={<IconFileDownload size={16} />}
              onClick={() => portalBookings.downloadContract(booking.id)}
              style={{ flex: 1 }}
            >
              Contract
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

// ─── Recent notifications strip ───────────────────────────────────────────────

function RecentNotificationsStrip() {
  const [items, setItems] = useState<StudentNotification[]>([]);

  useEffect(() => {
    portalNotifications
      .getAll({ limit: 3 })
      .then(setItems)
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          Recent Notifications
        </Text>
      </Group>
      {items.map((n) => (
        <Card key={n.id} withBorder radius="md" p="sm">
          <Group gap="sm" align="flex-start">
            <ThemeIcon size={28} radius="xl" variant="light" color={n.readAt ? 'gray' : 'blue'}>
              <IconBell size={14} />
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={n.readAt ? 400 : 600} truncate>
                {n.title}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {n.body}
              </Text>
            </Box>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

// ─── Quick stats strip ────────────────────────────────────────────────────────

function QuickStats({ booking }: { booking: StudentCurrentBooking }) {
  const navigate = useNavigate();
  const paymentPending =
    booking.paymentStatus === PaymentStatus.PENDING ||
    booking.paymentStatus === PaymentStatus.PARTIAL;

  return (
    <Group grow gap="sm">
      <Card
        withBorder
        radius="md"
        p="sm"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/financial')}
      >
        <Stack gap={4} align="center">
          <ThemeIcon
            size={32}
            radius="xl"
            variant="light"
            color={paymentPending ? 'orange' : 'green'}
          >
            <IconCreditCard size={16} />
          </ThemeIcon>
          <Text size="xs" c="dimmed" ta="center">
            Payment
          </Text>
          <Text size="xs" fw={600} c={paymentPending ? 'orange' : 'green'}>
            {paymentPending ? 'Pending' : 'Paid'}
          </Text>
        </Stack>
      </Card>

      <Card
        withBorder
        radius="md"
        p="sm"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/booking')}
      >
        <Stack gap={4} align="center">
          <ThemeIcon size={32} radius="xl" variant="light" color="blue">
            <IconBed size={16} />
          </ThemeIcon>
          <Text size="xs" c="dimmed" ta="center">
            Room
          </Text>
          <Text size="xs" fw={600}>
            {booking.roomName}
          </Text>
        </Stack>
      </Card>
    </Group>
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
    <Stack p="md" gap="md" maw={640} mx="auto">
      {/* Greeting */}
      <Box>
        <Title order={4}>Hello, {student?.firstName ?? 'Student'} 👋</Title>
        <Text size="sm" c="dimmed">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Box>

      {isLoading ? (
        <Stack gap="sm">
          <Skeleton height={140} radius="md" />
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
        </Stack>
      ) : (
        <>
          {/* Primary card — based on booking state */}
          {isActive ? (
            <>
              <ActiveResidentCard booking={booking!} onViewBooking={() => navigate('/booking')} />
              <QuickStats booking={booking!} />
            </>
          ) : hasPending ? (
            <PendingBookingCard booking={booking!} />
          ) : (
            <NoBookingCard semesters={semesters} onApply={() => navigate('/apply')} />
          )}

          {/* Recent notifications */}
          <RecentNotificationsStrip />
        </>
      )}
    </Stack>
  );
}
