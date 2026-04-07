import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
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
  IconInfoCircle,
  IconKey,
} from '@tabler/icons-react';
import { BookingOpsStatus, PaymentStatus } from '@domas/ts-types';
import { portalBookings } from '@domas/api-client';
import { useCurrentBooking } from '../hooks/useCurrentBooking';
import { BookingStatusStepper } from '../components/BookingStatusStepper';

function paymentLabel(status: PaymentStatus): { label: string; color: string } {
  switch (status) {
    case PaymentStatus.PAID:
      return { label: 'Paid', color: 'green' };
    case PaymentStatus.PARTIAL:
      return { label: 'Partially Paid', color: 'orange' };
    case PaymentStatus.PENDING:
      return { label: 'Pending', color: 'red' };
    case PaymentStatus.FAILED:
      return { label: 'Failed', color: 'red' };
    case PaymentStatus.REFUNDED:
      return { label: 'Refunded', color: 'gray' };
    default:
      return { label: status, color: 'gray' };
  }
}

export function BookingPage() {
  const navigate = useNavigate();
  const { booking, isLoading } = useCurrentBooking();

  // Redirect to apply if no booking
  useEffect(() => {
    if (!isLoading && booking === null) {
      navigate('/apply', { replace: true });
    }
  }, [isLoading, booking, navigate]);

  if (isLoading || booking === null) {
    return (
      <Stack p="md" gap="md" maw={640} mx="auto">
        <Skeleton height={32} width={200} radius="md" />
        <Skeleton height={280} radius="md" />
        <Skeleton height={120} radius="md" />
      </Stack>
    );
  }

  const isActive = booking.status === BookingOpsStatus.ACTIVE;
  const isRejected = booking.status === BookingOpsStatus.REJECTED;
  const pmtInfo = paymentLabel(booking.paymentStatus);

  return (
    <Stack p="md" gap="md" maw={640} mx="auto">
      <Box>
        <Title order={4}>My Booking</Title>
        <Text size="sm" c="dimmed">
          {booking.semesterDisplayName}
        </Text>
      </Box>

      {/* Status stepper */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">
              Application Status
            </Text>
            <Badge
              color={isRejected ? 'red' : isActive ? 'green' : 'blue'}
              variant="light"
              radius="sm"
            >
              {isActive
                ? 'Active'
                : isRejected
                  ? 'Not Approved'
                  : booking.status === BookingOpsStatus.READY_FOR_CHECKIN ||
                      booking.status === BookingOpsStatus.CONFIRMED
                    ? 'Ready for Check-In'
                    : 'Under Review'}
            </Badge>
          </Group>
          <BookingStatusStepper status={booking.status} />
        </Stack>
      </Paper>

      {/* Rejection alert */}
      {isRejected && (
        <Alert icon={<IconInfoCircle size={16} />} color="red" radius="md">
          Your application was not approved. Please contact the dormitory office for more
          information.
        </Alert>
      )}

      {/* Room details — only show when approved/active */}
      {!isRejected && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Accommodation Details
            </Text>
            <Divider />

            <Group gap="sm">
              <ThemeIcon size={28} radius="xl" variant="light" color="blue">
                <IconBed size={14} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">
                  Room / Bed
                </Text>
                <Text size="sm" fw={500}>
                  {booking.roomName} — Bed {booking.bedLabel}
                </Text>
                <Text size="xs" c="dimmed">
                  {booking.locationPath}
                </Text>
              </Box>
            </Group>

            {isActive && booking.accessCardNumber && (
              <Group gap="sm">
                <ThemeIcon size={28} radius="xl" variant="light" color="grape">
                  <IconKey size={14} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">
                    Access Card
                  </Text>
                  <Text size="sm" fw={500}>
                    #{booking.accessCardNumber}
                  </Text>
                </Box>
              </Group>
            )}

            <Group gap="sm">
              <ThemeIcon size={28} radius="xl" variant="light" color="teal">
                <IconCalendar size={14} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">
                  Period
                </Text>
                <Text size="sm">
                  {new Date(booking.startDate).toLocaleDateString()} –{' '}
                  {new Date(booking.endDate).toLocaleDateString()}
                </Text>
                {booking.checkedInAt && (
                  <Text size="xs" c="dimmed">
                    Checked in: {new Date(booking.checkedInAt).toLocaleDateString()}
                  </Text>
                )}
              </Box>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Financial summary */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size={24} radius="xl" variant="light" color={pmtInfo.color}>
                <IconCreditCard size={12} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Payment
              </Text>
            </Group>
            <Badge color={pmtInfo.color} variant="light" radius="sm">
              {pmtInfo.label}
            </Badge>
          </Group>

          <Divider />

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Deposit:
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
                Payment deadline:
              </Text>
              <Text size="sm" c="orange">
                {new Date(booking.paymentDeadlineDate).toLocaleDateString()}
              </Text>
            </Group>
          )}

          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconCreditCard size={14} />}
            onClick={() => navigate('/financial')}
            style={{ alignSelf: 'flex-start' }}
          >
            View all transactions
          </Button>
        </Stack>
      </Paper>

      {/* Contract download */}
      {booking.contractSigned && (
        <Button
          variant="light"
          leftSection={
            <ThemeIcon size={18} variant="transparent">
              <IconFileDownload size={14} />
            </ThemeIcon>
          }
          onClick={() => portalBookings.downloadContract(booking.id)}
        >
          Download Contract
        </Button>
      )}

      {/* Check-out info */}
      {booking.checkedOutAt && (
        <Alert icon={<IconDoor size={16} />} color="gray" radius="md">
          You checked out on {new Date(booking.checkedOutAt).toLocaleDateString()}.
        </Alert>
      )}
    </Stack>
  );
}
