import { useEffect, useState } from 'react';
import { SimpleGrid, Stack, Paper, Text, Progress, Group } from '@mantine/core';
import { IconCash, IconCashOff, IconCalendarCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { stats } from '@domas/api-client';
import { RectorDashboardStats } from '@domas/ts-types';
import { StatCard, PageHeader, PageShell } from '@domas/ui';

export function RectorFinancesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<RectorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stats
      .getRectorDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const total = data ? data.pendingPayments : 0;
  const overdueRate = total > 0 && data ? Math.round((data.overduePayments / total) * 100) : 0;

  return (
    <>
      <PageHeader title={t('rector.financial_summary')} />
      <PageShell>
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 2, sm: 3 }}>
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
            <StatCard
              label={t('rector.pending_approval')}
              value={data?.pendingApproval}
              icon={<IconCalendarCheck size={18} />}
              color="orange"
              loading={loading}
            />
          </SimpleGrid>

          {!loading && total > 0 && (
            <Paper withBorder p="md" radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    {t('rector.overdue_payments')}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {data?.overduePayments} / {total}
                  </Text>
                </Group>
                <Progress
                  value={overdueRate}
                  color={overdueRate > 50 ? 'red' : overdueRate > 25 ? 'orange' : 'yellow'}
                  size="lg"
                  radius="sm"
                />
                <Text size="xs" c="dimmed">
                  {overdueRate}% {t('rector.overdue_payments').toLowerCase()}
                </Text>
              </Stack>
            </Paper>
          )}
        </Stack>
      </PageShell>
    </>
  );
}
