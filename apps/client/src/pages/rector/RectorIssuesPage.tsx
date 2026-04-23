import { useEffect, useState } from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { IconAlertTriangle, IconArrowsLeftRight, IconCalendarCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { stats } from '@domas/api-client';
import { RectorDashboardStats } from '@domas/ts-types';
import { StatCard, PageHeader, PageShell } from '@domas/ui';

export function RectorIssuesPage() {
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
      <PageHeader title={t('rector.issues_summary')} />
      <PageShell>
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 2, sm: 3 }}>
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
            <StatCard
              label={t('rector.pending_approval')}
              value={data?.pendingApproval}
              icon={<IconCalendarCheck size={18} />}
              color="orange"
              loading={loading}
            />
          </SimpleGrid>
        </Stack>
      </PageShell>
    </>
  );
}
