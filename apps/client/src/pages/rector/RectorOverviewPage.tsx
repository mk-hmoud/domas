import { useEffect, useState } from 'react';
import { SimpleGrid, Stack, Divider } from '@mantine/core';
import {
  IconHome,
  IconLogin,
  IconLogout,
  IconCalendarCheck,
  IconUsers,
  IconUserOff,
  IconCash,
  IconCashOff,
  IconAlertTriangle,
  IconArrowsLeftRight,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { stats } from '@domas/api-client';
import { RectorDashboardStats } from '@domas/ts-types';
import { StatCard, PageHeader, PageShell } from '@domas/ui';

export function RectorOverviewPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<RectorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stats
      .getRectorDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t('rector.nav_overview')} />
      <PageShell>
        <Stack gap="xl">
          <Stack gap="sm">
            <Divider label={t('dashboard.section_bookings')} labelPosition="left" />
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <StatCard
                label={t('rector.active_residents')}
                value={data?.activeResidents}
                icon={<IconHome size={18} />}
                color="green"
                loading={loading}
              />
              <StatCard
                label={t('rector.pending_approval')}
                value={data?.pendingApproval}
                icon={<IconCalendarCheck size={18} />}
                color="orange"
                loading={loading}
              />
              <StatCard
                label={t('rector.check_ins_today')}
                value={data?.checkInsToday}
                icon={<IconLogin size={18} />}
                color="blue"
                loading={loading}
              />
              <StatCard
                label={t('rector.check_outs_today')}
                value={data?.checkOutsToday}
                icon={<IconLogout size={18} />}
                color="grape"
                loading={loading}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap="sm">
            <Divider label={t('dashboard.section_students')} labelPosition="left" />
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <StatCard
                label={t('rector.total_students')}
                value={data?.totalStudents}
                icon={<IconUsers size={18} />}
                color="blue"
                loading={loading}
              />
              <StatCard
                label={t('rector.students_without_booking')}
                value={data?.studentsWithoutBooking}
                icon={<IconUserOff size={18} />}
                color="yellow"
                loading={loading}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap="sm">
            <Divider label={t('rector.financial_summary')} labelPosition="left" />
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <StatCard
                label={t('rector.pending_payments')}
                value={data?.pendingPayments}
                icon={<IconCash size={18} />}
                color="indigo"
                loading={loading}
              />
              <StatCard
                label={t('rector.overdue_payments')}
                value={data?.overduePayments}
                icon={<IconCashOff size={18} />}
                color="red"
                loading={loading}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap="sm">
            <Divider label={t('rector.issues_summary')} labelPosition="left" />
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <StatCard
                label={t('rector.pending_damages')}
                value={data?.pendingDamages}
                icon={<IconAlertTriangle size={18} />}
                color="red"
                loading={loading}
              />
              <StatCard
                label={t('rector.pending_room_changes')}
                value={data?.pendingRoomChanges}
                icon={<IconArrowsLeftRight size={18} />}
                color="teal"
                loading={loading}
              />
            </SimpleGrid>
          </Stack>
        </Stack>
      </PageShell>
    </>
  );
}
