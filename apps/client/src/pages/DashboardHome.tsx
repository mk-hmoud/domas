import { useEffect, useState } from 'react';
import { Container, Title, Text, SimpleGrid, Stack, Divider, Skeleton } from '@mantine/core';
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
import { stats } from '@domas/api-client';
import { DashboardStats } from '@domas/ts-types';
import { StatCard } from '@domas/ui';
import { useAuth } from '@domas/client-core';

export function DashboardHome() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
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
