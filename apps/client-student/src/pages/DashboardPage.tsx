import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Box,
  Button,
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
  IconCalendarCheck,
  IconCalendarPlus,
  IconCheck,
  IconCreditCard,
  IconDoor,
  IconFileDownload,
  IconKey,
  IconMapPin,
  IconPin,
  IconSparkles,
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

// ─── Stats band ───────────────────────────────────────────────────────────────

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
        <Paper
          key={s.label}
          radius="xl"
          style={{
            cursor: 'pointer',
            border: '1px solid var(--mantine-color-default-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onClick={s.onClick}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'none';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}
        >
          <Group gap={0} wrap="nowrap">
            <Box
              style={{
                width: 4,
                alignSelf: 'stretch',
                background: `var(--mantine-color-${s.color}-5)`,
                flexShrink: 0,
              }}
            />
            <Group gap="sm" p="md" wrap="nowrap" style={{ flex: 1 }}>
              <ThemeIcon
                size={34}
                radius="md"
                variant="light"
                color={s.color}
                style={{ flexShrink: 0 }}
              >
                <s.icon size={17} />
              </ThemeIcon>
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" truncate>
                  {s.label}
                </Text>
                <Text size="sm" fw={700} c={s.color} truncate>
                  {s.value}
                </Text>
              </Box>
            </Group>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

// ─── State A — No booking ─────────────────────────────────────────────────────

function NoBookingCard({
  semesters,
  onApply,
  onPreReserve,
}: {
  semesters: PortalSemester[];
  onApply: () => void;
  onPreReserve: () => void;
}) {
  const { t } = useTranslation();

  if (semesters.length === 0) {
    return (
      <Paper
        radius="xl"
        p="xl"
        style={{
          border: '1px solid var(--mantine-color-default-border)',
          textAlign: 'center',
        }}
      >
        <Stack align="center" gap="sm" py="md">
          <ThemeIcon size={56} radius="xl" variant="light" color="gray">
            <IconBed size={28} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('portal.no_open_semesters')}
          </Text>
          <Text size="sm" c="dimmed" maw={360}>
            {t('portal.no_semesters_description')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  const next = semesters[0];
  return (
    <Paper
      radius="xl"
      style={{
        overflow: 'hidden',
        border: '2px solid var(--mantine-color-blue-4)',
        boxShadow: '0 8px 28px rgba(34,139,230,0.14)',
      }}
    >
      {/* Gradient header strip */}
      <Box
        px="xl"
        py="lg"
        style={{
          background: 'linear-gradient(135deg, #1864AB 0%, #1971C2 50%, #0C8599 100%)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Text
              size="xs"
              c="white"
              fw={600}
              tt="uppercase"
              style={{ letterSpacing: '0.05em', opacity: 0.75, fontSize: 11, marginBottom: 4 }}
            >
              {t('portal.applications_open')}
            </Text>
            <Text fw={800} c="white" size="xl" lh={1.2}>
              {next.displayName}
            </Text>
          </Box>
          <ThemeIcon
            size={48}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <IconCalendarPlus size={24} />
          </ThemeIcon>
        </Group>
      </Box>

      {/* Body */}
      <Box p="xl">
        <Stack gap="xs" mb="lg">
          <Group gap="sm">
            <Text size="sm" c="dimmed" w={110}>
              {t('portal.semester_period')}
            </Text>
            <Text size="sm" fw={500}>
              {new Date(next.startDate).toLocaleDateString()} –{' '}
              {new Date(next.endDate).toLocaleDateString()}
            </Text>
          </Group>
          {next.bookingEndDate && (
            <Group gap="sm">
              <Text size="sm" c="dimmed" w={110}>
                {t('portal.apply_by')}
              </Text>
              <Text size="sm" fw={600} c="orange">
                {new Date(next.bookingEndDate).toLocaleDateString()}
              </Text>
            </Group>
          )}
          <Group gap="sm">
            <Text size="sm" c="dimmed" w={110}>
              {t('portal.deposit_label')}
            </Text>
            <Text size="sm" fw={500}>
              {next.depositAmountTry > 0
                ? `₺${next.depositAmountTry.toLocaleString()}`
                : `${next.depositAmountForeign} ${next.foreignCurrencyCode}`}
            </Text>
          </Group>
        </Stack>
        <Group gap="sm" wrap="wrap">
          <Button
            leftSection={<IconCalendarPlus size={16} />}
            onClick={onApply}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            style={{ boxShadow: '0 4px 14px rgba(34,139,230,0.35)' }}
          >
            {t('portal.apply_now')}
          </Button>
          {semesters.some((s) => s.allowPreReservations) && (
            <Button
              leftSection={<IconCalendarCheck size={16} />}
              onClick={onPreReserve}
              radius="xl"
              variant="light"
              color="teal"
            >
              {t('portal.pre_reserve', { defaultValue: 'Pre-Reserve' })}
            </Button>
          )}
        </Group>
      </Box>
    </Paper>
  );
}

// ─── State B — Pending booking ────────────────────────────────────────────────

function PendingBookingCard({ booking }: { booking: StudentCurrentBooking }) {
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  const color = statusColor(booking.status);

  return (
    <Paper
      radius="xl"
      style={{
        overflow: 'hidden',
        border: `2px solid var(--mantine-color-${color}-4)`,
        boxShadow: `0 6px 24px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Header */}
      <Box
        px="xl"
        py="md"
        style={{
          background: `var(--mantine-color-${color}-light)`,
          borderBottom: `1px solid var(--mantine-color-${color}-3)`,
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={700} size="lg" lh={1.2}>
              {t('portal.your_application')}
            </Text>
            <Group gap={4} mt={2}>
              <IconMapPin size={13} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">
                {booking.semesterDisplayName}
              </Text>
            </Group>
          </Box>
          <Badge color={color} variant="filled" radius="xl" size="lg" style={{ flexShrink: 0 }}>
            {statusLabel(booking.status)}
          </Badge>
        </Group>
      </Box>

      <Box p="xl">
        <Stack gap="lg">
          {booking.status === BookingOpsStatus.REJECTED && (
            <Paper
              radius="lg"
              p="sm"
              style={{
                background: 'var(--mantine-color-red-light)',
                border: '1px solid var(--mantine-color-red-3)',
              }}
            >
              <Text size="sm" c="red">
                {t('portal.application_rejected_message')}
              </Text>
            </Paper>
          )}

          {(booking.status === BookingOpsStatus.READY_FOR_CHECKIN ||
            booking.status === BookingOpsStatus.CONFIRMED) && (
            <Paper
              radius="lg"
              p="sm"
              style={{
                background: 'var(--mantine-color-teal-light)',
                border: '1px solid var(--mantine-color-teal-3)',
              }}
            >
              <Group gap="xs">
                <IconCheck size={16} color="var(--mantine-color-teal-6)" />
                <Text size="sm" c="teal" fw={600}>
                  {t('portal.application_approved_message')}
                </Text>
              </Group>
            </Paper>
          )}

          <BookingStatusStepper status={booking.status} />

          <Group gap="xs">
            <ThemeIcon variant="light" size={22} radius="md" color="blue">
              <IconBed size={12} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {booking.locationPath} — {booking.roomName},{' '}
              {t('portal.bed_label', { label: booking.bedLabel })}
            </Text>
          </Group>
        </Stack>
      </Box>
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
    <Paper
      radius="xl"
      style={{
        overflow: 'hidden',
        border: '2px solid var(--mantine-color-green-4)',
        boxShadow: '0 6px 24px rgba(64,192,87,0.14)',
      }}
    >
      {/* Gradient header */}
      <Box
        px="xl"
        py="lg"
        style={{
          background: 'linear-gradient(135deg, #2F9E44 0%, #37B24D 50%, #2B8A3E 100%)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Text
              size="xs"
              c="white"
              fw={600}
              tt="uppercase"
              style={{ letterSpacing: '0.05em', opacity: 0.8, fontSize: 11, marginBottom: 4 }}
            >
              {t('portal.status_active')}
            </Text>
            <Text fw={800} c="white" size="xl" lh={1.2}>
              {t('portal.active_resident_title')}
            </Text>
            <Text size="xs" c="white" style={{ opacity: 0.8, marginTop: 4 }}>
              {booking.semesterDisplayName}
            </Text>
          </Box>
          <ThemeIcon
            size={52}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <IconDoor size={26} />
          </ThemeIcon>
        </Group>
      </Box>

      <Box p="xl">
        <Stack gap="lg">
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
                <Text size="sm" fw={600}>
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

          {booking.roomTypeName && (
            <Paper
              radius="lg"
              p="sm"
              style={{
                background: 'var(--mantine-color-blue-light)',
                border: '1px solid var(--mantine-color-blue-3)',
              }}
            >
              <Group gap="xs" mb={booking.roomTypeAmenities?.length ? 8 : 0}>
                <IconSparkles size={14} color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={700} c="blue">
                  {booking.roomTypeName}
                </Text>
              </Group>
              {booking.roomTypeAmenities && booking.roomTypeAmenities.length > 0 && (
                <Group gap={4} wrap="wrap">
                  {booking.roomTypeAmenities.slice(0, 4).map((a) => (
                    <Badge key={a} size="xs" variant="light" color="blue">
                      {a}
                    </Badge>
                  ))}
                  {booking.roomTypeAmenities.length > 4 && (
                    <Text size="xs" c="dimmed">
                      +{booking.roomTypeAmenities.length - 4}
                    </Text>
                  )}
                </Group>
              )}
            </Paper>
          )}

          <Group gap="sm" wrap="wrap">
            <Button
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              leftSection={<IconDoor size={16} />}
              onClick={onViewBooking}
              radius="xl"
              style={{ boxShadow: '0 4px 14px rgba(64,192,87,0.3)' }}
            >
              {t('portal.view_full_details')}
            </Button>
            {booking.contractSigned && (
              <Button
                variant="light"
                color="gray"
                leftSection={<IconFileDownload size={16} />}
                onClick={() => portalBookings.downloadContract(booking.id)}
                radius="xl"
              >
                {t('portal.contract')}
              </Button>
            )}
          </Group>
        </Stack>
      </Box>
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
    <Paper
      radius="xl"
      p="lg"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Group justify="space-between" mb="md" align="center">
        <Text fw={700} size="sm">
          {t('portal.nav_announcements', { defaultValue: 'Announcements' })}
        </Text>
        <Text
          size="xs"
          c="blue"
          fw={500}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/announcements')}
        >
          {t('portal.view_all')}
        </Text>
      </Group>

      <Stack gap="sm">
        {isLoading ? (
          <>
            <Skeleton height={60} radius="lg" />
            <Skeleton height={60} radius="lg" />
          </>
        ) : (
          items.map((item) => (
            <Paper
              key={item.id}
              radius="lg"
              p="sm"
              style={{
                background: item.pinned
                  ? 'var(--mantine-color-orange-light)'
                  : 'var(--mantine-color-default-hover)',
                border: `1px solid ${item.pinned ? 'var(--mantine-color-orange-3)' : 'transparent'}`,
              }}
            >
              <Group gap={6} mb={4}>
                {item.pinned && <IconPin size={12} color="var(--mantine-color-orange-6)" />}
                <Text size="sm" fw={600} lineClamp={1}>
                  {item.title}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={2}>
                {item.body}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {item.createdByName && `${item.createdByName} · `}
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
              </Text>
            </Paper>
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
    <Paper
      radius="xl"
      p="lg"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Group justify="space-between" mb="md" align="center">
        <Text fw={700} size="sm">
          {t('portal.recent_notifications')}
        </Text>
        <Text
          size="xs"
          c="blue"
          fw={500}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/notifications')}
        >
          {t('portal.view_all')}
        </Text>
      </Group>

      <Stack gap="sm">
        {isLoading ? (
          <>
            <Skeleton height={60} radius="lg" />
            <Skeleton height={60} radius="lg" />
            <Skeleton height={60} radius="lg" />
          </>
        ) : items.length === 0 ? (
          <Box py="lg" style={{ textAlign: 'center' }}>
            <ThemeIcon size={38} radius="xl" variant="light" color="gray" mx="auto" mb="xs">
              <IconBell size={20} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {t('portal.no_notifications')}
            </Text>
          </Box>
        ) : (
          items.map((n) => (
            <Paper
              key={n.id}
              radius="lg"
              p="sm"
              style={{
                background: !n.readAt
                  ? 'var(--mantine-color-blue-light)'
                  : 'var(--mantine-color-default-hover)',
                border: `1px solid ${!n.readAt ? 'var(--mantine-color-blue-3)' : 'transparent'}`,
              }}
            >
              <Group gap="xs" mb={2} wrap="nowrap">
                <Box
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: !n.readAt ? 'var(--mantine-color-blue-5)' : 'transparent',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <Text size="sm" fw={!n.readAt ? 600 : 400} lineClamp={1}>
                  {n.title}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={1} pl={15}>
                {n.body}
              </Text>
              <Text size="xs" c="dimmed" mt={2} pl={15}>
                {new Date(n.createdAt).toLocaleString()}
              </Text>
            </Paper>
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

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? t('portal.greeting_morning', {
          defaultValue: 'Good morning',
          name: student?.firstName ?? t('student'),
        })
      : hour < 18
        ? t('portal.greeting_afternoon', {
            defaultValue: 'Good afternoon',
            name: student?.firstName ?? t('student'),
          })
        : t('portal.greeting_evening', {
            defaultValue: 'Good evening',
            name: student?.firstName ?? t('student'),
          });

  return (
    <Stack gap="lg">
      {/* Greeting hero */}
      <Paper
        radius="xl"
        px="xl"
        py="lg"
        style={{
          background: 'linear-gradient(135deg, #1864AB 0%, #1971C2 45%, #0C8599 100%)',
          boxShadow: '0 6px 24px rgba(25,113,194,0.22)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box>
            <Text
              size="xs"
              c="white"
              fw={600}
              style={{
                opacity: 0.75,
                marginBottom: 4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              {now.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Title order={2} c="white" fw={800} lh={1.2}>
              {greeting}
            </Title>
            {student && (
              <Text size="sm" c="white" style={{ opacity: 0.8, marginTop: 4 }}>
                {student.studentNumber} · {student.department}
              </Text>
            )}
          </Box>
          <ThemeIcon
            size={56}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <IconBed size={28} />
          </ThemeIcon>
        </Group>
      </Paper>

      {isLoading ? (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Skeleton height={72} radius="xl" />
            <Skeleton height={72} radius="xl" />
            <Skeleton height={72} radius="xl" />
            <Skeleton height={72} radius="xl" />
          </SimpleGrid>
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Skeleton height={280} radius="xl" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Skeleton height={280} radius="xl" />
            </Grid.Col>
          </Grid>
        </>
      ) : (
        <>
          {booking && <StatsBand booking={booking} />}

          <Grid gutter="lg" align="flex-start">
            <Grid.Col span={{ base: 12, md: 7 }}>
              {isActive ? (
                <ActiveResidentCard booking={booking!} onViewBooking={() => navigate('/booking')} />
              ) : hasPending ? (
                <PendingBookingCard booking={booking!} />
              ) : (
                <NoBookingCard
                  semesters={semesters}
                  onApply={() => navigate('/apply')}
                  onPreReserve={() => navigate('/pre-reserve')}
                />
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
