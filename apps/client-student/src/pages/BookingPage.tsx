import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconInfoCircle,
  IconKey,
  IconReceipt,
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

  return (
    <Stack gap="lg">
      <Box>
        <Title order={3}>My Booking</Title>
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
        </Grid.Col>

        {/* Right — details via tabs */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Stack gap="md">
            {isRejected && (
              <Alert icon={<IconInfoCircle size={16} />} color="red" radius="md">
                Your application was not approved. Please contact the dormitory office for more
                information.
              </Alert>
            )}

            {!isRejected && (
              <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
                <Tabs defaultValue="details" radius={0}>
                  <Tabs.List px="md" pt="xs">
                    <Tabs.Tab value="details" leftSection={<IconBed size={14} />}>
                      Details
                    </Tabs.Tab>
                    <Tabs.Tab value="financial" leftSection={<IconReceipt size={14} />}>
                      Financial
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
                              Period
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
                                Access Card
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
                                Checked In
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
                              Checked out: {new Date(booking.checkedOutAt).toLocaleDateString()}
                            </Text>
                          </Alert>
                        )}
                      </Stack>
                    </SimpleGrid>
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
                            Payment Status
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

                      <Divider />

                      <Group gap="sm">
                        <Button
                          variant="subtle"
                          size="sm"
                          leftSection={<IconCreditCard size={14} />}
                          onClick={() => navigate('/financial')}
                        >
                          View all transactions
                        </Button>
                        {booking.contractSigned && (
                          <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconFileDownload size={14} />}
                            onClick={() => portalBookings.downloadContract(booking.id)}
                          >
                            Download Contract
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
