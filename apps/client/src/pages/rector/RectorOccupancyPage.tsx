import { useEffect, useState } from 'react';
import { SimpleGrid, Stack, Paper, Text, RingProgress, Group, Center } from '@mantine/core';
import { IconLogin, IconLogout, IconUsers, IconUserOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { stats } from '@domas/api-client';
import { RectorDashboardStats } from '@domas/ts-types';
import { StatCard, PageHeader, PageShell } from '@domas/ui';

export function RectorOccupancyPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<RectorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stats
      .getRectorDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const occupancyRate =
    data && data.totalStudents > 0
      ? Math.round((data.activeResidents / data.totalStudents) * 100)
      : 0;

  return (
    <>
      <PageHeader title={t('rector.nav_occupancy')} />
      <PageShell>
        <Stack gap="xl">
          <Paper withBorder p="lg" radius="md">
            <Center>
              <Stack align="center" gap="xs">
                <RingProgress
                  size={160}
                  thickness={16}
                  roundCaps
                  sections={[{ value: loading ? 0 : occupancyRate, color: 'green' }]}
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <Text fw={700} size="xl" lh={1}>
                          {loading ? '—' : `${occupancyRate}%`}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('rector.occupancy_rate')}
                        </Text>
                      </Stack>
                    </Center>
                  }
                />
                <Group gap="xl">
                  <Stack gap={2} align="center">
                    <Text fw={700} size="lg">
                      {loading ? '—' : (data?.activeResidents ?? 0)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('rector.active_residents')}
                    </Text>
                  </Stack>
                  <Stack gap={2} align="center">
                    <Text fw={700} size="lg">
                      {loading ? '—' : (data?.totalStudents ?? 0)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('rector.total_students')}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Center>
          </Paper>

          <SimpleGrid cols={{ base: 2, sm: 4 }}>
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
      </PageShell>
    </>
  );
}
