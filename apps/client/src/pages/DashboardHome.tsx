import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Stack,
  Divider,
  Paper,
  Table,
  Group,
  Anchor,
  Badge,
} from '@mantine/core';
import {
  IconCalendarCheck,
  IconHome,
  IconLogin,
  IconLogout,
  IconAlertTriangle,
  IconUsers,
  IconUserOff,
  IconCash,
  IconCashOff,
  IconUserCheck,
  IconDoorEnter,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { stats } from '@domas/api-client';
import { DashboardStats } from '@domas/ts-types';
import { StatCard } from '@domas/ui';
import { useAuth } from '@domas/client-core';

export function DashboardHome() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stats
      .getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const showBookings = hasPermission('bookings.view');
  const showDamages = hasPermission('damages.view');
  const showGuests = hasPermission('guests.manage');
  const showStudents = hasPermission('students.view');
  const showFinances = hasPermission('bookings.approve_financial');

  const hasAnySection = showBookings || showDamages || showGuests || showStudents || showFinances;

  if (!hasAnySection) {
    return (
      <Container size="lg" py="xl">
        <Title>{t('dashboard.staff_dashboard_title')}</Title>
        <Text mt="md" c="dimmed">
          {t('dashboard.staff_portal_intro')}
        </Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title>{t('dashboard.staff_dashboard_title')}</Title>
          <Text c="dimmed" size="sm" mt={4}>
            {t('dashboard.staff_portal_intro')}
          </Text>
        </div>

        {showBookings && (
          <Stack gap="sm">
            <Divider label={t('dashboard.section_bookings')} labelPosition="left" />
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
              <StatCard
                label={t('dashboard.stat_pending_approval')}
                value={data?.bookings?.pendingApproval}
                icon={<IconCalendarCheck size={18} />}
                color="orange"
                loading={loading}
              />
              <StatCard
                label={t('dashboard.stat_active_residents')}
                value={data?.bookings?.activeResidents}
                icon={<IconHome size={18} />}
                color="green"
                loading={loading}
              />
              <StatCard
                label={t('dashboard.stat_check_ins_today')}
                value={data?.bookings?.checkInsToday}
                icon={<IconLogin size={18} />}
                color="blue"
                loading={loading}
                suffix={t('today', 'today')}
              />
              <StatCard
                label={t('dashboard.stat_check_outs_today')}
                value={data?.bookings?.checkOutsToday}
                icon={<IconLogout size={18} />}
                color="grape"
                loading={loading}
                suffix={t('today', 'today')}
              />
            </SimpleGrid>

            {!loading && (data?.pendingBookings?.length ?? 0) > 0 && (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Group justify="space-between" px="md" py="xs">
                  <Text size="sm" fw={600}>
                    {t('dashboard.pending_bookings_list', 'Pending Financial Approval')}
                  </Text>
                  <Anchor size="xs" onClick={() => navigate('/bookings')}>
                    {t('view_all', 'View all')}
                  </Anchor>
                </Group>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('student')}</Table.Th>
                      <Table.Th>{t('location')}</Table.Th>
                      <Table.Th>{t('start_date', 'Start')}</Table.Th>
                      <Table.Th>{t('end_date', 'End')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data?.pendingBookings?.map((b) => (
                      <Table.Tr key={b.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {b.studentName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {b.studentNumber}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{b.locationPath}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{new Date(b.startDate).toLocaleDateString()}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{new Date(b.endDate).toLocaleDateString()}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        )}

        {showDamages && (
          <Stack gap="sm">
            <Divider label={t('dashboard.section_damages')} labelPosition="left" />
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
              <StatCard
                label={t('dashboard.stat_pending_damage_reports')}
                value={data?.damages?.pendingReports}
                icon={<IconAlertTriangle size={18} />}
                color="red"
                loading={loading}
              />
            </SimpleGrid>

            {!loading && (data?.pendingDamages?.length ?? 0) > 0 && (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Group justify="space-between" px="md" py="xs">
                  <Text size="sm" fw={600}>
                    {t('dashboard.pending_damages_list', 'Pending Damage Reports')}
                  </Text>
                  <Anchor size="xs" onClick={() => navigate('/damages')}>
                    {t('view_all', 'View all')}
                  </Anchor>
                </Group>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('location')}</Table.Th>
                      <Table.Th>{t('description')}</Table.Th>
                      <Table.Th>{t('date')}</Table.Th>
                      <Table.Th>{t('status')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data?.pendingDamages?.map((d) => (
                      <Table.Tr key={d.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {d.locationName}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {d.description}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {new Date(d.reportedAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="orange" variant="light" size="sm">
                            {t('damage_status.pending', 'Pending')}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        )}

        {showGuests && (
          <Stack gap="sm">
            <Divider label={t('dashboard.section_guests')} labelPosition="left" />
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
              <StatCard
                label={t('dashboard.stat_active_guest_stays')}
                value={data?.guests?.activeStays}
                icon={<IconUserCheck size={18} />}
                color="teal"
                loading={loading}
              />
              <StatCard
                label={t('dashboard.stat_guest_check_ins_today')}
                value={data?.guests?.checkInsToday}
                icon={<IconDoorEnter size={18} />}
                color="cyan"
                loading={loading}
                suffix={t('today', 'today')}
              />
            </SimpleGrid>
          </Stack>
        )}

        {showStudents && (
          <Stack gap="sm">
            <Divider label={t('dashboard.section_students')} labelPosition="left" />
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
              <StatCard
                label={t('dashboard.stat_total_students')}
                value={data?.students?.total}
                icon={<IconUsers size={18} />}
                color="blue"
                loading={loading}
              />
              <StatCard
                label={t('dashboard.stat_students_without_booking')}
                value={data?.students?.withoutActiveBooking}
                icon={<IconUserOff size={18} />}
                color="yellow"
                loading={loading}
              />
            </SimpleGrid>
          </Stack>
        )}

        {showFinances && (
          <Stack gap="sm">
            <Divider label={t('dashboard.section_finances')} labelPosition="left" />
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
              <StatCard
                label={t('dashboard.stat_pending_payments')}
                value={data?.finances?.pendingPayments}
                icon={<IconCash size={18} />}
                color="indigo"
                loading={loading}
              />
              <StatCard
                label={t('dashboard.stat_overdue_payments')}
                value={data?.finances?.overdueCount}
                icon={<IconCashOff size={18} />}
                color="red"
                loading={loading}
              />
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
